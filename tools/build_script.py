#!/usr/bin/env python3
"""Phase 2: generate script/storyboard.md, script/vo_en.md and data/selector.json.

Checks (the build fails if any is broken):
  * every data key exists in data/products.json and is not held for a conflict
  * every quoted callout / choose-when line is found on its PDF page
  * a bar panel only mixes values whose test_standard strings are identical and stated
  * every beat that shows data lasts >= 2.5 s; VO fits at <= 2.7 words/s
"""
import json, os, re, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import build_products as bp

ROOT = bp.ROOT
D = json.load(open(f"{ROOT}/data/products.json"))
PR = {p["id"]: p for p in D["products"]}
ERR = []

NAMES = {pid: p["name"] for pid, p in PR.items()}
NAMES["EPW-P"] = "Strongcoat EPW-P"; NAMES["EPW-S"] = "Strongcoat EPW-S"


def val(key):
    pid, k = key.split(".", 1)
    pid = "EPW" if pid in ("EPW-P", "EPW-S") else pid
    if pid not in PR or k not in PR[pid]["values"]:
        ERR.append(f"missing data key {key}"); return None
    e = PR[pid]["values"][k][0]
    if e.get("held_conflict"):
        ERR.append(f"data key {key} is held for conflict {e['held_conflict']}")
    return e


def foot(keys):
    seen = []
    for k in keys:
        pid = k.split(".")[0]
        pid = "EPW" if pid in ("EPW-P", "EPW-S") else pid
        p = PR.get(pid)
        if p:
            s = f"Source: {p['name'].split(' (')[0]} TDS, {p['doc_code']}, {p['doc_date']}"
            if s not in seen: seen.append(s)
    return " · ".join(seen)


def probe(rel, q):
    for i, (lay, raw) in enumerate(bp.pages(rel), 1):
        for txt in (lay, raw):
            if bp.norm(q) in bp.norm(txt):
                return i
    return None


def quote_ok(pid, q, ms=False):
    pid = "EPW" if pid in ("EPW-P", "EPW-S") else pid
    if ms:
        for m in PR[pid].get("method_statements", []):
            pg = probe(m["file"], q)
            if pg:
                return pg, m
        ERR.append(f"MS quote not found for {pid}: {q}")
        return 0, None
    return bp.find_page(PR[pid]["source_file"], q), None


def keys_for(products, props):
    out = []
    for pr in props:
        if isinstance(pr, tuple):
            out += [f"{p}.{k}" for p, k in pr[1].items()]
        else:
            out += [f"{p}.{pr}" for p in products]
    return out


def panel_check(kind, products, props):
    if len(products) > 3: ERR.append("panel >3 products")
    if len(props) > 4: ERR.append("panel >4 properties")
    if kind == "bars":
        for k in props:
            stds = set()
            for p in products:
                e = val(f"{p}.{k}")
                if e: stds.add(e["test_standard"])
            if len(stds) != 1 or "NOT STATED" in stds:
                ERR.append(f"bars not allowed for {k} across {products}: standards {stds}")


beats = []  # (chapter, id, dur, visual, onscreen, keys, vo)
CHAPS = []


def B(ch, bid, dur, visual, onscreen, keys, vo):
    beats.append(dict(ch=ch, id=bid, dur=dur, visual=visual, on=onscreen, keys=keys, vo=vo))


# ---------------------------------------------------------------- Ch0
B("Ch0", "0.1", 4, "Concrete building elevation, thin linework. Rain lines fall; arrows show water entering a crack and a joint.",
  "Water ingress: cracks and joints", [], "Water enters concrete through cracks and joints.")
B("Ch0", "0.2", 4.5, "Section of a wall: CO₂ particles advance as a shaded front towards a rebar; rebar swells; a cover piece spalls.",
  "Carbonation front · corrosion · spalling", [], "Carbon dioxide advances through the cover. At the rebar, corrosion follows, and the surface spalls.")
B("Ch0", "0.3", 3.5, "Sun and a thermometer arrow cycle up and down over an exposed slab; hairline cracks open in the surface.",
  "UV and thermal cycling", [], "Sun and temperature cycles work on exposed surfaces.")

