#!/usr/bin/env python3
# ⚠️ 由 scripts/build-skills.mjs 从 shared/scripts/check_listing.py 同步生成，不要直接改这里。
"""
check_listing.py —— 上架前的客观合规校验。

detect-task 用视觉模型判断「像不像真的」，这个脚本判断「传上去会不会被驳回」。
两者互补：一个主观、一个客观；一个要花算力、一个只读像素。

  python3 scripts/check_listing.py main.jpg --platform amazon
  python3 scripts/check_listing.py imgs/*.jpg --platform amazon --json
  python3 scripts/check_listing.py raw.png --platform amazon --fix out/

退出码：0 全部通过（含仅警告）；1 存在驳回风险；2 参数或读图错误。

⚠️ 平台规则会变。本文件内置的是可机检子集，以各平台最新官方文档为准；
   需要覆盖时用 --rules your-rules.json（结构见 references/platform-specs.md）。
"""
from __future__ import annotations

import argparse
import json
import os
import sys

try:
    from PIL import Image, ImageChops
except ImportError:
    sys.exit("需要 Pillow：pip install Pillow")

# ---------------------------------------------------------------- 规则集

RULES = {
    "amazon": {
        "label": "Amazon 主图",
        "pure_white_bg": True, "bg_tolerance": 2, "bg_coverage": 0.98,
        "min_long_side": 1000, "recommend_long_side": 1600, "max_long_side": 10000,
        "min_occupancy": 0.85, "allow_alpha": False, "allow_border": False,
        "formats": ["JPEG", "PNG", "TIFF", "GIF"], "max_bytes": 10 * 1024**2,
        "aspect": None,
        "notes": "主图禁文字/logo/水印/拼图；透明 PNG 会被转黑底，必须压平为白底 JPEG。",
    },
    "tiktok-shop": {
        "label": "TikTok Shop 主图",
        "pure_white_bg": False, "bg_tolerance": 8, "bg_coverage": 0.90,
        "min_long_side": 800, "recommend_long_side": 1600, "max_long_side": 8000,
        "min_occupancy": 0.60, "allow_alpha": False, "allow_border": False,
        "formats": ["JPEG", "PNG"], "max_bytes": 5 * 1024**2,
        "aspect": [(1, 1), (3, 4)],
        "notes": "禁边框与水印；1:1 或 3:4。",
    },
    "temu": {
        "label": "Temu 主图",
        "pure_white_bg": True, "bg_tolerance": 6, "bg_coverage": 0.95,
        "min_long_side": 800, "recommend_long_side": 1350, "max_long_side": 8000,
        "min_occupancy": 0.70, "allow_alpha": False, "allow_border": False,
        "formats": ["JPEG", "PNG"], "max_bytes": 3 * 1024**2,
        "aspect": [(1, 1)],
        "notes": "主图须方图、干净背景、无促销文字。",
    },
    "shopee": {
        "label": "Shopee 主图",
        "pure_white_bg": False, "bg_tolerance": 10, "bg_coverage": 0.85,
        "min_long_side": 500, "recommend_long_side": 1024, "max_long_side": 8000,
        "min_occupancy": 0.55, "allow_alpha": False, "allow_border": True,
        "formats": ["JPEG", "PNG"], "max_bytes": 2 * 1024**2,
        "aspect": [(1, 1)],
        "notes": "方图；单张 ≤2MB。",
    },
    "shopify": {
        "label": "Shopify 商品图",
        "pure_white_bg": False, "bg_tolerance": 12, "bg_coverage": 0.0,
        "min_long_side": 1024, "recommend_long_side": 2048, "max_long_side": 20000,
        "min_occupancy": 0.0, "allow_alpha": True, "allow_border": True,
        "formats": ["JPEG", "PNG", "WEBP"], "max_bytes": 20 * 1024**2,
        "aspect": None,
        "notes": "平台无硬性约束；2048×2048 方图便于缩放与放大镜。",
    },
    "taobao": {
        "label": "淘宝 / 1688 主图",
        "pure_white_bg": True, "bg_tolerance": 6, "bg_coverage": 0.92,
        "min_long_side": 800, "recommend_long_side": 1200, "max_long_side": 8000,
        "min_occupancy": 0.70, "allow_alpha": False, "allow_border": False,
        "formats": ["JPEG", "PNG"], "max_bytes": 3 * 1024**2,
        "aspect": [(1, 1)],
        "notes": "主图方图；白底图另有独立坑位要求。",
    },
}

