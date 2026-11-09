# DCP Waterproofing & Protective Coatings — animated explainer film

Status: **Phase 1 (extract & scope) — awaiting approval.** No Remotion code yet.

| Path | What |
|---|---|
| `source-tds/` | DCP PDFs downloaded from dcp-int.com (Qatar download pages; `regional/lb` for Repcoat PU1 / S; `user-supplied/` = PU-P150, PU-P100, PU-C100, Setseal 300C) |
| `data/products.json` | Extracted values — each `{value, unit, test_standard, source_file, page, doc_code, doc_date}`; missing = `[DATA REQUIRED — R&D]`; conflicting = held off screen |
| `data/catalogue.json` | Every other DCP document found, with a proposed classification (values not extracted) |
| `qa/scope_sheet.md` | Phase 1 gate: scope + comparison-set verdicts (generated) |
| `qa/conflicts.md` | TDS vs method-statement conflicts |
| `qa/open_items.md` | Missing data, assumptions, decisions needed (generated) |
| `tools/` | `build_products.py` (fails if a printed value is not on the cited PDF page), `build_catalogue.py`, `build_qa.py` |

Rebuild: `python3 tools/build_catalogue.py && python3 tools/build_qa.py` (needs `pdftotext`/`pdfinfo`).