# ---------------------------------------------------------------- Ch1
ZN = {"A": "Below-grade", "B": "Roofs & podium decks", "C": "Wet areas & balconies", "D": "Water tanks & water-retaining structures",
      "E": "Joints & penetrations", "F": "Façades & exposed concrete", "G": "Steel & industrial exposure"}
ZV = {"A": "Zone A — raft, retaining walls and lift pit light up.", "B": "Zone B — roof and podium deck.",
      "C": "Zone C — bathroom and balcony.", "D": "Zone D — water tank.", "E": "Zone E — joint and pipe penetration.",
      "F": "Zone F — façade and exposed concrete.", "G": "Zone G — steel frame and industrial floor."}
B("Ch1", "1.1", 3, "Isometric cutaway building fades in line by line (BuildingCutaway).", "Where to use", [], "A building has seven places that need protection. Each has its own products.")
for i, z in enumerate("ABCDEFG"):
    B("Ch1", f"1.{i+2}", 2.5 if i < 6 else 3.5, ZV[z] + " ZoneHighlight pulses; index list on the right ticks it.", f"{z}  {ZN[z]}", [],
      {"A": "Below ground: raft, walls, lift pits.", "B": "Roofs and podium decks.", "C": "Wet areas and balconies.",
       "D": "Water tanks and water-retaining structures.", "E": "Joints and penetrations.", "F": "Façades and exposed concrete.",
       "G": "Steel and industrial exposure."}[z])

# ---------------------------------------------------------------- zone chapters
def zone(ch, z, problem, problem_vo, cands, stack, callouts, panel, choose, vo_intro, vo_stack, vo_callout, vo_panel, vo_choose):
    n = ch[2:]
    B(ch, f"{n}.1", 2.5, f"Camera zooms from the building to zone {z}; index list highlights {z}.", f"{z}  {ZN[z]}", [], vo_intro)
    B(ch, f"{n}.2", 4, "Problem diagram (linework, no numbers): " + problem, problem_vo, [], problem_vo)
    B(ch, f"{n}.3", 3.5, "Product chips slide in, colour = product family: " + ", ".join(NAMES[c] for c in cands), " · ".join(NAMES[c] for c in cands), [], "Candidate products: " + ", ".join(NAMES[c] for c in cands) + ".")
    keys = []
    for _, k in stack:
        if k: keys += k if isinstance(k, list) else [k]
    for k in keys: val(k)
    B(ch, f"{n}.4", 6, "LayerStack builds bottom-up: " + " → ".join(lbl for lbl, _ in stack), " | ".join(lbl for lbl, _ in stack), keys, vo_stack)
    ck = []
    srcs = []
    for c in callouts:
        pid, q = c[0], c[1]
        pg, m = quote_ok(pid, q, ms=len(c) > 2)
        ck.append((pid, q, pg))
        srcs.append(f"{NAMES[pid]} " + (f"Method Statement, {m['ref']}, {m['doc_date']}" if m else f"TDS, {PR['EPW' if pid in ('EPW-P','EPW-S') else pid]['doc_code']}, NOT STATED"))
    B(ch, f"{n}.5", 4.5, "DetailCallout pins on the section; wording from the method statement / TDS 'Method of use': " + " / ".join(f"“{q}” ({NAMES[p]} p{pg})" for p, q, pg in ck),
      " / ".join(q for _, q, _ in ck), [], vo_callout)
    beats[-1]["foot"] = "Source: " + " · ".join(dict.fromkeys(srcs))
    kind, prods, props = panel
    panel_check(kind, prods, props)
    pk = keys_for(prods, props)
    for k in pk: val(k)
    vis = ("ComparisonBars" if kind == "bars" else "ComparisonTable (tag: different test methods)") + ": " + ", ".join(NAMES[p] for p in prods) + " × " + ", ".join(pr[0] if isinstance(pr, tuple) else pr for pr in props)
    B(ch, f"{n}.6", 5.5, vis, ("Comparison" if kind == "bars" else "Comparison — different test methods"), pk, vo_panel)
    cc = []
    for pid, q in choose:
        pg, _ = quote_ok(pid, q); cc.append((pid, q, pg))
    B(ch, f"{n}.7", 2.5 * (1 if len(choose) <= 2 else 1.4), "Two-column 'Choose X when… / Choose Y when…' using TDS wording: " + " ; ".join(f"{NAMES[p]}: “{q}” (p{pg})" for p, q, pg in cc),
      " / ".join(f"Choose {NAMES[p]} when: {q}" for p, q, _ in cc), [], vo_choose)
    rows = []
    for pr in props:
        if isinstance(pr, tuple):
            rows.append(dict(prop=pr[0], cells=[(f"{p}.{pr[1][p]}" if p in pr[1] else None) for p in prods]))
        else:
            rows.append(dict(prop=pr, cells=[f"{p}.{pr}" for p in prods]))
    CHAPS.append(dict(ch=ch, zone=z, candidates=cands, problem=problem, problem_vo=problem_vo,
                      stack=[dict(label=l, key=k) for l, k in stack],
                      callouts=[dict(product=p, quote=q, page=pg, source=srcs[i]) for i, (p, q, pg) in enumerate(ck)],
                      panel=dict(kind=kind, products=prods, props=[r["prop"] for r in rows], rows=rows),
                      choose=[dict(product=pid, quote=q, page=pg) for (pid, q, pg) in cc]))


