# Conflicts between DCP documents

Per brief §3.5: both values are logged, **neither is chosen**, and the affected value stays **off screen** until you resolve it.
Quotes are copied from the PDFs; pages were located by script (`tools/`).

| ID | Product | Item | Document A | Document B | On screen? |
|---|---|---|---|---|---|
| C-01 | DonProof PU-H50 | Cure time | TDS `DonProof PU-H50_1.pdf` p1 table: “Curing time: 12 hr” (doc 08-0163-A-2025) | Same TDS p2 text: “completely functional after about 2 - 3 days” | **Held back** (full cure) |
| C-02 | DonProof PU-P100 | Cure time | TDS `user-supplied/DonProof_PU-P100.pdf` p1 table: “Curing time: 12 hr” (doc 08-0164-A-2025) | Same TDS p2 text: “completely functional after about 2 - 3 days” | **Held back** (full cure) |
| C-03 | DonProof PU-H50 | Max. relative humidity at application | TDS p2: “maximum atmospheric relative humidity should not exceed 85%” | Method statement `DonProof PU-H50_MS.pdf` p3 (Ref. DCP00/08-0163-B-2022): “relative humidity must not exceed 80%” | **Held back** |
| C-04 | DonProof PU-P60 | Max. relative humidity at application | TDS `DonProof PU-P60_4.pdf` p2: “should not exceed 90%” (doc 08-0176-QA-A-2026) | Method statement `DonProof PU-P60_MS.pdf` p3 (Ref. DCP03/08-0176-A-2025): “relative humidity must not exceed 80%” | **Held back** |
| C-05 | DonProof PU-P60 | Application temperature limits | TDS p2: “below 4ºC or more than 50ºC is not recommend[ed]” | MS p3: “Application temperature ranges from 3°C to 40°C” | **Held back** |
| C-06 | DonProof PU-P60 | Substrate moisture at which Strongcoat DPM is needed | TDS p2: “Concrete relative humidity must be ≤ 75%” (DPM for rising dampness / elevated moisture) | MS p8: Strongcoat Primer / Primer S, “for surfaces with a relative humidity greater than 80% and below 85% Strongcoat DPM is recommended” | **Held back** |

## Notes (not conflicts, but affect how documents are cited)
- PU-P60 and PU-H50 method statements carry an earlier revision/year than their TDS (MS 08-0176-**A-2025** vs TDS 08-0176-QA-A-**2026**; MS 08-0163-**B-2022** vs TDS 08-0163-A-2025). I cannot tell which is current; cite each by its own code.
- The method statements name **Repcoat P Ultra** as the UV protection coat; no TDS for it was found.
- Other regional DCP sites host other revisions of several products (e.g. several `DonProof HS_n`, `DonProof PU-P60_3` on the Saudi page, `Strongcoat EPW_TDS_5` on the Iraq page). **They were not downloaded or compared.** If they differ from the Qatar set, further conflicts may exist.
- Only the method statements for PU-H50 and PU-P60 were downloaded so far; detail-callout content (Phase 3) will need the others once scope is approved.

---
## Added after the second batch of uploads (method statements + new TDS)

| ID | Product | Item | Document A | Document B | On screen? |
|---|---|---|---|---|---|
| C-03 (update) | DonProof PU-H50 | Max. RH at application | TDS p2: “should not exceed 85%” | **Both** method statements — `DonProof PU-H50_MS.pdf` (DCP00/08-0163-B-2022) and your upload (DCP00/08-0163-A-2025) — say 80% | Held back |
| C-07 | DonProof Primer PU | Which membranes it serves | TDS title/advantages: polyurea membranes / “DonProof Range” | TDS Applications line: “enhance the bond between **Aquathane** Range of products and the substrates” | Primer shown only as “for polyurea systems” per title |
| C-08 | DonProof Primer EP | Spread rate for ~200 µm | Primer EP TDS: “3.5 - 3.7 m²/kg … approximately 200 micron per coat” | PU-P150 MS (DCP00/08-0206-C-2026) 2.1.5 and PU-H50 MS (DPM): “(5 m²/kg per coat) to achieve a dry film thickness of 200 microns” | **Held back** (`PRIMER-EP.coverage`) |
| C-09 | Strongcoat EN100 | Pot life / use time | TDS p1: “Pot life: 40 min @ 25oC” | EN100 MS 3.3: “used within 30 minutes @ 25oC and 15 min @ 35 oC” | **Held back** (`EN100.pot_life`) |
| C-10 | Strongcoat EN100 | Antislip topcoat rate | TDS p2: “Strongcoat EN100 (topcoat): 0.50 kg/m²” | EN100 MS 4.3: “0.53 -1 kg /m² depending on the Antislip Aggregate size” | Not stored; not shown |
| C-11 | Repcoat FF | Application temperature | TDS: “Application temperature: 5 to 45°C” | Repcoat FF MS 2.x: “Application temperature is 5 - 50oC” | Not stored; not shown |

Checked and **consistent** (no conflict): FB/FB-S TDS vs MS (20 mm fillet, 50 mm overlap, 300 mm stagger, 300 g/m² geotextile); DonProof L (350 g/m², 80 mm overlap); DonProof R (1:40 slope); Aquathane E400 coat count and dilution; PU-P150 TDS vs MS (5–50 °C, RH 85%, 1.6 kg/m² at 1.5 mm); PU-C100 TDS vs MS (5–35 °C, RH 85%, 1.8–2.0 kg/m² at 1.5 mm); Strongcoat EPW TDS vs MS (0.375 kg/m² × 2 = 500 µm, 24 h @ 25 °C recoat, 5 °C / 90% RH limits).

Method statements carry no date. The short MS for EN100, EPW, Repcoat FF and Hyperseal print no reference code at all (cited as “NOT STATED”).
