// `npm run validate` — fails the build when the film would show something its sources do not support (brief §3.6).
//  1. every on-screen data value has a source reference (file exists, page within the PDF, doc code + date fields present)
//  2. no value held back for a document conflict can appear on screen
//  3. no chart puts values measured to different (or unstated) test standards on the same axis; panel size limits
//  4. every product shown in a zone chapter, and every selector tick, is backed by a TDS "uses" line for that zone
//  5. i18n keys exist; no banned claims in any on-screen / VO text
//  6. TypeScript compiles
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { lookBarsKeys, lookLayerKeys, lookTableKeys, LOOK_BARS } from "../src/specs/lookdev";

type Entry = { value: string; unit: string; test_standard: string; source_file: string; page: number | null; doc_code: string; doc_date: string; on_screen_allowed?: boolean; held_conflict?: string };
type Use = { zone: string | null; quote: string; page: number; mapping: string };
type Prod = { id: string; name: string; source_file: string; values: Record<string, Entry[]>; uses: Use[] };
const J = (f: string) => JSON.parse(readFileSync(f, "utf8"));
const products: Prod[] = J("data/products.json").products;
const MISSING: string = J("data/products.json").missing_marker;
const timeline = J("data/timeline.json");
const chapters: { ch: string; zone: string; candidates: string[]; panel: { kind: string; products: string[]; props: string[] } }[] = J("data/chapters.json");
const selector: { rows: { id: string; zones: string[] }[] } = J("data/selector.json");
const byId = new Map(products.map((p) => [p.id, p]));
const canon = (id: string) => (id === "EPW-P" || id === "EPW-S" ? "EPW" : id);

const errors: string[] = [];
const warns: string[] = [];
const err = (m: string) => errors.push(m);

const pdfPages = new Map<string, number>();
const pagesOf = (rel: string) => {
  if (!pdfPages.has(rel)) {
    const out = execFileSync("pdfinfo", [path.join("source-tds", rel)], { encoding: "utf8" });
    pdfPages.set(rel, parseInt(/Pages:\s+(\d+)/.exec(out)![1], 10));
  }
  return pdfPages.get(rel)!;
};

// ---- 1 + 2: sources for every on-screen data key
const keys = new Set<string>([...timeline.beats.flatMap((b: { keys: string[] }) => b.keys), ...lookLayerKeys, ...lookBarsKeys, ...lookTableKeys]);
for (const k of keys) {
  const [pid, key] = k.split(".");
  const p = byId.get(canon(pid));
  const e = p?.values[key]?.[0];
  if (!p || !e) { err(`data key ${k}: not found in data/products.json`); continue; }
  if (e.on_screen_allowed === false) err(`data key ${k}: held back for conflict ${e.held_conflict} but used on screen`);
  for (const f of ["source_file", "doc_code", "doc_date"] as const) if (!e[f]) err(`data key ${k}: missing ${f}`);
  if (!existsSync(path.join("source-tds", e.source_file))) err(`data key ${k}: source file not found: ${e.source_file}`);
  else if (e.value !== MISSING) {
    if (e.page === null) err(`data key ${k}: value without a page reference`);
    else if (e.page < 1 || e.page > pagesOf(e.source_file)) err(`data key ${k}: page ${e.page} outside ${e.source_file}`);
  }
  if (e.value !== MISSING && !e.doc_code) err(`data key ${k}: no doc code`);
}

// ---- 3: charts — same stated standard per bar property; size limits
const checkBars = (label: string, prods: string[], props: string[]) => {
  if (prods.length > 3) err(`${label}: more than 3 products`);
  if (props.length > 4) err(`${label}: more than 4 properties`);
  for (const q of props) {
    const stds = new Set(prods.map((id) => byId.get(canon(id))?.values[q]?.[0]?.test_standard ?? "MISSING"));
    if (stds.size !== 1 || stds.has("NOT STATED") || stds.has("MISSING")) err(`${label}: bars for "${q}" put different/unstated standards on one axis: ${[...stds].join(" | ")}`);
  }
};
checkBars("Look-Bars", LOOK_BARS.products, LOOK_BARS.props.map((p) => p.key));
for (const c of chapters) {
  if (c.panel.products.length > 3) err(`${c.ch}: panel with more than 3 products`);
  if (c.panel.props.length > 4) err(`${c.ch}: panel with more than 4 properties`);
  if (c.panel.kind === "bars") checkBars(c.ch, c.panel.products, c.panel.props);
}