zone("Ch2", "A", "groundwater and soil moisture pressing on a basement wall and raft; arrows at a construction joint.",
     "Below ground, water presses on walls and slabs.",
     ["FB", "FB-S", "HS"],
     [("Blinding concrete or compacted sand", None), ("Geotextile cushion layer", "FB.cushion_layer"), ("DonProof FB membrane", "FB.thickness"), ("Structural concrete cast against membrane", None)],
     [("FB", "A 20 mm fillet should be formed at the base of the retaining walls, formwork stop ends, and upstands", "ms"), ("FB", "All overlaps of the membranes should be a minimum of 50 mm and must be detailed by a heat", "ms"), ("FB", "The ends of the membrane should be staggered by a minimum of 300 mm", "ms")],
     ("bars", ["FB", "FB-S"], ["tensile", "tear", "water_tightness", "crack_bridging"]),
     [("FB-S", "Can be used both pre- and post-applied."), ("HS", "Easy and quick application, no priming or fillets required.")],
     "Zone A: below-grade.",
     "Membrane on blinding, over a geotextile cushion; concrete is cast against it.",
     "Base fillet, minimum overlap, staggered roll ends.",
     "FB and FB-S report the same tests, so they compare directly.",
     "FB-S: pre- or post-applied. HS: no priming or fillets.")

zone("Ch3", "B", "rain and sun on a flat roof; ponding at an upstand; a crack opening under a membrane.",
     "On roofs, the surface sees rain, sun and foot traffic.",
     ["PU-P150", "PU-P100", "PU-P60"],
     [("Concrete deck", None), ("Primer — DonProof Primer EP", None), ("DonProof PU-P150 membrane", ["PU-P150.coverage", "PU-P150.thickness_min"]), ("DonProof AL aliphatic polyurethane topcoat", "AL.coverage")],
     [("PU-P60", "always apply DonProof PU-P60 perpendicularly to the substrate regardless of whether the surface is horizontal or vertical"), ("PU-P60", "a texture “stipple” coat can be applied for non-skid purposes"), ("PU-P150", "All 90-degree internal corners shall be strip coated and allowed to gel prior to application of the finish coat", "ms")],
     ("bars", ["PU-P150", "PU-P100", "PU-P60"], ["tensile", "elongation", "tear"]),
     [("PU-P150", "Under XPS insulation as part of an inverted or"), ("PU-P60", "Cold Resistance: down to minus 40ºC.")],
     "Zone B: roofs and podium decks.",
     "Primed deck, hot-sprayed polyurea, then an aliphatic polyurethane topcoat.",
     "Spray perpendicular to the substrate; strip-coat internal corners.",
     "All three report tensile, elongation and tear to the same ASTM methods.",
     "P150: inverted roofs under XPS. P60: cold resistance to minus forty.")

