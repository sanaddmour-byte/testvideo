#!/usr/bin/env python3
"""Build data/products.json from the DCP PDFs in source-tds/.

Rules (brief section 3):
  * every value is copied as printed; nothing is rounded, converted or inferred
  * every value is located on a PDF page; the build FAILS if the printed text is
    not found on the page (page numbers are found, never typed)
  * missing core fields are stored as "[DATA REQUIRED — R&D]"
  * missing doc code / date are stored as "NOT STATED"

Run:  python3 tools/build_products.py
"""
import json, os, re, subprocess, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TDS = os.path.join(ROOT, "source-tds")
MISSING = "[DATA REQUIRED — R&D]"
NS = "NOT STATED"
CODE_RE = re.compile(r"\b\d{2}-\d{4}-(?:[A-Z]{2,3}-)?[A-Z]-\d{4}\b")

_cache = {}
FAILS = []


def norm(s):
    return re.sub(r"\s+", "", s)


def pages(rel):
    """Return list of (layout_text, raw_text) per page, whitespace-stripped."""
    if rel in _cache:
        return _cache[rel]
    path = os.path.join(TDS, rel)
    info = subprocess.run(["pdfinfo", path], capture_output=True, text=True).stdout
    n = int(re.search(r"Pages:\s*(\d+)", info).group(1))
    out = []
    for p in range(1, n + 1):
        lay = subprocess.run(["pdftotext", "-layout", "-f", str(p), "-l", str(p), path, "-"],
                             capture_output=True, text=True).stdout
        raw = subprocess.run(["pdftotext", "-raw", "-f", str(p), "-l", str(p), path, "-"],
                             capture_output=True, text=True).stdout
        out.append((lay, raw))
    _cache[rel] = out
    return out


def find_page(rel, frags):
    if isinstance(frags, str):
        frags = [frags]
    for i, (lay, raw) in enumerate(pages(rel), 1):
        for txt in (lay, raw):
            t = norm(txt)
            if all(norm(f) in t for f in frags):
                return i
    FAILS.append(f"NOT FOUND in {rel}: {frags}")
    return 0


def doc_code(rel):
    codes = []
    for lay, raw in pages(rel):
        codes += CODE_RE.findall(lay)
    return codes[-1] if codes else NS


class Product:
    def __init__(self, pid, name, rel, family, cls, core, na=()):
        self.d = dict(id=pid, name=name, family=family, classification=cls,
                      source_file=rel, doc_code=doc_code(rel), doc_date=NS,
                      values={}, uses=[], notes=[], extracted=True)
        self.rel, self.core, self.na = rel, core, set(na)

    def v(self, key, value, unit="", std=NS, printed=None, cond=None, label=None, held=None, src=None):
        frags = printed if printed is not None else (f"{value} {unit}".strip() if unit and not unit.startswith("(") else value)
        rel, code = (src if src else (self.rel, self.d["doc_code"]))
        page = find_page(rel, frags)
        e = dict(value=value, unit=unit, test_standard=std, source_file=rel, page=page,
                 doc_code=code, doc_date=NS)
        if src:
            e["source_type"] = "METHOD STATEMENT"
        if cond:
            e["condition"] = cond
        if label:
            e["label_as_printed"] = label
        if held:
            e["held_conflict"] = held
            e["on_screen_allowed"] = False
        self.d["values"].setdefault(key, []).append(e)
        return self

    def use(self, zone, quote, mapping="TDS-LISTED", note=None):
        """zone: A-G, or None for a listed use outside the film's zones (flagged)."""
        page = find_page(self.rel, quote)
        u = dict(zone=zone, quote=quote, page=page, mapping=mapping)
        if note:
            u["note"] = note
        self.d["uses"].append(u)
        return self

    def std(self, text):
        page = find_page(self.rel, text)
        self.d.setdefault("standards_claimed", []).append(
            dict(printed=text, source_file=self.rel, page=page, doc_code=self.d["doc_code"], doc_date=NS))
        return self

    def ms(self, rel, ref=None):
        find_page(rel, ("Ref. #: " + ref) if ref else "Method Statement")
        ref = ref or NS
        self.d.setdefault("method_statements", []).append(dict(file=rel, ref=ref, doc_date=NS))
        return self

    def note(self, t):
        self.d["notes"].append(t)
        return self

    def done(self):
        for k in self.core:
            if k not in self.d["values"] and k not in self.na:
                self.d["values"][k] = [dict(value=MISSING, unit="", test_standard=NS,
                                            source_file=self.rel, page=None,
                                            doc_code=self.d["doc_code"], doc_date=NS)]
        self.d["not_applicable_fields"] = sorted(self.na)
        return self.d


SPRAY = ["thickness_min", "coverage", "tensile", "elongation", "bond_concrete", "crack_bridging",
         "service_temp", "tack_free", "recoat", "traffic_light", "voc", "shelf_life"]
SHEET = ["thickness", "tensile", "elongation", "water_tightness", "service_temp", "shelf_life"]
LIQ = ["coverage", "tensile", "elongation", "bond_concrete", "crack_bridging", "service_temp",
       "recoat", "cure_full", "pot_life", "voc", "shelf_life"]
CEM = ["thickness_min", "tensile", "elongation", "bond_concrete", "crack_bridging", "service_temp",
       "pot_life", "voc", "shelf_life", "coverage"]

P = []

# ---------------------------------------------------------------- spray polyurea
p = Product("PU-P150", "DonProof PU-P150", "user-supplied/DonProof_PU-P150.pdf", "DonProof spray polyurea",
            "Waterproofing", SPRAY, na=["pot_life"])
