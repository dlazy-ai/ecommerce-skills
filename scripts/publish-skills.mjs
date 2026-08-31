#!/usr/bin/env node
/**
 * 把 skills/ 下的技能逐个发布到 ClawHub。
 *
 * 三件本仓库特有、必须在发布前处理的事：
 *
 * 1. 文件名是 skill.md，ClawHub 要 SKILL.md；
 * 2. 技能里的素材引用是 ../../docs/…，指向仓库里、技能目录之外的文件，
 *    发布包带不上，必须换成 GitHub 上的绝对地址，否则线上全是碎图；
 * 3. 跨技能链接 ../<name>/skill.md 同理，换成 GitHub blob 地址。
 *
 * 所以脚本不直接发 skills/<name>/，而是先在 .publish-tmp/<slug>/ 里生成一份
 * 改写好的 SKILL.md 再发；源文件一个字节都不动。
 *
 * displayName 必须走 `clawhub publish --name`：`clawhub sync` 没有这个参数，
 * 会把中文名重算成 slug 的 Title Case。名字维护在 scripts/skill-display-names.json。
 *
 * 版本号取「线上最新版 + 1 patch」，本地不记版本，所以可以反复重跑。
 *
 *   node scripts/publish-skills.mjs [options]
 *
 *     --dry-run              只打印将要发的 slug / 版本 / 显示名，不落地也不发布
 *     --only <slug[,slug]>   只发指定技能
 *     --force                忽略断点记录，全部重发
 *     --owner <handle>       以某个 publisher 身份发布（默认取 git remote 的 owner）
 *     --ref <git-ref>        素材绝对地址用哪个 ref（默认 main）
 *     --repo <owner/repo>    覆盖自动探测的 GitHub 仓库
 *     --commit <sha>         覆盖自动探测的 source commit（clawhub 要求与 --source-repo 同时给）
 *     --tags <a,b>           传给 clawhub 的 tags（默认 latest）
 *     --changelog <text>     changelog 文案
 *     --keep-staging         保留 .publish-tmp/ 便于排查改写结果
 */
import { exec } from "node:child_process";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const execAsync = promisify(exec);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const SKILLS_DIR = path.join(ROOT, "skills");
const DOCS_DIR = path.join(ROOT, "docs");
const NAMES_FILE = path.join(__dirname, "skill-display-names.json");
const STATE_FILE = path.join(__dirname, ".publish-skills.done");
const STAGING_DIR = path.join(ROOT, ".publish-tmp");
const API = "https://clawhub.ai/api/v1/skills";

const argv = process.argv.slice(2);
const flag = (name) => argv.includes(name);
const opt = (name, fallback) => {
	const i = argv.indexOf(name);
	return i !== -1 && argv[i + 1] ? argv[i + 1] : fallback;
};

const dryRun = flag("--dry-run");
const force = flag("--force");
const keepStaging = flag("--keep-staging");
const only = flag("--only") ? new Set(opt("--only", "").split(",")) : null;
const ref = opt("--ref", "main");
const tags = opt("--tags", "latest");
const changelog = opt("--changelog", "Sync from GitHub");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const q = (s) => `"${String(s).replace(/"/g, '\\"')}"`;

const bumpPatch = (v) => {
	const [maj = 1, min = 0, pat = 0] = String(v)
		.split(".")
		.map((n) => Number.parseInt(n, 10) || 0);
	return `${maj}.${min}.${pat + 1}`;
};

// ---------- 仓库信息：素材绝对地址从这里拼 ----------

const gitOut = (cmd) => {
	try {
		return execSync(cmd, { cwd: ROOT, encoding: "utf8" }).trim();
	} catch {
		return "";
	}
};

const detectRepo = () => {
	const url = gitOut("git remote get-url origin");
	const m = url.match(/[:/]([^/:]+)\/([^/]+?)(?:\.git)?$/);
	return m ? `${m[1]}/${m[2]}` : "";
};

const repo = opt("--repo", detectRepo());
if (!repo) {
	console.error("探测不到 GitHub 仓库，请用 --repo <owner/repo> 指定");
	process.exit(1);
}
// ClawHub 的 publisher handle 是 dlazyai，跟 GitHub 组织名不是一回事：
// 2026-08-31 GitHub 组织从 dlazyai 改名成 dlazy-ai，再从 git remote 推 owner
// 就会把技能发到不存在的 dlazy-ai 账号下。所以写死，别再从 repo 推断。
const CLAWHUB_OWNER = "dlazyai";
const owner = opt("--owner", CLAWHUB_OWNER);

// clawhub publish 的 --source-repo 必须和 --source-commit 一起给，
// 只给 ref 会被 CLI 直接拒掉。素材地址走的是 <ref> 在 GitHub 上的状态，
// 所以优先取 origin/<ref>，取不到再退回本地 <ref> / HEAD。
const commit =
	opt("--commit", "") ||
	gitOut(`git rev-parse origin/${ref}`) ||
	gitOut(`git rev-parse ${ref}`) ||
	gitOut("git rev-parse HEAD");