zone("Ch4", "C", "water splashing a tiled bathroom floor and a balcony edge; moisture tracking under tiles.",
     "In wet areas, water sits on the surface.",
     ["PU-C100", "AQUATHANE-R100", "AQUATHANE-E400"],
     [("Concrete or screed", None), ("Primer — DonProof Primer PU", "PRIMER-PU.coverage"), ("DonProof PU-C100 membrane", "PU-C100.coverage"), ("Under-tile finish", None)],
     [("AQUATHANE-E400", "formed at all corners and normal PVC pipes minimum 1 cm x 1 cm fillet", "ms"), ("AQUATHANE-E400", "with a 30 cm strip to be placed over the first coat while still wet", "ms"), ("AQUATHANE-E400", "Do not leave more than 24 hours between two coats of Aquathane E400", "ms")],
     ("bars", ["PU-C100", "AQUATHANE-R100", "AQUATHANE-E400"], ["bond_concrete"]),
     [("PU-C100", "Cold applied with a roller, brush, trowel, squeegee or"), ("AQUATHANE-E400", "Wet areas, kitchens and bathrooms (under tiles).")],
     "Zone C: wet areas and balconies.",
     "Primer, membrane in one or two coats, then the tile finish.",
     "Corner fillet, reinforcing strip at changes of plane, recoat within 24 hours.",
     "Bond to concrete is reported to the same ASTM method.",
     "C100: cold applied by roller, brush, trowel or squeegee. E400: under tiles.")

zone("Ch5", "D", "water pressing from inside a tank wall; seep at the wall-floor junction.",
     "Tanks hold water against the lining.",
     ["EPW-P", "EPW-S", "SETSEAL-300C"],
     [("Concrete wall", None), ("Strongcoat EPW — two coats", "EPW.coverage")],
     [("EPW", "Apply the second coat of Strongcoat EPW within 24 hours at 25oC or 10 hours at 45oC", "ms"), ("EPW", "Strongcoat EPW should not be applied if the application temperature is expected to drop below 5oC or if the relative humidity will exceed 90%", "ms"), ("EPW", "Application should not be carried out, when there is standing or running water.")],
     ("table", ["EPW-P", "EPW-S"], ["colour", "chem_citric_acid_10_7d", "chem_nitric_acid_25_spot"]),
     [("EPW-P", "Strongcoat EPW-P is suitable for use with potable water"), ("EPW-S", "Strongcoat EPW-S is suitable for use in reservoirs")],
     "Zone D: tanks and water-retaining structures.",
     "Two coats of Strongcoat EPW on the concrete wall.",
     "Second coat within 24 hours at 25 degrees; never over standing water.",
     "One TDS, two grades: colour and chemical resistance differ.",
     "EPW-P: potable water. EPW-S: sewage, chemicals, oils and fuel.")

zone("Ch6", "E", "a movement joint and a pipe passing through a wall; water tracks along both.",
     "Joints and penetrations are where water finds a path.",
     ["HYDROSTOP-HW", "HYPERSEAL-DP2010H"],
     [("Concrete on both sides of the joint", None), ("Hydrostop HW cast across the joint", "HYDROSTOP-HW.tensile")],
     [("HYDROSTOP-HW", "should be tied by wire to the reinforcement through the eyelets in the edge flanges"), ("HYDROSTOP-HW", "Full range of factory made junction pieces are available for all profiles"), ("HYPERSEAL-DP2010H", "Allow 24 hours for curing before pouring concrete on top of the joint", "ms")],
     ("table", ["HYDROSTOP-HW", "HYPERSEAL-DP2010H"], [("tensile", {"HYDROSTOP-HW": "tensile"}), ("elongation", {"HYDROSTOP-HW": "elongation"}), ("expansion", {"HYPERSEAL-DP2010H": "expansion"}), ("service_temp", {"HYPERSEAL-DP2010H": "service_temp"})]),
     [("HYDROSTOP-HW", "Hollow center bulb for expansion joints to accommodate"), ("HYPERSEAL-DP2010H", "Slow expansion rate to prevent damage to freshly")],
     "Zone E: joints and penetrations.",
     "A PVC waterstop is cast across the joint.",
     "Tie waterstops to reinforcement; allow 24 hours after bonding before pouring.",
     "Different tests, so each product is shown as reported.",
     "HW: hollow bulb for expansion joints. DP-2010H: not for expansion joints.")

