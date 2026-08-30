# ecommerce-skills

[中文](README.md) · English

An agent skill library for **e-commerce visual production**. It breaks "shooting product
photos" into 26 composable skills. Each skill is an executable `skill.md` with bundled
scripts, and the whole thing runs on top of swappable image / video / text model backends.

Flat-lay → on-model shot → variant set → detail page → main-image video → AI QC →
marketplace compliance. No studio, no model booking.

What makes this different from a pile of prompts:

- **No vendor lock-in.** dLazy is the default, but OpenAI, Gemini, fal, Replicate and
  Volcengine Ark all work with your own key. With no key at all, `--dry-run` still shows
  you exactly what would be sent and what it would cost.
- **Deterministic work belongs in scripts.** Batching, retries, resume, cost caps,
  compliance checks and the QC loop are code — not something the model re-improvises
  on every run.
- **It can be verified.** Marketplace image specs are checked against pixels, not vibes.

---

## Install

Skills install with [`npx skills`](https://github.com/vercel-labs/skills):

```bash
npx skills add https://github.com/dlazyai/ecommerce-skills --all
```

Install a subset:

```bash
npx skills add https://github.com/dlazyai/ecommerce-skills \
  --skill flat-lay --skill platform-compliance --skill batch-image
```

You can also just paste any `skill.md` into a chat — every skill keeps a script-free
manual path.

### Dependencies

| Dependency | Needed for | Install |
| --- | --- | --- |
| Node ≥ 20 | unified entry point, batching, QC loop, video assembly | — |
| A backend key | actually generating | see below |
| Python + Pillow | compliance checking | `pip install Pillow` |
| ffmpeg | video concat and subtitles | `brew install ffmpeg` |

Without any of them you can still run `--dry-run` end to end.

### Backends

```bash
node shared/scripts/gen.mjs --doctor      # which backend is usable right now
```

| Backend | Env |
| --- | --- |
| `dlazy` (default) | `dlazy login` or `DLAZY_API_KEY` |
| `openai` | `OPENAI_API_KEY` |
| `gemini` | `GEMINI_API_KEY` |
| `fal` | `FAL_KEY` |
| `replicate` | `REPLICATE_API_TOKEN` |
| `ark` | `ARK_API_KEY` + `ARK_MODEL` |

Resolution order: `--provider` flag > `PROVIDER` env > first backend with credentials > `dlazy`.
Model IDs per backend can be overridden with `GEN_MODEL_<PROVIDER>` — vendor catalogs
change, so check their current docs.

---

## Three ways to consume it

```bash
# 1. As agent skills (Claude Code / Cursor / Codex)
npx skills add https://github.com/dlazyai/ecommerce-skills --all

# 2. As a command-line pipeline
node shared/scripts/batch.mjs --input skus.csv --task flat-lay \
  --template prompt.txt --outdir out/ --concurrency 4 --max-credits 3000

# 3. As an MCP server (any MCP client)
node mcp/server.mjs
```

MCP config:

```json
{ "mcpServers": { "ecommerce": {
    "command": "node",
    "args": ["/abs/path/to/ecommerce-skills/mcp/server.mjs"] } } }
```

---

## Skills

**On-model** — put the product on a person

| Skill | What it does |
| --- | --- |
| `flat-lay` | Garment flat-lay + pose reference → on-model catalog shot |
| `wear-everything` | Shoes / bags / accessories worn by a real model |
| `image-fusion` | Up to 8 separate items → one complete styled look |

**One image into many**

| Skill | What it does |
| --- | --- |
| `one-shot` | Swap model / background on an existing on-model shot |
| `fission-pattern` | One product image + selling points → a full variant set |
| `item-detail` | Detail-page modules with typeset copy |

**From scratch**

| Skill | What it does |
| --- | --- |
| `creative-scene` | Text (optional reference) → image; also retargets pose / styling |

**Video**

| Skill | What it does |
| --- | --- |
| `main-image-video` | One product image → 3–5s main-image video |
| `product-video-ad` | Selling points → storyboard → clips → cut with subtitles |
| `ugc-testimonial` | Product + persona → talking-head UGC-style video |

**Scale and quality control**

| Skill | What it does |
| --- | --- |
| `batch-image` | CSV-driven batch pipeline with concurrency, retries, resume, cost cap |
| `detect-task` | Pre-launch AI-image QC: risk level, 8 checks, ready-to-append prompt fixes |
| `platform-compliance` | Objective marketplace spec check + auto-fix (no model calls) |
| `brand-kit` | One `brand.yaml` locks model, lighting, grade and layout across every SKU |

**Listing and performance**

| Skill | What it does |
| --- | --- |
| `listing-optimizer` | Single-variable A/B main image sets with hypotheses and a review template |
| `cross-border-localize` | One asset set → multi-locale copy, size charts, region-specific mains |

**Single-purpose edits**

`to-3d` · `clothing-extraction` · `fabric-on-body` · `clothing-detail` ·
`clothing-grass-planting` · `item-selling-point` · `item-change-background` ·
`remove-watermark` · `material-enhancement` · `item-repair`

---

## What the scripts do

Skill bodies describe *what to generate*. Everything else is code. All support `--dry-run`.

| Script | Responsibility |
| --- | --- |
| `gen.mjs` | Unified entry: backend routing, defaults, exponential backoff on 429/5xx, saving, cost estimate |
| `run_loop.mjs` | The real loop: generate → QC → append the fix sentences back into the prompt → rerun, until it passes or hits the round cap; writes a manifest |
| `batch.mjs` | Batch pipeline: CSV input, concurrency pool, retries, resume, cost circuit breaker, contact sheet |
| `check_listing.py` | Objective compliance check and auto-fix |
| `brand.mjs` | Turns `brand.yaml` into prompt constraints, filtered per skill |
| `video.mjs` | Storyboarding, clip concat, subtitles (burn-in → soft track → leave the .srt) |

### The compliance check, on this repo's own example

```bash
python3 shared/scripts/check_listing.py docs/flat-lay/example-output.jpg --platform amazon
```

```
docs/flat-lay/example-output.jpg  ·  Amazon main image  ·  rejection risk
  ✗ pure white background   only 0.0% of the border is pure white; base is about RGB(208, 208, 208)
  ! resolution              longest side 1536px — passes, but below the zoom threshold
```

That image looks like a clean light-grey studio backdrop to the eye. Amazon requires
**exactly RGB(255,255,255)**, so 208 grey gets rejected. `--fix out/` handles it:
flatten to white → rebuild the canvas to hit the 85% occupancy rule → upscale to 1600px.

Supported: `amazon`, `tiktok-shop`, `temu`, `shopee`, `shopify`, `taobao`.
Marketplace rules change — these are the machine-checkable subset; override with
`--rules your-rules.json`.

---

## Development

`shared/` is the single source of truth. The scripts and references inside
`skills/<name>/` are generated copies, because `npx skills add` installs by copying
directories — each skill has to be self-contained. **Run `npm run build` after editing
anything in `shared/`.**

```bash
npm run build          # sync shared/ into all 26 skill directories
npm run build:check    # verify sync only (used by CI)
npm test               # unit tests + compliance script tests
npm run eval           # structural + executability regression (dry-run, no cost)
npm run eval:live      # golden cases from evals/<skill>/cases.json (real generation)
npm run doctor         # which backend is usable
```

`npm run eval` verifies frontmatter validity, description length and trigger phrases,
body under 500 lines, that every relative link and image resolves, that golden-case
fixtures exist, and **that every command written in the docs actually runs**.

Adding a skill:

1. `skills/<name>/skill.md`
2. Add its description and required shared files to `scripts/skills.config.json`
3. Add default model and parameters to `shared/scripts/lib/tasks.json`
4. Add a display name to `scripts/skill-display-names.json`
5. `npm run build && npm test && npm run eval`

---

## Notes

- **Generated output needs human review.** Occluded and reconstructed regions are not
  guaranteed to match the physical product. Verify print placement, hardware details and
  size information before listing.
- **Marketplace rules change.** Treat the built-in specs as a starting point.
- **Labeling AI content.** `ugc-testimonial` produces simulated endorsements — never
  present them as genuine buyer reviews, and check whether your target platform requires
  AI-generated content to be disclosed.
- **Video model IDs are not hardcoded.** They differ by backend and change often, so you
  specify them explicitly via `DLAZY_VIDEO_MODEL` or `--model`.

---

## License

MIT