p.ms("user-supplied/DonProof_PU-P150_MS.pdf", "DCP00/08-0206-C-2026")
p.v("thickness_min", "1.4", "mm", printed="1.4 mm", cond="minimum suggested application thickness, cross-hatch spray (p2 text)")
p.v("coverage", "1.6 kg/m² to provide 1.5 mm dry film thickness", "", printed=["1.6 kg/", "1.5 mm dry film thickness"])
p.v("tensile", "≥ 15", "MPa", "ASTM D412", printed="≥ 15 MPa")
p.v("elongation", "≥ 300", "%", "ASTM D412", printed="≥ 300%")
p.v("bond_concrete", "≥ 4", "MPa", printed="≥ 4 MPa")
p.v("bond_steel", "≥ 2.0", "MPa", printed="≥ 2.0 MPa", cond="when primed with DonProof Primer PU at 3 - 4 hr recoating time")
p.v("tear", "≥ 80", "N/mm", "ASTM D624", printed="≥ 80 N/mm")
p.v("crack_bridging", "no cracks occurred after 10 cycles", "", "ASTM C1305 @ 23oC", printed="no cracks occurred after 10")
p.v("service_temp", "-30 to 90", "°C", printed="-30 to 90")
p.v("tack_free", "5 - 7", "sec", printed="5 - 7 sec")
p.v("recoat", "4 min - 3 hr", "", printed="4 min - 3 hr")
p.v("traffic_light", "12", "hr", printed="12 hr")
p.v("traffic_vehicle", "2 - 3", "days", printed="2 - 3 days")
p.v("water_permeability", "Nil", "", "DIN 1048 @ 5 bars", printed="Nil")
p.v("shelf_life", "12", "months", printed="12 months")
p.std("PD CEN/TS")
p.use("B", "Sloped and flat roofs (walkable), balconies, and")
p.use("B", "Under XPS insulation as part of an inverted or")
p.use("A", "Retaining walls and foundations.")
p.use("D", "Concrete/steel water storage tanks.")
p.use("D", "Swimming pools, aquariums, lakes.", "ASSUMED", "Swimming pool mapped to zone D (water-retaining structures) by me — confirm")
p.use("B", "Green roofs and planters.")
p.use(None, "Car park and bridge decks.", "EXCLUDED-AREA", "Car park decks belong to Flooring per brief; do not show")
P.append(p)

p = Product("PU-P100", "DonProof PU-P100", "user-supplied/DonProof_PU-P100.pdf", "DonProof spray polyurea",
            "Waterproofing", SPRAY, na=["pot_life"])
p.v("thickness_min", "1.4", "mm", printed="1.4 mm", cond="minimum suggested application thickness, cross-hatch spray (p2 text)")
p.v("coverage", "1.7 kg/m² to provide 1.5 mm dry film thickness", "", printed=["1.7 kg/", "1.5 mm dry film thickness"])
p.v("tensile", "≥ 20", "MPa", "ASTM D412", printed="≥ 20 MPa")
p.v("elongation", "≥ 360", "%", "ASTM D412", printed="≥ 360%")
p.v("bond_concrete", "≥ 2.0", "MPa", printed="≥ 2.0 MPa", cond="when primed with Strongcoat Primer Range")
p.v("tear", "≥ 80", "N/mm", "ASTM D624", printed="≥ 80 N/mm")
p.v("crack_bridging", "no cracks occurred after 10 cycles @ 8 mm", "", "ASTM C1305", printed="no cracks occurred after 10")
p.v("service_temp", "-20 to 90", "°C", printed="-20 to 90")
p.v("tack_free", "5 - 7", "sec", printed="5 - 7 sec")
p.v("recoat", "10 sec - 48 hr", "", printed="10 sec - 48 hr")
p.v("traffic_light", "3", "hr", printed="3 hr")
p.v("traffic_vehicle", "12", "hr", printed="12 hr")
p.v("cure_full", "12", "hr", printed="12 hr", label="Curing time", held="C-02")
p.v("shelf_life", "12", "months", printed="12 months")
p.use("B", "Sloped and flat roofs (walkable), balconies, and")
p.use("B", "Green roofs")
p.use("A", "Retaining walls and foundations")
p.use("D", "Tanks and irrigation canals, suitable for contact with")
p.use("D", "Swimming pools, aquariums, lakes", "ASSUMED", "Swimming pool mapped to zone D by me — confirm")
p.use(None, "Car park and bridge decks", "EXCLUDED-AREA", "Car park decks belong to Flooring per brief; do not show")
P.append(p)

p = Product("PU-P60", "DonProof PU-P60", "DonProof PU-P60_4.pdf", "DonProof spray polyurea",
            "Waterproofing", SPRAY, na=["pot_life"])
p.ms("DonProof PU-P60_MS.pdf", "DCP03/08-0176-A-2025")
p.v("thickness_min", "1000", "microns", printed="1000 microns", label="Minimum application thickness")
p.v("coverage", "1 kg/m² to provide 1 mm dry film thickness", "", printed=["1 kg/m²", "1 mm dry film thickness"])
p.v("tensile", "≥ 20 ± 2", "MPa", "ASTM D412", printed="≥ 20 ± 2 MPa")
p.v("elongation", "400 ± 50", "%", "ASTM D412", printed="400 ± 50%")
p.v("bond_concrete", "≥ 2", "MPa", printed="≥ 2 MPa", cond="when primed with Strongcoat Primer Range")
p.v("tear", "≥ 70", "N/mm", "ASTM D624", printed="≥ 70 N/mm")
p.v("crack_bridging", "no cracks occurred after 25 cycles", "", "ASTM C1305", printed="no cracks occurred after 25")
p.v("service_temp", "-40 to 120", "°C (dry)", printed="-40 to 120")
p.v("service_temp_wet", "4 to 50", "°C (wet)", printed="4 to 50")
p.v("gel_time", "6 - 20", "sec", printed="6 - 20 sec")
p.v("tack_free", "30 - 60", "sec", printed="30 - 60 sec")
p.v("recoat", "0 - 6", "hr", printed="0 - 6 hr")
p.v("traffic_light", "1 - 4", "hr", printed="1 - 4 hr")
p.v("traffic_vehicle", "24", "hr", printed="24 hr")
p.v("cure_full", "24", "hr", printed="24 hr", label="Curing time")
p.v("voc", "< 10", "g/ltr", "ASTM D2369", printed="< 10 g/ltr")
p.v("shelf_life", "12", "months", printed="12 months")
p.use("B", "Sloped and flat roofs (walkable), balconies, and")
p.use("B", "Green roofs.")
p.use("A", "Retaining walls and foundations.")
p.use("D", "Tanks and irrigation canals, suitable for contact with")
p.use("D", "Swimming pools, aquariums, lakes.", "ASSUMED", "Swimming pool mapped to zone D by me — confirm")
P.append(p)

p = Product("PU-H50", "DonProof PU-H50", "DonProof PU-H50_1.pdf", "DonProof spray polyurea",
            "Waterproofing", SPRAY, na=["pot_life"])