zone("Ch7", "F", "CO₂ and rain on a façade; carbonation front inside the cover.",
     "Exposed concrete faces carbon dioxide, rain and sun.",
     ["REPCOAT", "REPCOAT-FF", "REPCOAT-FF-PLUS", "REPCOAT-S"],
     [("Concrete surface", None), ("Repcoat Primer", "REPCOAT.primer_coverage"), ("Repcoat — per coat", "REPCOAT.coverage")],
     [("REPCOAT", "Two coats should always be used on dark, absorbent and heavily textured surfaces"), ("REPCOAT", "It is important to wait for a minimum of 12 hours before the application of Repcoat"), ("REPCOAT-FF", "The first coat can be diluted by up to 15% with clean water depending on the surface porosity")],
     ("table", ["REPCOAT", "REPCOAT-FF", "REPCOAT-FF-PLUS"], ["coverage", "recoat", ("carbonation", {"REPCOAT": "carbonation_depth", "REPCOAT-FF": "carbonation_resistance", "REPCOAT-FF-PLUS": "carbonation_resistance"}), "voc"]),
     [("REPCOAT", "High build elastomeric, microporous coating."), ("REPCOAT-FF", "Matt finish helping to hide irregularities.")],
     "Zone F: façades and exposed concrete.",
     "Primer first, then Repcoat at the stated rate per coat.",
     "Wait for the primer; two coats on dark, absorbent surfaces.",
     "Carbonation is tested differently, so no bars. Missing data is tagged.",
     "Repcoat: high-build elastomeric. FF: matt finish.")

zone("Ch8", "G", "chemical splash on a steel tank and a concrete bund; corrosion at the steel edge.",
     "Industrial exposure adds chemicals.",
     ["EN100", "EPW-S", "REPCOAT-P"],
     [("Concrete or steel (grit-blasted)", None), ("Strongcoat EN100 base coat + topcoat", "EN100.coverage")],
     [("EN100", "Apply first coat of Strongcoat EN100 at a rate of 0.33 kg/m2 to achieve 250 micron thickness", "ms"), ("EN100", "Strongcoat EN100 is designed to be used without a primer."), ("EPW", "Precaution is recommended if the application is taking place at high temperatures (above 30oC)")],
     ("bars", ["EN100", "EPW-S", "REPCOAT-P"], ["bond_concrete"]),
     [("EN100", "Excellent chemical resistance."), ("REPCOAT-P", "Excellent UV resistance.")],
     "Zone G: steel and industrial exposure.",
     "EN100: base coat and topcoat on prepared concrete or steel.",
     "Base coat at the stated rate; no primer unless porous.",
     "Bond strength uses the same method for all three.",
     "EN100: chemical resistance. Repcoat P: UV resistance.")

# ---------------------------------------------------------------- selector
ZCOLS = list("ABCDEFG")
sel = []
for p in D["products"]:
    if p["scope_decision"].startswith("DROPPED") or p["classification"].startswith("Accessory (primer)"):
        continue
    zs = sorted({u["zone"] for u in p["uses"] if u["zone"]})
    other = [u["quote"] for u in p["uses"] if not u["zone"]]
    sel.append(dict(id=p["id"], name=p["name"], zones=zs, other_listed_uses=other))
json.dump(dict(rule="tick only where the TDS lists that use (data/products.json uses[])", rows=sel),
          open(f"{ROOT}/data/selector.json", "w"), ensure_ascii=False, indent=1)
json.dump(CHAPS, open(f"{ROOT}/data/chapters.json", "w"), ensure_ascii=False, indent=1)
B("Ch9", "9.1", 3, "SelectorMatrix grid draws: rows = products, columns = zones A–G + 'Other TDS-listed uses'.", "Selector matrix", [], "The matrix shows where each data sheet lists a use.")
B("Ch9", "9.2", 9, "Rows tick in family groups (spray polyurea, sheets, liquid, epoxy, cementitious, protective, accessories). Ticks only where a TDS use line maps to the zone.",
  "Zone × product", [], "A tick appears only where the data sheet lists that use. Where the sheet lists other uses, they appear in the last column.")