if (!commit) {
	console.error(
		`探测不到 ${ref} 对应的 commit，请用 --commit <sha> 指定`,
	);
	process.exit(1);
}

const RAW = `https://raw.githubusercontent.com/${repo}/${ref}`;
const BLOB = `https://github.com/${repo}/blob/${ref}`;

// ---------- 内容改写 ----------

/** 把技能里所有仓库内相对路径换成 GitHub 上的绝对地址 */
const rewriteLinks = (md, missing) => {
	const track = (rel) => {
		if (!fs.existsSync(path.join(ROOT, rel))) missing.push(rel);
	};
	return (
		md
			// <img src="../../docs/x/y.jpg"> —— 必须是 raw，blob 地址渲染不出图
			.replace(/src="\.\.\/\.\.\/docs\/([^"]+)"/g, (_, p) => {
				track(`docs/${p}`);
				return `src="${RAW}/docs/${p}"`;
			})
			// [文字](../../docs/x/y.md) —— 文档链接给 blob，带 GitHub 的渲染
			.replace(/\]\(\.\.\/\.\.\/docs\/([^)]+)\)/g, (_, p) => {
				track(`docs/${p}`);
				return `](${BLOB}/docs/${p})`;
			})
			// [文字](../other-skill/skill.md) —— 跨技能引用
			.replace(/\]\(\.\.\/([a-z0-9.-]+)\/skill\.md\)/g, (_, name) => {
				track(`skills/${name}/skill.md`);
				return `](${BLOB}/skills/${name}/skill.md)`;
			})
	);
};

/** 在 frontmatter 的 name 后面补一行 version，让线上 SKILL.md 自带版本号 */
const withVersion = (md, version) => {
	if (/^version:\s*/m.test(md))
		return md.replace(/^version:\s*.+$/m, `version: ${version}`);
	return md.replace(/^(name:\s*.+)$/m, `$1\nversion: ${version}`);
};

const parseFrontmatter = (md) => {
	const m = md.match(/^---\n([\s\S]*?)\n---/);
	if (!m) return null;
	const name = m[1].match(/^name:\s*(.+)$/m);
	const description = m[1].match(/^description:\s*(.+)$/m);
	return {
		name: name?.[1].trim(),
		description: description?.[1].trim(),
	};
};

// ---------- 线上状态 ----------

const fetchRemote = async (slug) => {
	try {
		// 必须带 owner：别的作者可能占用同名 slug，不带会取到别人的技能
		const res = await fetch(`${API}/${slug}?owner=${encodeURIComponent(owner)}`);
		if (!res.ok) return null;
		const j = await res.json();
		return {
			displayName: j.skill?.displayName ?? "",
			latest: j.latestVersion?.version ?? j.skill?.latestVersion ?? null,
		};
	} catch {
		return null;
	}
};

const publish = async (dir, version, displayName, slug) => {
	const cmd = [
		"npx clawhub publish",
		q(dir),
		`--slug ${q(slug)}`,
		`--version ${version}`,
		`--name ${q(displayName)}`,
		`--owner ${q(owner)}`,
		`--tags ${q(tags)}`,
		`--changelog ${q(changelog)}`,
		`--source-repo ${q(repo)}`,
		`--source-ref ${q(ref)}`,
		`--source-commit ${q(commit)}`,
		`--source-path ${q(`skills/${slug}`)}`,
	].join(" ");
	const { stdout, stderr } = await execAsync(cmd, {
		cwd: ROOT,
		maxBuffer: 10 * 1024 * 1024,
	});
	return `${stdout}\n${stderr}`;
};

// ---------- 主流程 ----------

const names = JSON.parse(fs.readFileSync(NAMES_FILE, "utf8")).names;
const dirs = fs
	.readdirSync(SKILLS_DIR, { withFileTypes: true })
	.filter((d) => d.isDirectory())
	.map((d) => d.name)
	.sort();

const unnamed = dirs.filter((d) => !names[d]);
if (unnamed.length) {
	console.error(
		`缺少中文名映射（${unnamed.length}）：${unnamed.join(", ")}\n` +
			`请在 scripts/skill-display-names.json 里补齐再发布。`,
	);
	process.exit(1);
}

if (!fs.existsSync(DOCS_DIR)) {
	console.error("找不到 docs/，素材路径无法校验");
	process.exit(1);
}

// 素材地址指向 <ref>，本地改了没推上去，线上就是碎图
const dirty = gitOut("git status --porcelain -- docs skills");
if (dirty && !dryRun) {
	console.log(
		`WARN  docs/ 或 skills/ 有未提交改动，素材地址指向 ${repo}@${ref}，` +
			`记得先 push 再发布：\n${dirty}`,
	);
}