p.ms("DonProof PU-H50_MS.pdf", "DCP00/08-0163-B-2022")
p.ms("user-supplied/DonProof_PU-H50_MS.pdf", "DCP00/08-0163-A-2025")
p.v("thickness_min", "1.5", "mm", printed="1.5 mm", cond="typical minimum suggested application thickness, cross-hatch spray (p2 text)")
p.v("coverage", "1.7 kg/m² to provide 1.5 mm dry film thickness", "", printed=["1.7 kg/", "1.5 mm dry film thickness"])
p.v("tensile", "≥ 18", "MPa", "ASTM D412", printed="≥ 18 MPa")
p.v("elongation", "≥ 350", "%", "ASTM D412", printed="≥ 350%")
p.v("bond_concrete", "≥ 2.0", "MPa", printed="≥ 2.0 MPa", cond="when primed with Strongcoat Primer Range")
p.v("tear", "≥ 80", "N/mm", "ASTM D624", printed="≥ 80 N/mm")
p.v("crack_bridging", "no cracks occurred after 10 cycles @ 8 mm", "", "ASTM C1305", printed="no cracks occurred after 10")
p.v("service_temp", "-20 to 90", "°C", printed="-20 to 90")
p.v("tack_free", "5 - 7", "sec", printed="5 - 7 sec")
p.v("traffic_light", "3", "hr", printed="3 hr")
p.v("cure_full", "12", "hr", printed="12 hr", label="Curing time", held="C-01")
p.v("shelf_life", "12", "months", printed="12 months")
p.use("B", "Sloped and flat roofs (walkable), balconies, and")
p.use("B", "Green roofs.")
p.use("A", "Retaining walls and foundations.")
p.use("B", "Concrete decks.")
p.use("D", "Swimming pools, aquariums, lakes.", "ASSUMED", "Swimming pool mapped to zone D by me — confirm")
p.use(None, "Car park and bridge decks.", "EXCLUDED-AREA", "Car park decks belong to Flooring per brief; do not show")
P.append(p)

p = Product("PU-C100", "DonProof PU-C100", "user-supplied/DonProof_PU-C100.pdf", "DonProof liquid polyurea (cold applied)",
            "Waterproofing", LIQ)
p.ms("user-supplied/DonProof_PU-C100_MS.pdf", "DCP03/08-0207-B-2026")
p.v("coverage", "minimum total consumption 1.8 - 2.0 kg/m² to provide 1.5 mm total dry film thickness", "", printed=["1.8 - 2.0 kg/m²", "1.5 mm total dry film thickness"])
p.v("tensile", "≥ 3.5", "MPa", "ASTM D412", printed="≥ 3.5 MPa")
p.v("elongation", "≥ 450", "%", "ASTM D412", printed="≥ 450%")
p.v("bond_concrete", "≥ 1.5", "MPa", "ASTM D4541", printed="≥ 1.5 MPa")
p.v("tear", "≥ 20", "N/mm", "ASTM D624", printed="≥ 20 N/mm")
p.v("crack_bridging", "no cracks occurred after 10 cycles @ 1.5 mm", "", "ASTM C1305 @ 23oC & 20oC", printed="no cracks occurred after 10")
p.v("service_temp", "-30 to 80", "°C", printed="-30 to 80")
p.v("pot_life", "70 min @ 25°C; 50 min @ 40°C", "", printed="70 min@ 25")
p.v("tack_free", "3:30 - 4:30", "hr", printed="3:30 - 4:30 hr")
p.v("recoat", "min 4 hr; max 7 days", "", printed="7 days", label="Minimum / maximum recoating time")
p.v("cure_full", "7", "days", printed="7 days", label="Full cure")
p.v("voc", "≤ 130", "g/ltr", printed="≤ 130 g/ltr")
p.v("shelf_life", "12", "months", printed="12 months")
p.use("C", "Wet areas, bathrooms and kitchens.")
p.use("C", "Balconies and roof decks.")
p.use("B", "Green roofs and planters.")
p.use("B", "Light roofing made of metal or fibrous cement.")
p.use(None, "Floors, parking lots and garages.", "EXCLUDED-AREA", "parking = Flooring; do not show")
P.append(p)

# ---------------------------------------------------------------- sheet membranes
p = Product("HS", "DonProof HS", "DonProof HS.pdf", "DonProof sheet membranes", "Waterproofing", SHEET + ["crack_bridging"],
            na=["crack_bridging"])
p.ms("user-supplied/DonProof_HS_MS.pdf", "DCP00/08-0201-B-2026")
p.v("thickness", "1.2, 1.5 or 2.0", "mm", printed="1.2, 1.5 or 2.0 mm")
p.v("tensile", "≥ 22", "MPa", "ASTM D 412, modified", printed="≥ 22 MPa", cond="MD")
p.v("elongation", "≥ 500", "%", "ASTM D 412, modified", printed="≥ 500%")
p.v("tensile_en", "≥ 15", "MPa", "EN ISO 12311-2 Method B", printed="≥ 15 MPa", cond="MD")
p.v("elongation_en", "≥ 400", "%", "EN 12311-2 Method B", printed="≥ 400%", cond="MD / CMD")
p.v("puncture_resistance", "1000", "N", "ASTM E 154", printed="1000 N")
p.v("hydrostatic_pressure", "≥ 0.7 MPa, (~7 bar)", "", "ASTM D 5385: 1993, modified", printed="≥ 0.7 MPa, (~7 bar)")
p.v("water_tightness", "Watertight, 7 bar, 72 hr", "", "DIN EN 1928:2000 (Method B)", printed="Watertight, 7 bar, 72 hr")
p.v("low_temp_flex", "-25 (Pass)", "", "ASTM D 1970", printed="-25")
p.std("DonProof HS complies with DIN EN 13967, Type T")
p.use("A", "Below-grade waterproofing.")
p.use("A", "Foundations and basements.")
p.use("A", "Tunneling (MRT, subways, metro).", "TDS-LISTED", "tunnels: no film zone; shown only as below-grade civil use if approved")
P.append(p)

