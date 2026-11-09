# Phase 3 — look approval package (Ch0 + Ch1)

**Stop point reached.** Ch0 (cold open, 13.5 s) and Ch1 (building map, 24 s) are built. Ch2–Ch10 are **not** built; they wait for your approval of the look.

## What to review
| File | What |
|---|---|
| `qa/preview/Ch0.mp4`, `qa/preview/Ch1.mp4` | the two chapters, 1920×1080, 30 fps, H.264 (yuv420p), with a chapter marker; no audio files present |
| `qa/stills/_contact_Ch0.png`, `_contact_Ch1.png` | key frames |
| `qa/stills/_contact_components.png` | the reusable components with real data: LayerStack + DetailCallout, ComparisonBars, ComparisonTable (with Data pending), SelectorMatrix |
| `script/captions/Ch0_en.srt`, `Ch1_en.srt` | captions (separate files; nothing burned in) |

## Look decisions (all changeable in `src/theme/`)
- Flat isometric linework, standard hatching: concrete stipple, soil hatch, steel solid, insulation zig-zag.
- Zone highlight = DCP logo orange `#F06C38`; ink = `#211D22` (both read from the logo SVG). Everything else is a neutral placeholder palette.
- One colour per product family (spray blue, sheets green, liquid violet, epoxy ochre, cementitious slate, protective coatings rose, accessories cyan) — used in chips, bars, tables, layer stacks.
- Type: Inter (Latin) / Noto Sans Arabic; body ≥ 36 px; 5% safe margins; lower third left empty; only the source footnote sits at the bottom edge.
- Isometric building is a schematic cutaway (not to scale). Layer stacks are labelled “Schematic — not to scale”.

## Built per the brief
- Remotion + TypeScript, one `<Composition>` per chapter + `Master`; easing/timing tokens in `src/theme/motion.ts`; all copy in `src/i18n/en.json` (components only use keys); layouts flip with `lang="ar"` (RTL), `ar.json` is a key-complete shell with empty values (English fallback until translated).
- Components: BuildingCutaway, ZoneHighlight, LayerStack, DetailCallout, ComparisonBars (hand-set axis maxima, throws on mixed standards), ComparisonTable, SelectorMatrix, DataPending, SourceFootnote.
- One music slot (`public/audio/music.mp3`) and one VO slot (`public/audio/vo_en.mp3`); `npm run audio:scan` decides whether they mount, so the film renders cleanly with no audio.
- `npm run validate` (data build → checks) fails on: any on-screen value without a source ref / page, a held-back (conflicting) value on screen, bars over different or unstated test standards, >3 products or >4 properties in a panel, a product in a zone its TDS does not list (chapters and selector), missing i18n keys, banned claim wording, type errors. Verified by three deliberate-breakage tests.
- `npm run stills` → `qa/stills`; `npm run render:chapters` / `render:master` → `out/` (git-ignored) with chapter markers muxed by ffmpeg and captions copied to `out/captions`.

## ASSUMED (to confirm)
1. **ASSUMED** the DCP logo SVG from dcp-int.com may be used as supplied; colours `#F06C38` / `#211D22` are the only brand colours (no full palette).
2. **ASSUMED** family colours and the neutral paper/ink palette are acceptable placeholders.
3. **ASSUMED** the building cutaway is illustrative (3 floors + podium + basement); no real project geometry.
4. **ASSUMED** the “focus” camera push per zone and the pin/tick styling are acceptable.
5. **ASSUMED** the Master currently contains only Ch0 + Ch1 (it grows as chapters are added in `src/Root.tsx → CHAPTERS`).
6. Scene durations come from `data/timeline.json` (generated from the storyboard; VO ≤ 2.7 words/s) — the VO recording will need to fit them.
7. Ch0 shows no numbers; no data footnote is needed there or in Ch1 (no data on screen).

## Still open from earlier phases
Conflicts C-03, C-07 … C-14 (`qa/conflicts.md`); missing documents (Repcoat P Ultra, remaining method statements); document dates `NOT STATED`; DCP brand palette.