// ---- 4: product ∈ zone only if its TDS lists that use
const usedInZone = (id: string, zone: string) => (byId.get(canon(id))?.uses ?? []).some((u) => u.zone === zone);
for (const c of chapters) for (const id of c.candidates) if (!usedInZone(id, c.zone)) err(`${c.ch}: ${id} shown in zone ${c.zone} but no TDS use line maps to that zone`);
const recomputed = new Map(products.filter((p) => !p.id.startsWith("PRIMER") && !p.id.includes("DPM")).map((p) => [p.id, [...new Set(p.uses.map((u) => u.zone).filter(Boolean) as string[])].sort()]));
for (const r of selector.rows) {
  const exp = recomputed.get(r.id);
  if (!exp) { err(`selector: ${r.id} unknown`); continue; }
  if (JSON.stringify(exp) !== JSON.stringify([...r.zones].sort())) err(`selector: ${r.id} ticks ${r.zones} ≠ TDS uses ${exp}`);
  for (const z of r.zones) if (!usedInZone(r.id, z)) err(`selector: ${r.id} ticked in ${z} without a TDS use`);
}

// ---- 5: i18n + banned claims
const en = J("src/i18n/en.json");
const has = (k: string) => k.split(".").reduce((o: any, p) => (o && typeof o === "object" ? o[p] : undefined), en) !== undefined;
const walk = (d: string): string[] => readdirSync(d).flatMap((n) => { const f = path.join(d, n); return statSync(f).isDirectory() ? walk(f) : [f]; });
for (const f of walk("src").filter((f) => /\.tsx?$/.test(f))) {
  const src = readFileSync(f, "utf8");
  for (const m of src.matchAll(/\bt\("([^"$`]+)"\)/g)) if (!has(m[1])) err(`${f}: i18n key "${m[1]}" missing in en.json`);
}
for (const c of chapters) for (const q of c.panel.props) if (!has(`prop.${q}`)) err(`${c.ch}: property label prop.${q} missing in en.json`);
for (const z of "ABCDEFG") for (const g of ["zones", "zoneDetail"]) if (!has(`${g}.${z}`)) err(`en.json missing ${g}.${z}`);
const ar = J("src/i18n/ar.json");
const flat = (o: any, p = ""): string[] => Object.entries(o).flatMap(([k, v]) => (typeof v === "object" ? flat(v, `${p}${k}.`) : [`${p}${k}`]));
const missAr = flat(en).filter((k) => !flat(ar).includes(k));
if (missAr.length) err(`ar.json lacks keys: ${missAr.slice(0, 5).join(", ")}…`);
const emptyAr = flat(ar).filter((k) => !k.split(".").reduce((o: any, p) => o?.[p], ar));
if (emptyAr.length) warns.push(`ar.json: ${emptyAr.length} untranslated keys (English fallback will render)`);

const BANNED = /\b(best|strongest|no\.?\s?1|number one|market[- ]leading|unbeatable|years? of (service|life|protection)|service life|lifetime|guarantee[ds]?|warrant(y|ies))\b/i;
const WARRANTY = "Warranties are scoped by product, application type and area, under DCP technical sales supervision.";
const texts = [...timeline.beats.flatMap((b: { on: string; vo: string }) => [b.on, b.vo]), ...flat(en).map((k) => k.split(".").reduce((o: any, p) => o[p], en) as string)];
for (const t of texts) if (BANNED.test(t) && !t.includes(WARRANTY)) err(`banned claim wording: "${t}"`);

// ---- 6: type-check
try { execFileSync("npx", ["tsc", "--noEmit"], { stdio: "pipe" }); } catch (e: any) { err(`tsc failed:\n${String(e.stdout || e.message).slice(0, 1200)}`); }

for (const w of warns) console.warn("warn:", w);
if (errors.length) {
  console.error(`\nvalidate FAILED (${errors.length}):\n- ` + errors.join("\n- "));
  process.exit(1);
}
console.log(`validate OK — ${keys.size} data keys, ${chapters.length} zone chapters, ${selector.rows.length} selector rows checked`);
