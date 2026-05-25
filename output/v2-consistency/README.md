# v2 Consistency Demo

Regenerates pages **2, 15, 30** using `gpt-image-2` + the consistency workflow from [hello-gpt-image/docs/06-consistency-workflow.md](../../../hello-gpt-image/docs/06-consistency-workflow.md).

Nothing else in `bens-game` was modified. The existing v1 pages in `../panels/` are untouched.

## What's different from v1

| | v1 (`output/panels/`) | v2 (this folder) |
|---|---|---|
| Model | `gpt-image-1` | `gpt-image-2` |
| Endpoint | `client.images.generate` | `client.images.edit` |
| Reference images | none | **7 canonical character sheets** in `_refs/` |
| Prompt structure | character-JSON + style-JSON flat merge | canonical bible + scene + explicit identity restatement + "DO NOT REDESIGN" negative |
| Variants per panel | 3 (pick best) | 1 (reference-anchored, no selection needed) |
| Novelization enrichment | no | yes — evocative phrases from `input/narrative/prologue-*.md` inlined as source context |

## Three pages, three tonal registers

- **Page 2 — Farm Life** (rural, domestic, contemplative): 3 panels. Giovanni.Young + GiovanniFather
- **Page 15 — The Escape** (psychological interior, metamorphosis): 4 panels. Bansi.Young (princess) → Bansi.Servant (traveler disguise)
- **Page 30 — The Helm and Collar** (supernatural transformation): 4 panels. Eskil.Young (pre-ritual) → Eskil (post-ritual)

## Character reference sheets

Seven 3-view model sheets (front / three-quarter / profile) at 1536×1024 in `_refs/`. Generated once, used as `edit()` inputs for every panel that character appears in:

- `char-giovanni-young.png` — 12-year-old Italian peasant boy, shepherd's crook
- `char-giovanni-father.png` — weathered Italian farmer, wool cap, wooden cross
- `char-bansi-young.png` — 13-year-old Kashmiri princess, royal silk sari
- `char-bansi-servant.png` — same Kashmiri face, servant-boy disguise
- `char-eskil-young.png` — blonde Nordic youth, pre-curse, unmarked
- `char-eskil.png` — 6'8" Norseman in permanent runic helm + collar
- `char-leif-skull.png` — carved iron skull with glowing runes

## Consistency results to inspect

Open these pairs to see identity persistence across scene/pose/emotion:

- **Giovanni across page 2**: `page-002-panel-1.png` (family table, warm interior) vs `page-002-panel-3.png` (plowing the fields, wide daylight). Same face, same hair, same patched tunic.
- **Bansi's transformation across page 15**: `page-015-panel-1.png` (princess in royal silks) vs `page-015-panel-4.png` (plain cap and tunic walking out through palace gate). Same underlying face and build — visibly the same thirteen-year-old in two lives.
- **Eskil's ritual across page 30**: `page-030-panel-1.png` (blonde youth in a cell) vs `page-030-panel-3.png` (permanent helm sealed with molten iron, runes blazing). Same character through a supernatural transformation.

## Moderation notes

Four of the eleven panels tripped OpenAI's prompt-level safety filter on first attempt, even at `moderation: 'low'`. Triggers were literal scene-description language:

- `p15-1`: "coins stolen over months... a small knife" → rephrased to plain cache retrieval
- `p15-4`: "Princess Iksha Bhima dies" → rephrased as a literal gateway transition
- `p30-1`: "bites down on his own wrist" → rephrased as internal horror with metaphorical red glow, no physical self-harm depicted
- `p30-2`: "iron skull watches... runes of binding" → rephrased as a calm craftsman-at-bench scene

The overrides live in `scripts/generate-consistency-demo.mjs` (`PANEL_OVERRIDES`, `PANEL_FULL_OVERRIDES`). The source panel JSON is unchanged.

## Cost

Roughly **$4** for the full run on gpt-image-2: 7 refs at 1536×1024 high + 11 panels at mixed aspect ratios high, all edits-endpoint with 1–2 reference images per call.

## Re-running

```bash
node scripts/generate-consistency-demo.mjs            # full run (skips what exists)
node scripts/generate-consistency-demo.mjs --refs     # only regenerate character sheets
node scripts/generate-consistency-demo.mjs --only=15  # only one page
```

Delete any PNG to force its regeneration on next run.

## Next steps (not in scope here)

- Port into `scripts/generate_openai.py` as a `--v2` flag
- Add `canonical_descriptor` field to `data/characters.json` schema so bibles live with the data
- Generate reference sheets for every character once, reuse across all 83 pages for a full regen
- Re-anchor every ~10 panels against a recent good panel to defeat long-sequence drift (see `docs/06` §"What still breaks")