p = Product("FB", "DonProof FB", "DonProof FB.pdf", "DonProof sheet membranes", "Waterproofing", SHEET + ["crack_bridging"])
p.ms("user-supplied/DonProof_FBFB-S_MS.pdf", "DCP00/08-0199/0200-A-2025")
p.v("thickness", "1.9", "mm", "EN 1849-2", printed="1.9 mm")
p.v("tensile", "≥ 500", "N/50 mm", "EN ISO 12311-2 (A)", printed="≥ 500 N/50 mm", cond="MD/CMD")
p.v("water_tightness", "≥ 690", "kPa", "ASTM D 5385", printed="≥ 690 kPa")
p.v("water_tightness_en", "≥ 500 kPa @ 72 hr", "", "EN 1928 (B)", printed="≥ 500 kPa @ 72 hr")
p.v("crack_bridging", "≥ 3.2", "mm", "ASTM D 5385", printed="≥ 3.2 mm", label="Crack bridging ability")
p.v("service_temp", "-5 to 50", "°C", printed="-5 to 50", label="Working temperature")
p.v("tear", "≥ 350", "N (Nail shank)", "EN 12310-1", printed="≥ 350 N (Nail shank)")
p.v("impact_resistance", "≥ 350", "mm", "EN 12691 (A)", printed="≥ 350 mm")
p.v("shelf_life", "18", "months", printed="18 months")
p.v("cushion_layer", "no less than 300", "g/m² (geotextile over blinding)", printed="300g/m²")
p.v("fillet", "20", "mm (base of retaining walls, stop ends, upstands)", printed="A 20 mm fillet")
p.v("overlap_min", "50", "mm", printed="overlapped by a minimum of 50 mm")
p.std("DIN EN 13967 Type A and")
p.use("A", "Foundations and basements.")
p.use("A", "Retaining walls and floor slabs.")
p.use("A", "Tunnel walls and base slabs.")
p.use(None, "Underground car parks and garages.", "EXCLUDED-AREA", "listed under below-grade uses; underground car-park DECKS are Flooring — confirm whether this may be shown")
p.note("Elongation is not reported in this TDS (FB-S reports it).")
P.append(p)

p = Product("FB-S", "DonProof FB-S", "DonProof FB-S.pdf", "DonProof sheet membranes", "Waterproofing", SHEET + ["crack_bridging"])
p.ms("user-supplied/DonProof_FBFB-S_MS.pdf", "DCP00/08-0199/0200-A-2025")
p.v("thickness", "1.6 mm ± 10%", "", "EN 1849-2", printed="1.6 mm ± 10%")
p.v("tensile", "≥ 980", "N/50 mm", "EN ISO 12311-2 (A)", printed="≥ 980 N/50 mm", cond="MD/CMD")
p.v("elongation", "≥ 240", "%", "EN ISO 12311-2 (A)", printed="≥ 240%", cond="MD/CMD")
p.v("water_tightness", "≥ 690", "kPa", "ASTM D 5385", printed="≥ 690 kPa")
p.v("water_tightness_en", "≥ 500 kPa @ 72 hr", "", "EN 1928 (B)", printed="≥ 500 kPa @ 72 hr")
p.v("crack_bridging", "≥ 3.2", "mm", "ASTM D 5385", printed="≥ 3.2 mm", label="Crack bridging ability")
p.v("service_temp", "-5 to 50", "°C", printed="-5 to 50", label="Working temperature")
p.v("tear", "≥ 500", "N (Nail shank)", "EN 12310-1", printed="≥ 500 N (Nail shank)")
p.v("impact_resistance", "≥ 600", "mm", "EN 12691 (A)", printed="≥ 600 mm")
p.v("shelf_life", "12", "months", printed="12 months")
p.std("DIN EN 13967 Type A and")
p.use("A", "Sealing of precast concrete elements to enhance joint")
p.use("A", "Marine and salt-contaminated environments.")
P.append(p)

p = Product("L", "DonProof L", "DonProof L_4.pdf", "DonProof sheet membranes", "Waterproofing", SHEET + ["crack_bridging"],
            na=["crack_bridging"])
p.ms("user-supplied/DonProof_L_MS.pdf", "DCP00/08-0198-A-2025")
p.v("thickness", "1.5 / 2.0 / 2.5 / 3.0", "mm", "EN 1849-2", printed="1.5 ± 5% mm", cond="nominal grades L1.5 / L2.0 / L2.5 / L3.0")
p.v("tensile", "15 / 14 (L1.5); 17 / 16 (L2.0); 16 / 16 (L2.5); 16 / 16 (L3.0)", "N/mm²", "EN 12311-2 Method B dumbbell", printed="15 / 14 N/mm²", cond="L/T")
p.v("elongation", "250 / 250 (L1.5); 300 / 300 (L2.0, L2.5, L3.0)", "%", "EN 12311-2 Method B dumbbell", printed="250 / 250%", cond="L/T")
p.v("water_tightness", "Waterproof", "", "EN 1296 / EN 1928 (7 bars)", printed="Waterproof")
p.v("service_temp", "-25 (L1.5, L2.0, L2.5); -30 (L3.0)", "°C", "EN 495-5", printed="-25oC", label="Foldability at low temperature — not a service-temperature range")
p.v("shelf_life", "18", "months", printed="18 months")
p.std("DonProof L complies with EN 13967 and EN 13491")
p.use("A", "Tunnels.")
p.use("A", "Foundations and retaining walls.")
p.use("A", "Vertical and horizontal sealing")
p.use("B", "Covered or protected roof applications.")
p.use("B", "Terraces.")
p.note("DonProof L is a SHEET (loose-laid PVC) membrane — the brief lists it under liquid-applied. See qa/scope_sheet.md.")
P.append(p)

p = Product("R", "DonProof R", "DonProof R_6.pdf", "DonProof sheet membranes", "Waterproofing", SHEET + ["crack_bridging"],
            na=["crack_bridging"])
p.ms("user-supplied/DonProof_R_MS.pdf", "DCP00/08-0197-A-2025")
p.v("thickness", "1.2 / 1.5 / 1.8 / 2.0", "mm", "EN 1849-2", printed="1.2 mm", cond="grades R1.2 / R1.5 / R1.8 / R2.0 (MDV)")
p.v("tensile", "≥ 1050", "N/50 mm", "EN 12311-2 (A)", printed="≥ 1050 N/50 mm", cond="L/T (MLV)")
p.v("elongation", "≥ 15", "%", "EN 12311-2 (A)", printed="≥ 15%", cond="L/T (MLV)")
p.v("water_tightness", "Pass (10 kPa)", "", "EN 1928 (A)", printed="Pass (10 kPa)")
p.v("service_temp", "≤ -25", "°C", "EN 495-5", printed="≤ -25", label="Foldability at low temperatures — not a service-temperature range")
p.v("uv_exposure", "Pass ≥ 5000 h", "", "EN 1297", printed="Pass ≥ 5000 h")
p.v("shelf_life", "5", "years", printed="Shelf life is 5 years")
p.std("EN 13956 as per the technical properties table")
p.use("B", "Green roof systems.")
p.use("B", "Ballasted roof systems.")
p.use("B", "Open, fully exposed roof surfaces.")
p.use("B", "Terraces.")
p.note("DonProof R is a SHEET (FPO/TPO) roofing membrane — the brief lists it under liquid-applied.")
P.append(p)

