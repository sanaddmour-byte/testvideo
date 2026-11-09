import raw from "../../data/products.json";
import { translate } from "../i18n";
import { Lang } from "../config";

export type Entry = {
  value: string; unit: string; test_standard: string; source_file: string; page: number | null;
  doc_code: string; doc_date: string; label_as_printed?: string; condition?: string;
  held_conflict?: string; on_screen_allowed?: boolean; source_type?: string;
};
export type Use = { zone: string | null; quote: string; page: number; mapping: string; note?: string };
export type Product = {
  id: string; name: string; family: string; classification: string; source_file: string;
  doc_code: string; doc_date: string; values: Record<string, Entry[]>; uses: Use[];
  method_statements?: { file: string; ref: string; doc_date: string }[]; scope_decision: string;
};

export const MISSING = raw.missing_marker;
export const products = raw.products as unknown as Product[];
const byId = new Map(products.map((p) => [p.id, p]));
const canon = (id: string) => (id === "EPW-P" || id === "EPW-S" ? "EPW" : id);

export const product = (id: string): Product => {
  const p = byId.get(canon(id));
  if (!p) throw new Error(`Unknown product ${id}`);
  return p;
};
export const productName = (id: string) =>
  id === "EPW-P" ? "Strongcoat EPW-P" : id === "EPW-S" ? "Strongcoat EPW-S" : product(id).name.replace(/ \(.*\)$/, "");

/** key = "FB.thickness". Throws if the key is unknown or held back because of a document conflict. */
export const entry = (key: string): Entry => {
  const [pid, k] = key.split(".");
  const e = product(pid).values[k]?.[0];
  if (!e) throw new Error(`Unknown data key ${key}`);
  if (e.on_screen_allowed === false) throw new Error(`Data key ${key} is held back (conflict ${e.held_conflict})`);
  return e;
};

export type Shown = { pending: boolean; text: string; standard: string | null; entry: Entry };
export const shown = (key: string): Shown => {
  const e = entry(key);
  if (e.value === MISSING) return { pending: true, text: "", standard: null, entry: e };
  const text = `${e.value} ${e.unit}`.trim();
  return { pending: false, text, standard: e.test_standard === "NOT STATED" ? null : e.test_standard, entry: e };
};

/** First number in a printed value, for bar length only (the printed text is always what is displayed). */
export const firstNumber = (s: string): number | null => {
  const m = s.replace(",", ".").match(/-?\d+(\.\d+)?/);
  return m ? parseFloat(m[0]) : null;
};

/** Footnote lines for a set of data keys: "Source: <product> TDS, <doc code>, <date>". */
export const footnotes = (keys: string[], lang: Lang = "en"): string[] => {
  const out: string[] = [];
  for (const k of keys) {
    const e = entry(k);
    const name = productName(k.split(".")[0]);
    const ms = e.source_type === "METHOD STATEMENT";
    const line = translate(lang, ms ? "footnote.ms" : "footnote.tds", { product: name, code: e.doc_code, date: e.doc_date });
    if (!out.includes(line)) out.push(line);
  }
  return out;
};

/** TDS footnote line for a product (used where a frame quotes TDS wording rather than a numeric value). */
export const productFootnote = (pid: string, lang: Lang = "en") => {
  const pr = product(pid);
  return translate(lang, "footnote.tds", { product: productName(pid), code: pr.doc_code, date: pr.doc_date });
};