if (force && !dryRun && fs.existsSync(STATE_FILE)) fs.rmSync(STATE_FILE);
const done = fs.existsSync(STATE_FILE)
	? new Set(fs.readFileSync(STATE_FILE, "utf8").split("\n").filter(Boolean))
	: new Set();

if (!dryRun) fs.mkdirSync(STAGING_DIR, { recursive: true });

let ok = 0;
let skipped = 0;
const failed = [];

for (const slug of dirs) {
	if (only && !only.has(slug)) continue;
	if (!force && done.has(slug)) {
		skipped++;
		continue;
	}

	const srcPath = path.join(SKILLS_DIR, slug, "skill.md");
	if (!fs.existsSync(srcPath)) {
		console.log(`SKIP  ${slug}  没有 skill.md`);
		skipped++;
		continue;
	}

	const raw = fs.readFileSync(srcPath, "utf8");
	const fm = parseFrontmatter(raw);
	if (!fm?.name || !fm?.description) {
		console.log(`FAIL  ${slug}  frontmatter 缺 name 或 description`);
		failed.push(slug);
		continue;
	}
	if (fm.name !== slug) {
		console.log(`FAIL  ${slug}  frontmatter name 是「${fm.name}」，与目录名不一致`);
		failed.push(slug);
		continue;
	}

	const missing = [];
	const rewritten = rewriteLinks(raw, missing);
	if (missing.length) {
		console.log(`FAIL  ${slug}  引用的文件不存在：${[...new Set(missing)].join(", ")}`);
		failed.push(slug);
		continue;
	}

	const remote = await fetchRemote(slug);
	let version = remote?.latest ? bumpPatch(remote.latest) : "1.0.0";
	const displayName = names[slug];

	if (dryRun) {
		console.log(
			`DRY   ${slug}  ${remote?.latest ?? "NEW"} -> ${version}  「${displayName}」`,
		);
		continue;
	}

	const stageDir = path.join(STAGING_DIR, slug);
	fs.rmSync(stageDir, { recursive: true, force: true });
	fs.mkdirSync(stageDir, { recursive: true });

	// 技能自带的 scripts/ references/ examples/ 必须一起发：
	// skill.md 里的「延伸阅读」指向它们，文档里的命令也要它们才能跑。
	// 只发 SKILL.md 的话，线上装到的是一个死链加空命令的壳子。
	for (const entry of fs.readdirSync(path.join(SKILLS_DIR, slug), { withFileTypes: true })) {
		if (entry.name === "skill.md") continue;
		fs.cpSync(
			path.join(SKILLS_DIR, slug, entry.name),
			path.join(stageDir, entry.name),
			{ recursive: true },
		);
	}

	let published = false;
	for (let attempt = 0; attempt < 6 && !published; attempt++) {
		// 版本号写进 frontmatter，重试改版本号时要跟着重写
		fs.writeFileSync(
			path.join(stageDir, "SKILL.md"),
			withVersion(rewritten, version),
			"utf8",
		);
		try {
			const out = await publish(stageDir, version, displayName, slug);
			// clawhub 有三种成功文案：直接 published，或进安全扫描队列
			// （pending / 状态未上报），后两种都是 spinner.succeed，不能当失败。
			if (/OK\. Published|Update submitted for/.test(out)) {
				console.log(`OK    ${slug}@${version}  「${displayName}」`);
				fs.appendFileSync(STATE_FILE, `${slug}\n`);
				published = true;
				ok++;
			} else if (/already exists/i.test(out)) {
				version = bumpPatch(version);
			} else {
				throw new Error(out.trim().split("\n").slice(-3).join(" | "));
			}
		} catch (e) {
			const msg = String(e.message || e);
			if (/already exists/i.test(msg)) {
				version = bumpPatch(version);
			} else if (/rate limit|too many requests|429/i.test(msg)) {
				// 注意：不能拿 "reset in" 判限流——clawhub 每条报错末尾都带
				// "(reset in Ns)"，权限不足之类的硬错误会被误当成限流反复重试。
				console.log(`WAIT  ${slug}  限流，等 60s`);
				await sleep(60_000);
			} else {
				console.log(`FAIL  ${slug}  ${msg}`);
				failed.push(slug);
				break;
			}
		}
	}
	if (!published && !failed.includes(slug)) {
		console.log(`FAIL  ${slug}  重试次数用尽`);
		failed.push(slug);
	}

	if (!keepStaging) fs.rmSync(stageDir, { recursive: true, force: true });
	await sleep(1500);
}

if (!dryRun && !keepStaging)
	fs.rmSync(STAGING_DIR, { recursive: true, force: true });

console.log(`\n完成：published=${ok} skipped=${skipped} failed=${failed.length}`);
if (failed.length) {
	console.log(`失败：${failed.join(", ")}`);
	process.exit(1);
}