# ---------------------------------------------------------------- epoxy / protective
p = Product("EPW", "Strongcoat EPW (EPW-P / EPW-S, one TDS)", "Strongcoat EPW_TDS_4.pdf", "Strongcoat epoxy waterproofing",
            "Waterproofing", LIQ)
p.ms("user-supplied/Strongcoat_EPW_MS.pdf")
p.v("coverage", "0.75 kg/m² per 500 microns DFT per 2 coats", "", printed="0.75 kg/m² per 500 microns DFT per 2 coats")
p.v("tensile", "7.5", "MPa", "ASTM D412", printed="7.5 MPa")
p.v("elongation", "> 20", "% @ 7 days", "ASTM D412", printed="> 20% @ 7 days")
p.v("bond_concrete", "2", "MPa (concrete failure)", "ASTM D4541", printed="2 MPa")
p.v("crack_bridging", "Class A3", "", "EN 1062-7", printed="Class A3")
p.v("service_temp", "-10 to 70", "°C", printed="-10 to 70")
p.v("pot_life", "60 min @ 25°C; 45 min @ 35°C; 30 min @ 45°C", "", printed="60 min @ 25")
p.v("recoat", "24 hr @ 25°C; 16 hr @ 35°C; 10 hr @ 45°C", "", printed="24 hr @ 25", label="Time between coats")
p.v("cure_full", "7 days @ 25°C; 4 days @ 35°C; 2 days @ 45°C", "", printed="7 days @ 25", label="Full cure")
p.v("voc", "< 30", "g/ltr", printed="< 30 g/ltr")
p.v("colour", "EPW-P: Light grey; EPW-S: Black", "", printed=["EPW-P: Light", "EPW-S: Black"])
p.v("chem_citric_acid_10_7d", "EPW-P: R; EPW-S: RS + SS", "", "ASTM D1308 (7 days immersion)", printed="RS + SS")
p.v("chem_nitric_acid_25_spot", "EPW-P: RS; EPW-S: R", "", "ASTM D1308 (spot test @ 1 hr)", printed=["Nitric Acid 25%", "RS"])
p.v("shelf_life", "12", "months", printed="12 months")
p.std("EN1504-2")
p.std("BS 6920:2000")
p.use("D", "Strongcoat EPW-P is suitable for use with potable water")
p.use("D", "Strongcoat EPW-S is suitable for use in reservoirs")
p.use("G", "Heavy duty protective and waterproof coating for")
p.use(None, "Heavy duty wall and floor coating in food processing", "EXCLUDED-AREA", "TDS also lists car parks")
p.note("EPW-P and EPW-S share one TDS; they differ in colour and chemical-resistance table only.")
P.append(p)

p = Product("EN100", "Strongcoat EN100", "Strongcoat EN100_TDS_4.pdf", "Strongcoat epoxy novolac", "Protective", LIQ)
p.ms("user-supplied-2/Strongcoat_EN100.pdf")
p.v("coverage", "Standard: base coat 0.33 kg/m²; topcoat 0.33 kg/m²; approximate system thickness 1.5 mm", "", printed="Approximate system thickness: 1.5 mm")
p.v("tensile", "≥ 20", "MPa", "ASTM D638", printed="≥ 20 MPa")
p.v("bond_concrete", "≥ 2", "MPa (concrete failure)", "ASTM D4541", printed="≥ 2 MPa")
p.v("pot_life", "40 min @ 25°C", "", printed="40 min @ 25", held="C-09")
p.v("recoat", "≤ 18 hr @ 23°C; ≤ 12 hr @ 35°C", "", printed="≤ 18 hr @ 23", label="Over-coating time")
p.v("cure_full", "7 days @ 25°C", "", printed="7 days @ 25")
p.v("voc", "≤ 10", "g/ltr", "ASTM D2369", printed="≤ 10 g/ltr")
p.v("shelf_life", "12", "months", printed="12 months")
p.use("G", "Chemical plants.")
p.use("G", "Sewage treatment plants.")
p.use("G", "Petroleum refineries.")
p.note("TDS: 'suitable for use on concrete and steel surfaces'. Elongation, crack bridging and service temperature are not reported.")
P.append(p)

p = Product("SETSEAL-300C", "Setseal 300C", "user-supplied/Setseal_300C.pdf", "Setseal cementitious", "Waterproofing", CEM)
p.v("thickness_min", "2 mm (with two coats)", "", printed="2 mm (with two coats)", label="Application thickness")
p.v("tensile", "≥ 1.0", "MPa @ 28 days, 2 mm", "ASTM D412", printed="≥ 1.0 MPa @ 28 days, 2 mm")
p.v("elongation", "≥ 20", "% @ 28 days, 2 mm", "ASTM D412", printed="≥ 20% @ 28 days, 2 mm")
p.v("bond_concrete", "≥ 2.0", "MPa @ 28 days", "ASTM D4541", printed="≥ 2.0 MPa @ 28 days")
p.v("crack_bridging", "≥ 0.75", "mm", "EN 14891 (under standard condition)", printed="≥ 0.75 mm")
p.v("pot_life", "1", "hr", printed="1 hr", label="Working time")
p.v("water_permeability", "Nil @ 5 bars", "", "DIN 1048", printed="Nil @ 5 bars")
p.v("shelf_life", "12", "months", printed="12 months")
p.std("EN 14891, Type CM")
p.use("D", "water retaining structures and")
p.use("A", "basements, roofs, and")
p.use("C", "bathrooms and wet areas.")
p.use("F", "masonry against carbon dioxide")
p.note("Setseal 300C is a one-component cementitious waterproof COATING, not a joint sealant (brief lists it under joint sealants).")
P.append(p)

p = Product("SETSEAL-R", "Setseal R", "Setseal R_TDS_9.pdf", "Setseal cementitious (crystalline)", "Waterproofing",
            CEM, na=["thickness_min", "tensile", "elongation", "bond_concrete", "crack_bridging"])
