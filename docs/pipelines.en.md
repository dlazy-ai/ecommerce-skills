# Pipelines

[← back to the README](../README.en.md)

[中文](pipelines.md) · English

Skills chain together — the output of one step is the input of the next. These are the
chains that get run the most.

---

## New listing (all you have is one flat-lay)

```
item-repair          retouch the flat-lay (press out creases, even the light, clean background)
  └→ flat-lay        flat-lay → on-model catalog shot
      ├→ fission-pattern    fan out into 5 main-image slots
      ├→ clothing-detail    add 2–3 craftsmanship close-ups
      ├→ item-detail        generate the detail-page modules
      └→ detect-task        QC every image before listing
```

## One shoot, several markets

```
one-shot             same garment → CN / EU-US / different age brackets
  └→ detect-task     spot-check
```

## Only model photos, no flat-lay assets

```
clothing-extraction  street-style or buyer photo → clean flat-lay
  └→ to-3d           flat-lay → ghost-mannequin shot (a richer main image)
  └→ fabric-on-body  same pattern, several fabrics
```

## Social content at volume

```
flat-lay or an existing catalog shot
  └→ clothing-grass-planting   one outfit → 5 lifestyle scenes
      └→ remove-watermark      strip text and watermarks off older images
```

## Full-store refresh (hundreds of SKUs)

```
brand-kit            write one brand.yaml — locks model, lighting and grade
  └→ batch-image     list-driven, one visual system for the whole batch
                     (concurrency / retries / resume / cost cap)
      └→ run_loop    each image runs generate → QC → fix → rerun
          └→ platform-compliance   machine-check the batch, auto-fix what fails
```

One command:

```bash
node shared/scripts/batch.mjs --input skus.csv --task flat-lay \
  --template prompt.txt --outdir out/ --concurrency 4 \
  --max-credits 3000 --loop --platform amazon --resume --contact-sheet
```

## Cross-border listing (one asset set, many countries)

```
flat-lay or an existing catalog shot
  └→ cross-border-localize   multi-locale copy, size charts, region-specific mains
      └→ platform-compliance  check each region's marketplace spec
```

## Adding video to the main-image slot

```
an existing main image
  └→ main-image-video     3–5s main-image video
product-video-ad          selling points → storyboard → cut with subtitles (paid social)
ugc-testimonial           persona → talking-head UGC video
```

## The main image underperforms and you want to know which version wins

```
listing-optimizer    single-variable A/B sets, hypotheses, a review template
  └→ platform-compliance   machine-check every arm first, so rejections
                           do not pollute the experiment
```