B("Ch9", "9.3", 8, "Index list re-lights zone by zone; unmapped uses (car parks, swimming pools handled per ruling) shown as text.", "Check each TDS for conditions", [],
  "Always check the data sheet and your project conditions before you specify.")
B("Ch10", "10.1", 6, "Text card.", "HPD and VOC data available. EPD on request. Third-party testing commissioned when a project or CE mark requires it.", [],
  "HPD and VOC data available. EPD on request. Third-party testing when a project or CE mark requires it.")
B("Ch10", "10.2", 5, "End card: logo placeholder (assets/brand not supplied), contact placeholders. No audio required.", "[Logo placeholder] · [Contact placeholder]", [],
  "Don Construction Products.")

# ---------------------------------------------------------------- checks
import math
for b in beats:
    need = math.ceil(len(b["vo"].split()) / 2.5 * 2) / 2
    if need > b["dur"]:
        b["dur"] = need
for b in beats:
    if b["keys"] and b["dur"] < 2.5:
        ERR.append(f"beat {b['id']} shows data for <2.5 s")
    wps = len(b["vo"].split()) / b["dur"]
    if wps > 2.7:
        ERR.append(f"beat {b['id']} VO {wps:.2f} words/s (>2.7): {b['vo']}")
bp_fails = list(bp.FAILS)
ERR += bp_fails
if ERR:
    print("\n".join(sorted(set(ERR)))); sys.exit(1)

total = sum(b["dur"] for b in beats)
chap = {}
for b in beats: chap[b["ch"]] = chap.get(b["ch"], 0) + b["dur"]
mm = lambda s: f"{int(round(s))//60}:{int(round(s))%60:02d}"

S = ["# Storyboard — DCP Waterproofing & Protective Coatings\n\n",
     f"**Total runtime: {mm(total)} ({total:.1f} s)** at 30 fps = {int(round(total*30))} frames. 1920×1080. Generated by `tools/build_script.py`; every data key and every quote is checked against `data/products.json` and the PDFs.\n\n",
     "Rules applied: ≤3 products and ≤4 properties per panel; bars only where all products report the same stated test standard, otherwise a table tagged *different test methods*; data labels held ≥2.5 s; footnote on every data beat; no service-life, ranking or competitor claims.\n\n",
     "| Chapter | Duration |\n|---|---|\n"]
for c, d in chap.items(): S.append(f"| {c} | {mm(d)} ({d:.1f} s) |\n")
S.append(f"| **Master** | **{mm(total)}** |\n\n")
t = 0
cur = None
for b in beats:
    if b["ch"] != cur:
        cur = b["ch"]; S.append(f"\n## {cur}\n\n")
    S.append(f"### Scene {b['id']} — {b['dur']:g} s (t = {mm(t)})\n- **Visuals:** {b['visual']}\n- **On-screen text:** {b['on']}\n")
    if b["keys"]:
        S.append("- **Data keys:** " + ", ".join(f"`{k}`" for k in b["keys"]) + "\n")
        vals = []
        for k in b["keys"]:
            e = val(k)
            shown = "Data pending" if e["value"] == bp.MISSING else f"{e['value']} {e['unit']}".strip()
            vals.append(f"{k} = {shown}" + (f" [{e['test_standard']}]" if e["test_standard"] != "NOT STATED" and e["value"] != bp.MISSING else ""))
        S.append("- **Values shown (as printed):** " + "; ".join(vals) + "\n")
        S.append("- **Footnote:** " + foot(b["keys"]) + "\n")
    if b.get("foot"):
        S.append("- **Footnote:** " + b["foot"] + "\n")
    S.append(f"- **VO:** {b['vo']}\n")
    t += b["dur"]
S.append("\n## Appendix — selector matrix (generated from TDS uses)\n\n| Product | " + " | ".join(ZCOLS) + " | Other TDS-listed uses |\n|---|" + "---|" * (len(ZCOLS) + 1) + "\n")
for r in sel:
    S.append(f"| {r['name']} | " + " | ".join("✓" if z in r["zones"] else "" for z in ZCOLS) + " | " + "; ".join(r["other_listed_uses"]) + " |\n")
open(f"{ROOT}/script/storyboard.md", "w").write("".join(S))