p.v("pot_life", "25 - 45", "min @ 25°C", printed="25 - 45 min @ 25", label="Working time")
p.v("coverage", "1 – 1.5 kg dry powder/m² per coat; 25 kg bag covers 17 – 20 m² per coat", "", printed="17 – 20 m² per coat")
p.v("water_permeability", "At 8 bars: Impermeable", "", "DIN 1048", printed="At 8 bars: Impermeable")
p.v("shelf_life", "12", "months", printed="12 months")
p.std("BS 6920:2000")
p.use("D", "Potable water tanks.")
p.use("A", "Basements.")
p.use("A", "Retaining walls and foundations.")
p.use("D", "Swimming pools.")
p.use("D", "Sewage tanks.")
p.note("TDS describes Setseal R as a 'cementitious crystalline capillary waterproofing system'. Brief excludes crystalline products (Admixtures) AND lists it as a joint sealant. See scope sheet.")
P.append(p)

p = Product("REPCOAT", "Repcoat", "Repcoat_TDS_1.pdf", "Repcoat anti-carbonation", "Protective", LIQ, na=["pot_life", "cure_full"])
p.v("coverage", "0.38 litre/m2 per coat to achieve 200 microns dry film thickness", "", printed="0.38 litre/m2 per coat to achieve 200 microns dry film thickness")
p.v("primer_coverage", "Repcoat Primer 0.1 - 0.2 litre/m2, depending on the substrate porosity", "", printed="0.1 - 0.2 litre/m2")
p.v("tensile", "≥ 1.5", "MPa @ 7 days", "ASTM D412", printed="≥ 1.5 MPa @ 7 days")
p.v("elongation", "≥ 350", "% @ 7 days", "ASTM D412", printed="≥ 350% @ 7 days")
p.v("recoat", "4 hr @ 25°C; 2 hr @ 35°C", "", printed="4 hr @ 25", label="Overcoating time between consecutive coats")
p.v("co2_permeability", "> 60 m (EN 1504-2 requirement SD > 50 m)", "", "EN 1062-6", printed="> 60 m")
p.v("carbonation_depth", "No penetration in coated sample", "", "TM:NT Build 372:1991-02", printed="No penetration in coated")
p.v("voc", "< 50", "g/ltr", printed="< 50 g/ltr")
p.v("shelf_life", "12", "months", printed="12 months")
p.std("EN 1504-2")
p.use("F", "Bridge abutments.")
p.use("F", "Multistory building and villas.")
p.use("F", "Concrete cladding.")
p.use("F", "External concrete surfaces of storage tank and")
P.append(p)

p = Product("REPCOAT-FF", "Repcoat FF", "Repcoat FF_TDS_4.pdf", "Repcoat anti-carbonation", "Protective", LIQ, na=["pot_life", "cure_full"])
p.ms("user-supplied-2/Repcoat_FF.pdf")
p.v("coverage", "0.23 - 0.29 litre/m²/coat to give between 80 - 100 micron DFT", "", printed="0.23 - 0.29 litre/m²/coat")
p.v("recoat", "2:00 hr @ 25°C; 1:30 hr @ 35°C", "", printed="2:00 hr @ 25", label="Over coating time")
p.v("carbonation_resistance", "≥ 85% reduction in carbonation depth against control", "", "EN13295, 14 days (exposure to 10% CO2)", printed="≥ 85% reduction in")
p.v("voc", "< 50", "g/ltr", printed="< 50 g/ltr")
p.v("shelf_life", "18", "months", printed="18 months")
p.use("F", "Retaining walls.")
p.use("F", "Bridge abutments.")
p.use("F", "Multistory buildings and villas.")
p.use("F", "Pre-cast elements and concrete cladding.")
P.append(p)

p = Product("STRONGCOAT-HB", "Strongcoat HB", "Strongcoat HB_TDS_18.pdf", "Strongcoat floor coating", "Protective (FLAGGED: TDS = floor coating)",
            LIQ, na=["cure_full"])
p.v("pot_life", "60 - 100 min @ 25°C; 20 - 40 min @ 35°C", "", printed="60 - 100 min @ 25")
p.v("tensile", "≥ 20", "MPa @ 7 days", "ASTM D638", printed="≥ 20 MPa @ 7 days")
p.v("bond_concrete", "≥ 2", "MPa @ 7 days (concrete failure)", "ASTM D4541 / EN 1542", printed="≥ 2 MPa @ 7 days")
p.v("voc", "≤ 10", "g/ltr", "ASTM D2369", printed="≤ 10 g/ltr")
p.std("EN 1504-2")
p.use(None, "Aircraft hangars.", "NO-FILM-ZONE", "all listed uses are concrete floors; zone G (steel & industrial) NOT supported by this TDS")
p.use(None, "Car parks.", "EXCLUDED-AREA")
p.note("TDS title: 'Solvent free high build epoxy floor coating'. Brief excludes Strongcoat floor systems yet lists HB as in scope — decision needed.")
P.append(p)

# ---------------------------------------------------------------- approved candidates (scope approved by user)
p = Product("AQUATHANE-R100", "Aquathane R100", "Aquathane R100_TDS_17.pdf", "Aquathane liquid PU", "Waterproofing", LIQ,
            na=["coverage", "pot_life"])
p.v("tensile", "≥ 5", "MPa", "ASTM D412", printed="≥ 5 MPa")
p.v("elongation", "≥ 500", "%", "ASTM D412", printed="≥ 500%")
p.v("bond_concrete", "≥ 1", "MPa", "ASTM D4541", printed="≥ 1 MPa", label="Bond strength (substrate not stated)")
p.v("service_temp", "-40 to 80", "°C", printed="-40 to 80")
p.v("recoat", "6 - 24", "hr", printed="6 - 24 hr", label="Recoatable time")
p.v("cure_full", "7", "days", printed="7 days", label="Final curing time")
p.v("tack_free", "4 - 8", "hr", printed="4 - 8 hr")
p.v("shelf_life", "12", "months", printed="12 months")
p.std("Aquathane R100 complies with ASTM C836.")
p.use("B", "Roofs.")
p.use("C", "Wet areas, bathrooms and kitchens.")
p.use("C", "Verandas and balconies.")
p.use("A", "Retaining walls and basements.")
p.use("B", "green roofs.")
p.note("TDS LIMITATION: 'Not recommended for waterproofing of swimming pools surfaces in contact with chemically treated water.' Crack bridging and VOC not reported.")
P.append(p)

p = Product("AQUATHANE-E400", "Aquathane E400", "Aquathane E400_1.pdf", "Aquathane liquid PU", "Waterproofing", LIQ,
            na=["coverage", "pot_life"])