PASS, WARN, FAIL = "pass", "warn", "fail"
MARK = {PASS: "✓", WARN: "!", FAIL: "✗"}

# ---------------------------------------------------------------- 度量

def border_ring(img, frac=0.02):
    """取四边一圈像素，用来判定背景色。"""
    w, h = img.size
    d = max(1, int(min(w, h) * frac))
    px = img.load()
    out = []
    for y in list(range(d)) + list(range(h - d, h)):
        for x in range(0, w, max(1, w // 200)):
            out.append(px[x, y])
    for x in list(range(d)) + list(range(w - d, w)):
        for y in range(0, h, max(1, h // 200)):
            out.append(px[x, y])
    return out


def bg_stats(img, tolerance):
    """返回 (背景基色, 纯白比例, 与基色一致的比例)。"""
    ring = border_ring(img)
    if not ring:
        return (255, 255, 255), 0.0, 0.0
    white = sum(1 for p in ring if all(abs(c - 255) <= tolerance for c in p[:3]))
    # 众数近似：把颜色量化到 8 级再统计
    buckets = {}
    for p in ring:
        k = tuple(c // 32 for c in p[:3])
        buckets[k] = buckets.get(k, 0) + 1
    mode_k = max(buckets, key=buckets.get)
    members = [p[:3] for p in ring if tuple(c // 32 for c in p[:3]) == mode_k]
    base = tuple(round(sum(c[i] for c in members) / len(members)) for i in range(3))
    same = sum(1 for p in ring
               if sum((a - b) ** 2 for a, b in zip(p[:3], base)) ** 0.5 <= 24)
    return base, white / len(ring), same / len(ring)


def subject_bbox(img, base, thresh=18):
    """相对背景基色做差，得到主体包围盒与占位面积。"""
    w, h = img.size
    bg = Image.new("RGB", img.size, tuple(int(c) for c in base))
    diff = ImageChops.difference(img.convert("RGB"), bg).convert("L")
    mask = diff.point(lambda v: 255 if v > thresh else 0)
    box = mask.getbbox()
    if not box:
        return None, 0.0, 0.0
    ink = sum(mask.histogram()[1:]) / float(w * h)
    x0, y0, x1, y1 = box
    return box, ((x1 - x0) * (y1 - y0)) / float(w * h), ink


def has_border(img, base):
    """最外一圈是否是一条与背景不同的均匀细边。"""
    w, h = img.size
    if min(w, h) < 20:
        return False
    px = img.convert("RGB").load()
    ring = [px[x, 0] for x in range(0, w, max(1, w // 100))] + \
           [px[x, h - 1] for x in range(0, w, max(1, w // 100))]
    if not ring:
        return False
    far = sum(1 for p in ring
              if sum((a - b) ** 2 for a, b in zip(p, base)) ** 0.5 > 40)
    return far / len(ring) > 0.9


def ratio_ok(w, h, allowed, tol=0.02):
    if not allowed:
        return True, f"{w}:{h}"
    r = w / h
    for a, b in allowed:
        if abs(r - a / b) <= tol:
            return True, f"{a}:{b}"
    return False, f"{r:.3f}"

# ---------------------------------------------------------------- 校验

def check(path, rules):
    try:
        img = Image.open(path)
        img.load()
    except Exception as e:  # noqa: BLE001
        return {"file": path, "error": str(e), "checks": [], "verdict": "error"}

    fmt = img.format
    size_bytes = os.path.getsize(path)
    w, h = img.size
    has_alpha = img.mode in ("RGBA", "LA", "PA") or "transparency" in img.info
    rgb = img.convert("RGB")
    base, white_frac, same_frac = bg_stats(rgb, rules["bg_tolerance"])
    box, occ, ink = subject_bbox(rgb, base)

    out = []

    def add(name, level, detail, measured=None, required=None):
        out.append({"check": name, "level": level, "detail": detail,
                    "measured": measured, "required": required})

    # 尺寸
    long_side = max(w, h)
    if long_side < rules["min_long_side"]:
        add("分辨率", FAIL, f"最长边 {long_side}px，低于下限", long_side, rules["min_long_side"])
    elif long_side < rules["recommend_long_side"]:
        add("分辨率", WARN, f"最长边 {long_side}px，达标但不足以触发放大镜",
            long_side, rules["recommend_long_side"])
    elif long_side > rules["max_long_side"]:
        add("分辨率", FAIL, f"最长边 {long_side}px 超上限", long_side, rules["max_long_side"])
    else:
        add("分辨率", PASS, f"{w}×{h}", long_side, rules["recommend_long_side"])

    # 比例
    ok, got = ratio_ok(w, h, rules["aspect"])
    add("画面比例", PASS if ok else FAIL,
        f"{w}:{h}" if ok else f"实际 {got}，不在允许比例内", got,
        rules["aspect"] and "/".join(f"{a}:{b}" for a, b in rules["aspect"]))

    # 背景
    if rules["pure_white_bg"]:
        need = rules["bg_coverage"]
        if white_frac >= need:
            add("纯白背景", PASS, f"边缘 {white_frac:.1%} 为 RGB(255,255,255)±{rules['bg_tolerance']}",
                round(white_frac, 4), need)
        else:
            add("纯白背景", FAIL,
                f"边缘仅 {white_frac:.1%} 为纯白，背景基色约 RGB{tuple(int(c) for c in base)}",
                round(white_frac, 4), need)
    else:
        add("背景一致性", PASS if same_frac >= rules["bg_coverage"] else WARN,
            f"边缘 {same_frac:.1%} 颜色一致（基色 RGB{tuple(int(c) for c in base)}）",
            round(same_frac, 4), rules["bg_coverage"])

    # 主体占比
    if rules["min_occupancy"] > 0:
        if occ >= rules["min_occupancy"]:
            add("主体占比", PASS, f"包围盒占画面 {occ:.1%}", round(occ, 4), rules["min_occupancy"])
        else:
            add("主体占比", FAIL,
                f"包围盒仅占 {occ:.1%}，商品太小（留白过多）", round(occ, 4), rules["min_occupancy"])

    # 透明通道
    if has_alpha and not rules["allow_alpha"]:
        add("透明通道", FAIL, "含 alpha；上传后透明像素可能被转为黑色，须压平为白底", True, False)
    else:
        add("透明通道", PASS, "无 alpha" if not has_alpha else "允许 alpha", has_alpha, rules["allow_alpha"])

    # 边框
    if not rules["allow_border"]:
        b = has_border(rgb, base)
        add("边框", FAIL if b else PASS,
            "检出一圈与背景不同的描边" if b else "无描边", b, False)

    # 格式与体积
    add("文件格式", PASS if fmt in rules["formats"] else FAIL,
        f"{fmt}", fmt, "/".join(rules["formats"]))
    add("文件体积", PASS if size_bytes <= rules["max_bytes"] else FAIL,
        f"{size_bytes / 1024**2:.2f} MB", size_bytes, rules["max_bytes"])

    # 色彩模式
    add("色彩模式", PASS if img.mode in ("RGB", "RGBA", "L", "P") else WARN,
        img.mode, img.mode, "RGB")

    # 需模型判定的项 —— 不假装能测
    add("文字 / 水印 / 拼图", "manual",
        "像素层判不了，交给 detect-task 或人工过一眼", None, None)

    fails = [c for c in out if c["level"] == FAIL]
    warns = [c for c in out if c["level"] == WARN]
    verdict = "reject-risk" if fails else ("warn" if warns else "pass")
    return {
        "file": path, "platform": rules["label"], "verdict": verdict,
        "width": w, "height": h, "format": fmt, "bytes": size_bytes,
        "bgBase": [int(c) for c in base], "whiteFraction": round(white_frac, 4),
        "occupancy": round(occ, 4), "inkCoverage": round(ink, 4), "bbox": box,
        "checks": out, "notes": rules["notes"],
    }

# ---------------------------------------------------------------- 自动修复

def fix(path, rules, outdir):
    """压白底 → 按目标占比裁切 → 补足分辨率 → 存合规 JPEG。"""
    img = Image.open(path)
    img.load()
    if img.mode in ("RGBA", "LA", "PA") or "transparency" in img.info:
        rgba = img.convert("RGBA")
        canvas = Image.new("RGB", rgba.size, (255, 255, 255))
        canvas.paste(rgba, mask=rgba.split()[-1])
        img = canvas
    else:
        img = img.convert("RGB")

    base, _, _ = bg_stats(img, rules["bg_tolerance"])
    box, occ, _ = subject_bbox(img, base)

    if rules["pure_white_bg"] and tuple(int(c) for c in base) != (255, 255, 255):
        # 把接近基色的像素刷成纯白，保留主体
        bg = Image.new("RGB", img.size, tuple(int(c) for c in base))
        diff = ImageChops.difference(img, bg).convert("L")
        mask = diff.point(lambda v: 255 if v > 18 else 0)
        white = Image.new("RGB", img.size, (255, 255, 255))
        img = Image.composite(img, white, mask)
        base = (255, 255, 255)

    target = rules["min_occupancy"] or 0.85
    if box and occ < target:
        x0, y0, x1, y1 = box
        bw, bh = x1 - x0, y1 - y0
        crop = img.crop(box)
        square = bool(rules["aspect"]) and (1, 1) in rules["aspect"]
        if square:
            # 方图：包围盒非正方时，占比的物理上限是 bw*bh/max^2
            side = max(int(round((bw * bh / target) ** 0.5)), bw, bh)
            cw = ch = side
        else:
            # 自由比例：画布跟随包围盒长宽比，占比可精确落在 target
            k = target ** 0.5
            cw, ch = max(int(round(bw / k)), bw), max(int(round(bh / k)), bh)
        canvas = Image.new("RGB", (cw, ch), tuple(int(c) for c in base))
        canvas.paste(crop, ((cw - bw) // 2, (ch - bh) // 2))
        img = canvas

    need = rules["recommend_long_side"]
    if max(img.size) < need:
        s = need / max(img.size)
        img = img.resize((round(img.width * s), round(img.height * s)), Image.LANCZOS)

    os.makedirs(outdir, exist_ok=True)
    stem = os.path.splitext(os.path.basename(path))[0]
    dst = os.path.join(outdir, f"{stem}-fixed.jpg")
    q = 92
    img.save(dst, "JPEG", quality=q, subsampling=0, optimize=True)
    while os.path.getsize(dst) > rules["max_bytes"] and q > 60:
        q -= 8
        img.save(dst, "JPEG", quality=q, subsampling=0, optimize=True)
    return dst

# ---------------------------------------------------------------- 输出

def render(reports):
    lines = []
    for r in reports:
        if r.get("error"):
            lines.append(f"✗ {r['file']} —— 读图失败：{r['error']}")
            continue
        head = {"pass": "通过", "warn": "通过（有提醒）", "reject-risk": "有驳回风险"}[r["verdict"]]
        lines.append(f"\n{r['file']}  ·  {r['platform']}  ·  {head}")
        lines.append(f"  {r['width']}×{r['height']} {r['format']} {r['bytes']/1024**2:.2f}MB"
                     f" · 背景 RGB{tuple(r['bgBase'])} · 主体占比 {r['occupancy']:.1%}")
        lines.append("")
        for c in r["checks"]:
            mark = MARK.get(c["level"], "?")
            lines.append(f"  {mark} {c['check']:<16} {c['detail']}")
        lines.append(f"\n  平台备注：{r['notes']}")
    return "\n".join(lines)


def main():
    ap = argparse.ArgumentParser(description="上架前客观合规校验")
    ap.add_argument("images", nargs="+")
    ap.add_argument("--platform", default="amazon",
                    help="/".join(RULES) + "（默认 amazon）")
    ap.add_argument("--rules", help="自定义规则 JSON，覆盖内置规则集")
    ap.add_argument("--json", action="store_true")
    ap.add_argument("--fix", metavar="OUTDIR", help="自动修复并输出到该目录")
    a = ap.parse_args()

    table = dict(RULES)
    if a.rules:
        with open(a.rules, encoding="utf8") as f:
            for k, v in json.load(f).items():
                table[k] = {**table.get(k, RULES["amazon"]), **v}
    if a.platform not in table:
        sys.exit(f"未知平台 {a.platform}，可选：{'/'.join(table)}")
    rules = table[a.platform]

    reports = [check(p, rules) for p in a.images]

    if a.fix:
        for r in reports:
            if r.get("error"):
                continue
            r["fixed"] = fix(r["file"], rules, a.fix)
        reports = [check(r["fixed"], rules) | {"source": r["file"]}
                   if r.get("fixed") else r for r in reports]

    if a.json:
        print(json.dumps(reports, ensure_ascii=False, indent=2))
    else:
        print(render(reports))

    sys.exit(1 if any(r.get("verdict") == "reject-risk" for r in reports) else 0)


if __name__ == "__main__":
    main()