V = [f"# VO script (English) — total runtime {mm(total)}\n\n",
     "One line per scene; timings are scene lengths. Max 2.7 words/s. The film renders cleanly without audio.\n\n"]
t = 0
for b in beats:
    V.append(f"**[{mm(t)} · {b['id']} · {b['dur']:g} s]** {b['vo']}\n\n"); t += b["dur"]
open(f"{ROOT}/script/vo_en.md", "w").write("".join(V))
# ---- timeline + captions
def srt_time(t):
    ms = int(round(t * 1000)); h, r = divmod(ms, 3600000); m, r = divmod(r, 60000); sec, ms = divmod(r, 1000)
    return f"{h:02d}:{m:02d}:{sec:02d},{ms:03d}"


def chunks(text, n=12):
    words = text.split(); out = []
    sentences = re.split(r"(?<=[.;:!?])\s+", text)
    cur = []
    for sent in sentences:
        w = sent.split()
        while len(w) > n:
            out.append(" ".join(w[:n])); w = w[n:]
        if w: out.append(" ".join(w))
    return out

t = 0; tl = []; cues = {}
for b in beats:
    tl.append(dict(ch=b["ch"], id=b["id"], start=round(t, 3), dur=b["dur"], on=b["on"], vo=b["vo"], keys=b["keys"]))
    cs = chunks(b["vo"]); tot = sum(len(c.split()) for c in cs) or 1; u = t
    for c in cs:
        d = b["dur"] * len(c.split()) / tot
        cues.setdefault(b["ch"], []).append((u, u + d, c)); u += d
    t += b["dur"]
chapters = []
for c in chap:
    st = min(x["start"] for x in tl if x["ch"] == c)
    chapters.append(dict(id=c, start=round(st, 3), dur=round(chap[c], 3)))
os.makedirs(f"{ROOT}/script/captions", exist_ok=True)
json.dump(dict(fps=30, total=round(total, 3), chapters=chapters, beats=tl), open(f"{ROOT}/data/timeline.json", "w"), ensure_ascii=False, indent=1)
def write_srt(path, items, offset=0.0):
    with open(path, "w") as f:
        for i, (a, z, c) in enumerate(items, 1):
            f.write(f"{i}\n{srt_time(a - offset)} --> {srt_time(z - offset)}\n{c}\n\n")
write_srt(f"{ROOT}/script/captions_en.srt", [x for c in cues for x in cues[c]])
for c in cues:
    write_srt(f"{ROOT}/script/captions/{c}_en.srt", cues[c], offset=min(x['start'] for x in tl if x['ch'] == c))
# ---- sync generated zone copy into en.json (components only reference i18n keys); ar.json gets the same keys, empty
EN = f"{ROOT}/src/i18n/en.json"; AR = f"{ROOT}/src/i18n/ar.json"
en = json.load(open(EN)); en["zc"] = {c["ch"]: dict(problem=c["problem_vo"]) for c in CHAPS}
json.dump(en, open(EN, "w"), ensure_ascii=False, indent=2)
def blank_merge(src, dst):
    for k, v in src.items():
        if isinstance(v, dict):
            blank_merge(v, dst.setdefault(k, {}))
        else:
            dst.setdefault(k, "")
ar = json.load(open(AR)); blank_merge(en, ar); json.dump(ar, open(AR, "w"), ensure_ascii=False, indent=2)
# vertical cutdown captions (Ch2-Ch8 reuse the chapter cues; Overview = Ch0+Ch1; Selector = Ch9+Ch10)
import shutil
for c in ["Ch2", "Ch3", "Ch4", "Ch5", "Ch6", "Ch7", "Ch8"]:
    shutil.copy(f"{ROOT}/script/captions/{c}_en.srt", f"{ROOT}/script/captions/V-{c}_en.srt")
for name, parts in (("V-Overview", ["Ch0", "Ch1"]), ("V-Selector", ["Ch9", "Ch10"])):
    st = min(x["start"] for x in tl if x["ch"] == parts[0])
    write_srt(f"{ROOT}/script/captions/{name}_en.srt", [x for p in parts for x in cues[p]], offset=st)
print(f"runtime {mm(total)} ({total:.1f}s), scenes {len(beats)}")