p.v("tensile", "> 1.3", "MPa @ 23oC", "ASTM D412, Die C", printed="> 1.3 MPa @ 23oC")
p.v("elongation", "> 400", "%", "ASTM D412, Die C", printed="> 400%")
p.v("bond_concrete", "> 1.3", "MPa", "ASTM D4541", printed="> 1.3 MPa", label="Adhesion to concrete")
p.v("crack_bridging", "3", "mm @ 23oC", "ASTM C1305", printed="3 mm @ 23oC")
p.v("service_temp", "-5 to +70", "°C", printed="-5 to +70")
p.v("cure_full", "7 days @ 23oC", "", printed="7 days @ 23oC", label="Full cure")
p.v("shelf_life", "12", "months", printed="12 months")
p.v("coverage", "Total consumption: 1.1 - 1.3 kg/m² to provide 500 microns dry film thickness (two coats)", "", printed="1.1 - 1.3 kg/m² to provide 500 microns", src=("user-supplied/Aquathane_E400_MS.pdf", "DCP00/08-0106-B-2024"))
p.std("LEED EQ Credit 4.2")
p.ms("user-supplied/Aquathane_E400_MS.pdf", "DCP00/08-0106-B-2024")
p.use("B", "Exposed roofs, balconies and decks.")
p.use("C", "Wet areas, kitchens and bathrooms (under tiles).")
p.use("A", "Basements and retaining walls.")
p.note("VOC: TDS says 'Low VOC content' / 'VOC < 100 g/l' (LEED statement), no measured value with test standard -> VOC left as [DATA REQUIRED].")
P.append(p)

p = Product("HYDROSTOP-HW", "Hydrostop HW", "Hydrostop HW_TDS_11.pdf", "Waterstop (accessory)", "Accessory (joints)",
            ["tensile", "elongation", "service_temp", "shelf_life"], na=["service_temp", "shelf_life"])
p.ms("user-supplied/Hydrostop_Range_MS.pdf", "DCP00/05-0115-A-2024")
p.v("tensile", "≥ 13.0", "MPa", "ASTM D638, Type I", printed="≥ 13.0 MPa")
p.v("elongation", "> 300", "%", "ASTM D638, Type I", printed="> 300 %")
p.v("hardness", "80 - 90 (Initial)", "Shore A", "ASTM D2240", printed="80 - 90 (Initial)")
p.std("BS 2782")
p.use("E", "contraction and expansion concrete joints in the following")
p.use("D", "Water reservoirs.")
p.use("D", "Swimming pools.")
p.use("A", "Retaining walls, foundations,")
P.append(p)

p = Product("HYPERSEAL-DP2010H", "Hyperseal DP-2010H", "Hyperseal DP-2010H_TDS_2.pdf", "Hydrophilic waterstop (accessory)", "Accessory (joints)",
            ["service_temp", "shelf_life", "expansion"], na=["shelf_life"])
p.ms("user-supplied-2/Hyperseal_DP-2010H.pdf")
p.v("service_temp", "-30 to 70", "°C", printed="-30 to 70")
p.v("expansion", "Fresh water 200%; Saline water 80 - 100%", "", printed="200%", label="Expansion volume")
p.v("hydrostatic_pressure", "> 50 m (5 bars)", "", printed="> 50 m (5 bars)")
p.std("KS M 6518")
p.use("E", "Hydrophilic waterstop can be applied against existing")
p.note("TDS: 'should not be used in expansion joints, or any concrete section of less than 150 mm width.'")
P.append(p)

p = Product("REPCOAT-S", "Repcoat S", "regional/lb/Repcoat S_TDS.pdf", "Repcoat anti-carbonation (solvent, aliphatic acrylate)", "Protective", LIQ,
            na=["pot_life", "cure_full", "tensile", "elongation", "bond_concrete", "crack_bridging", "service_temp"])
p.v("coverage", "0.16 litre/m²/coat (Repcoat S Primer 0.2 litre/m²/coat)", "", printed="0.16 litre/m²/coat")
p.v("recoat", "5 hr @ 25°C (over Repcoat S Primer)", "", printed="5 hr @ 25", label="Over coating time for Repcoat S Primer")
p.v("co2_permeability", "> 250 m equivalent thickness of air", "", "Taywood method", printed="> 250 m equivalent")
p.use("F", "Retaining walls.")
p.use("F", "Bridge abutments.")
p.use("F", "buildings and villas.")
P.append(p)

p = Product("REPCOAT-P", "Repcoat P", "Repcoat P_TDS_7.pdf", "Repcoat PU protective", "Protective", LIQ,
            na=["coverage", "elongation", "crack_bridging", "service_temp"])
p.v("tensile", "≥ 4", "MPa @ 7 days", "ASTM D412", printed="≥ 4 MPa @ 7 days")
p.v("bond_concrete", "≥ 2.0", "MPa @ 7 days (concrete failure)", "ASTM D4541", printed="≥ 2.0 MPa @ 7 days")
p.v("pot_life", "4 - 6", "hr @ 25oC", printed="4 - 6 hr @ 25")
p.v("recoat", "24", "hr @ 25oC", printed="24 hr @ 25", label="Overcoating time")
p.v("cure_full", "7", "days", printed="7 days", label="Full curing")
p.use("G", "Steel tanks.")
p.use("G", "Chemical processing areas.")
p.use("G", "Concrete walls and floors.")
P.append(p)

# ---------------------------------------------------------------- supplied by user after Phase 2 (primers, topcoat, FF Plus)
p = Product("PRIMER-EP", "DonProof Primer EP", "user-supplied/DonProof_Primer_PE.pdf", "DonProof primers", "Accessory (primer)",
            ["coverage", "pot_life", "recoat", "bond_concrete", "voc", "shelf_life"])
p.v("coverage", "3.5 - 3.7 m²/kg to achieve a dry film thickness of approximately 200 micron per coat", "", printed=["3.5 -", "3.7 m²/kg", "200 micron per coat"], held="C-08")
p.v("pot_life", "30 - 60", "min", printed="30 - 60 min")
p.v("recoat", "12 - 24", "hr", printed="12 - 24 hr", label="Overcoating time")
p.v("bond_concrete", "≥ 3", "MPa (concrete failure)", "ASTM D4541-85", printed="≥ 3 MPa")
p.v("voc", "< 20", "g/ltr", "ASTM D2369", printed="< 20 g/ltr")
p.v("shelf_life", "12", "months", printed="12 months")
p.note("Epoxy primer for polyurea systems. PU-P150 TDS names it for concrete; PU-P60/P100/H50 TDS still name 'Strongcoat Primer Range' (PRIMER_NAMING).")
P.append(p)

