import raw from "../../data/selector.json";
export type SelRow = { id: string; name: string; zones: string[]; other_listed_uses: string[] };
export const selector = raw.rows as SelRow[];
export const ZONES = ["A", "B", "C", "D", "E", "F", "G"] as const;
export type Zone = (typeof ZONES)[number];
