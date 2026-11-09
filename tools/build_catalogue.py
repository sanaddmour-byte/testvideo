#!/usr/bin/env python3
"""Catalogue of every other DCP document found: classification proposals for the scope sheet.

Nothing here is shown in the film. Values are NOT extracted for these products until
scope is approved (qa/scope_sheet.md). Titles/quotes are verified against the PDF.
"""
import json, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import build_products as bp  # noqa: F401  (re-runs product build; fails on mismatch)

rows = [
 # id, name, file, proposed class, title line as printed, use quote (or None), zone (or None), note
 ("AQUATHANE-R100-BLK","Aquathane R100 Black","Aquathane R100 Black_TDS_3.pdf","Waterproofing","","",None,"uses not read yet"),
 ("AQUATHANE-PUB50","Aquathane PUB50","Aquathane PUB50_TDS.pdf","Waterproofing","","Wet areas (Bathrooms, kitchens, etc.).","C",""),
 ("AQUATHANE-PRIMER-PU","Aquathane Primer PU","Aquathane Primer PU_TDS_1.pdf","Accessory (primer)","Single component solvent based polyurethane primer","",None,""),
 ("AQUASURE","AquaSure","AquaSure_5.pdf","Waterproofing","Hot-applied rubberised asphalt","Bridge decks and tunnels.","A",""),
 ("BITUPROOF-100","Bituproof 100","Bituproof 100_TDS_0.pdf","Protective","Water based rubberised bitumen protective coating","Under ground concrete foundations.","A","TDS says 'protective coating and vapour barrier' — not waterproofing"),
 ("BITUPROOF-300","Bituproof 300","Bituproof 300_TDS_1.pdf","Waterproofing","Water based rubberised bitumen coating","Retaining walls.","A",""),
 ("BITUPROOF-40S","Bituproof 40S","Bituproof 40S_11.pdf","Protective","Water based rubberised bitumen coating","Basement walls.","A","vapour barrier / curing compound / primer"),
 ("HYDROSTOP-AW-C531","Hydrostop AW-C531","Hydrostop AW-C531.pdf","Accessory (waterstop)","Joint cap PVC waterstop","Swimming pools.","E",""),
 ("HYPERSEAL-DPS200","Hyperseal DPS-200","Hyperseal DPS-200_TDS_0.pdf","Accessory (sealant)","One component hydrophilic sealant","",None,""),
 ("SEALGUARD","Sealguard","Sealguard_TDS.pdf","Waterproofing","Elastomeric acrylic waterproof coating for roofs","Waterproof coating for sloped roofs and vertical walls.","B",""),
 ("SEALGUARD-600","Sealguard 600","Sealguard 600_0.pdf","Waterproofing","Elastomeric acrylic waterproof coating for roofs","",None,""),
 ("AQUAGUARD-F","Aquaguard F","Aquaguard F.pdf","Waterproofing","Highly flexible, fiber reinforced acrylic waterproof coating","Waterproof coating for sloped roofs and vertical walls.","B",""),
 ("REPELICONE-K","Repelicone K","Repelicone K_TDS_0.pdf","Protective","Water repellent impregnation based on water borne silicone","",None,""),
 ("REPELICONE-W","Repelicone W","Repelicone W_TDS_4.pdf","Protective","Water repellent impregnation based on water borne Silane/Siloxane","",None,""),
 ("REPELICONE-X","Repelicone X","Repelicone X.pdf","Out of scope","Surface treatment for preventing efflorescence in tiles and stone","",None,""),
 ("REPCOAT-ZR","Repcoat ZR","Repcoat ZR_TDS_4.pdf","Accessory (primer)","One component epoxy based zinc rich primer for steel","",None,""),
 ("REPCOAT-PRIMER","Repcoat Primer","Repcoat Primer_TDS_0.pdf","Accessory (primer)","Silane/siloxane based hydrophobic primer","",None,""),
 ("REPCOAT-PU1","Repcoat PU1","regional/lb/Repcoat PU1_TDS.pdf","Out of scope","High performance one component polyurethane based protec","Car parks, playground and tennis court topping.",None,"roads / car parks / courts; Lebanon-site document"),
 ("STRONGCOAT-HB400","Strongcoat HB400","Strongcoat HB400_TDS_21.pdf","DROPPED (floor coating; user confirmed)","Solvent free high build epoxy floor coating","Aircraft hangars.",None,"concrete floor coating"),
 ("STRONGCOAT-EPU100","Strongcoat EPU100","Strongcoat EPU100_17.pdf","Out of scope?","High performance flexible epoxy polyurethane resin protective coating","Protection system for car park decks.",None,"lists car-park decks (Flooring); also concrete+steel protection"),
 ("DONFLASH-H","DonFlash H","DonFlash H_TDS.pdf","Accessory","Nonwoven polyester fabric reinforcement","",None,""),
 ("DONFLASH-R","DonFlash R","DonFlash R_TDS.pdf","Accessory","Elastomeric reinforcement and","",None,""),
 ("DONFLASH-V","DonFlash V","DonFlash V_TDS.pdf","Accessory","Fibreglass reinforcing fabric","",None,""),
 ("GEODRAIN-H","Don Geodrain H","Don Geodrain H_TDS.pdf","Accessory","Composite drainage layer","",None,""),
 ("GEODRAIN-V","Don Geodrain V","Don Geodrain V_TDS.pdf","Accessory","High strength drainage membrane","",None,""),
 ("TAPE-FLEX","Aquaproof Tape Flex","Aquaproof Tape Flex_3.pdf","Accessory","Non-woven elastomeric","",None,""),
 ("TAPE-GP","Aquaproof Tape GP","Aquaproof Tape GP_1.pdf","Accessory","elastomeric","",None,""),
 ("TAPE-H100","Donproof Tape H100","Donproof Tape H100.pdf","Accessory","Single-sided, sand finished, pressure sensitive adhesive tape for HDPE","",None,""),
 ("TAPE-H200","Donproof Tape H200","Donproof Tape H200.pdf","Accessory","Double-sided pressure sensitive adhesive tape for HDPE","",None,""),
 ("DONPROOF-LE","DonProof LE","DonProof LE.pdf","Waterproofing (not in brief list)","High quality polyester reinforced, UV resistant, PVC roofing membrane","",None,"found on site; not named in the brief"),
 ("DONFLEX","DonFlex","DonFlex_TDS (1).pdf","Accessory","Rubberised","",None,""),
 ("STRONGCOAT-PRIMER-RANGE","Strongcoat Primer Range","Strongcoat Primer Range_TDS_6.pdf","Accessory (primer)","A range of epoxy resin based primer for flooring and coatings","",None,"PRIMER_NAMING flag"),
 ("STRONGCOAT-PRIMER","Strongcoat Primer","Strongcoat Primer_TDS_4.pdf","Accessory (primer)","Solvent free epoxy resin based primer for flooring and coatings","",None,"PRIMER_NAMING flag"),
 ("STRONGCOAT-PRIMER-S","Strongcoat Primer S","Strongcoat Primer S_TDS.pdf","Accessory (primer)","Solvent based epoxy resin primer","",None,"PRIMER_NAMING flag"),
]
out = []
for pid, name, rel, cls, title, quote, zone, note in rows:
    fr = [title] if title else []
    page = bp.find_page(rel, title) if title else None
    qpage = bp.find_page(rel, quote) if quote else None
    out.append(dict(id=pid, name=name, source_file=rel, doc_code=bp.doc_code(rel), doc_date=bp.NS,
                    proposed_classification=cls, title_as_printed=title or None, title_page=page,
                    use_quote=quote or None, use_page=qpage, zone_hint=zone, note=note or None,
                    values_extracted=False))
missing_docs = [
 dict(name="Repcoat P Ultra", reason="Named as the UV protection coat in the PU-H50 / PU-P60 method statements. The Repcoat P TDS you uploaded is byte-identical to the Qatar-site Repcoat P TDS (06-0005-B-2026) and does not say whether P Ultra is the same product — unconfirmed"),
 dict(name="Method statements still missing", reason="PU-P100, Setseal 300C, Setseal R, Repcoat, Repcoat S/P/FF Plus, primers, DPM"),
]
json.dump(dict(catalogue=out, documents_not_found=missing_docs),
          open(os.path.join(bp.ROOT, "data", "catalogue.json"), "w"), ensure_ascii=False, indent=1)
if bp.FAILS:
    print("\n".join(bp.FAILS)); sys.exit(1)
print("catalogue:", len(out))