p = Product("PRIMER-PU", "DonProof Primer PU", "user-supplied/DonProof_Primer_PU.pdf", "DonProof primers", "Accessory (primer)",
            ["coverage", "recoat", "voc", "shelf_life"], na=["voc"])
p.v("coverage", "5 - 10 m²/ltr depending on the substrate porosity to achieve a dry film thickness of 40 - 80 microns per layer", "", printed=["5 - 10 m²/ltr", "40 - 80"])
p.v("recoat", "min 24 hr @ 25oC; max 48 hr @ 25oC", "", printed="48 hr @ 25", label="Minimum / maximum overcoating time")
p.v("shelf_life", "9", "months", printed="9 months")
p.note("TDS Applications line reads 'enhance the bond between Aquathane Range of products' while title/advantages say DonProof range — wording inconsistency, see qa/conflicts.md C-07. Not recommended over substrate RH > 80%.")
P.append(p)

p = Product("PRIMER-PU1000", "DonProof Primer PU1000", "user-supplied/Donproof_Primer_PU1000.pdf", "DonProof primers", "Accessory (primer)",
            ["coverage", "recoat", "bond_concrete", "shelf_life"])
p.v("coverage", "0.10 - 0.15 kg/m² in thin coats", "", printed="0.10 - 0.15 kg/m²")
p.v("recoat", "3 to 48", "hr @ 25oC", printed="3 to 48 hr @ 25", label="Overcoating time")
p.v("bond_concrete", "≥ 2", "MPa", "EN 1542", printed="≥ 2 MPa")
p.v("shelf_life", "12", "months", printed="12 months")
p.note("Adhesion promoter on OLD DonProof PU membranes / repairs / overlaps. Not used in the film's build-ups.")
P.append(p)

p = Product("AL", "DonProof AL", "user-supplied/DonProof_AL.pdf", "DonProof topcoat", "Protective (aliphatic PU topcoat for polyurea)",
            ["coverage", "tensile", "elongation", "bond_concrete", "recoat", "shelf_life"], na=["bond_concrete"])
p.v("coverage", "Approximately 2.5 - 3.5 m²/kg per coat", "", printed="Approximately 2.5 - 3.5 m²/kg per coat")
p.v("tensile", "> 4", "MPa @ 7 days", "ASTM D412", printed="> 4 MPa @ 7 days")
p.v("elongation", "> 400", "% @ 7 days", "ASTM D412", printed="> 400% @ 7 days", label="Elongation at break")
p.v("tear", "> 18", "N/mm", "ASTM D624, Die C", printed="> 18 N/mm")
p.v("bond_polyurea", "> 1.5 MPa (1 coat @ 200 microns)", "", printed="> 1.5 MPa")
p.v("tack_free", "4 - 6", "hr @ RH 55 ± 5%", printed="4 - 6 hr @ RH 55 ± 5%")
p.v("recoat", "minimum overcoating time 7 - 8 hours", "", printed="7 - 8 hours", label="Minimum overcoating time")
p.v("shelf_life", "12", "months", printed="12 months")
p.use("B", "Exposed roofs, flat and sloped.")
p.use("B", "Balconies, terraces and podium decks.")
p.use("C", "Balconies, terraces and podium decks.")
p.note("This is the 'aliphatic PU topcoat' of the brief. VOC not reported.")
P.append(p)

p = Product("REPCOAT-FF-PLUS", "Repcoat FF Plus", "user-supplied/Repcoat_FF_Plus.pdf", "Repcoat anti-carbonation", "Protective", LIQ + ["carbonation_resistance"],
            na=["pot_life", "cure_full", "tensile", "elongation", "bond_concrete", "crack_bridging", "service_temp"])
p.v("coverage", "0.18 - 0.22 litre/m²/coat to give between 70 - 90 micron DFT", "", printed="0.18 - 0.22 litre/m²/coat")
p.v("recoat", "2:00 hr @ 25°C; 1:30 hr @ 35°C", "", printed="2:00 hr @ 25", label="Over coating time")
p.v("voc", "< 50", "g/ltr", printed="< 50 g/ltr")
p.v("shelf_life", "12", "months", printed="12 months")
p.use("F", "Retaining walls.")
p.use("F", "Bridge abutments.")
p.use("F", "Pre-cast elements and concrete cladding.")
p.note("TDS reports no carbonation-resistance value or standard.")
P.append(p)

out = [x.done() for x in P]

APPROVED_BY_USER = "APPROVED by user (reply after Phase 1)"
DECISIONS = {
 "STRONGCOAT-HB": "DROPPED: floor coating (user confirmed)",
 "L": "KEPT (listed in brief); L vs R comparison DROPPED (user confirmed)",
 "R": "KEPT (listed in brief); L vs R comparison DROPPED (user confirmed)",
 "SETSEAL-300C": "KEPT as cementitious waterproof coating; joint-sealant pairing DROPPED (user confirmed)",
 "SETSEAL-R": "KEPT (listed in brief; TDS says crystalline capillary system — flagged); pairing DROPPED (user confirmed)",
}
for o in out:
    o["scope_decision"] = DECISIONS.get(o["id"], APPROVED_BY_USER)
    for u in o["uses"]:
        if u["mapping"] == "ASSUMED":
            u["mapping"] = "USER-CONFIRMED"
        if u["mapping"] == "EXCLUDED-AREA":
            u["mapping"] = "USER-KEEP-AS-LISTED"
            u["note"] = "User ruled: swimming-pool/car-park lines stay. No film zone exists for car parks; show as listed-use text, not as a selector-matrix tick unless a zone is added."

json.dump(dict(
    generated_by="tools/build_products.py",
    rules="All values copied as printed from source-tds PDFs. Missing = [DATA REQUIRED — R&D]. Page numbers located by script.",
    missing_marker=MISSING,
    products=out), open(os.path.join(ROOT, "data", "products.json"), "w"), ensure_ascii=False, indent=1)
print("products:", len(out), "values:", sum(len(v) for o in out for v in o["values"].values()),
      "uses:", sum(len(o["uses"]) for o in out))

if FAILS:
    print("\n".join(FAILS))
    sys.exit(1)
