import chapters from "../../data/chapters.json";
import { brand, colorOf, families } from "../theme/brand";
import { fills } from "../components/Patterns";

export type ChapterSpec = (typeof chapters)[number];
export const zoneChapters = chapters as ChapterSpec[];
export const chapterSpec = (ch: string) => {
  const c = zoneChapters.find((x) => x.ch === ch);
  if (!c) throw new Error(`No zone chapter ${ch}`);
  return c;
};

type FillSpec = "concrete" | "hatch" | "tile" | { p: string } | { color: string };
export const fillOf = (f: FillSpec): string => (f === "concrete" ? fills.concrete : f === "hatch" ? "#E8E2D2" : f === "tile" ? fills.tile : "p" in f ? colorOf(f.p) : f.color);

/** Visual layer data per zone chapter (same order as the `stack` emitted by tools/build_script.py, bottom → top). Heights are schematic. */
export const STACK_VISUALS: Record<string, { fill: FillSpec; h: number; hatch?: boolean }[]> = {
  Ch2: [{ fill: "concrete", h: 130 }, { fill: "hatch", h: 56, hatch: true }, { fill: { p: "FB" }, h: 56 }, { fill: "concrete", h: 150 }],
  Ch3: [{ fill: "concrete", h: 130 }, { fill: { p: "PRIMER-EP" }, h: 36 }, { fill: { p: "PU-P150" }, h: 90 }, { fill: { p: "AL" }, h: 36 }],
  Ch4: [{ fill: "concrete", h: 130 }, { fill: { p: "PRIMER-PU" }, h: 36 }, { fill: { p: "PU-C100" }, h: 70 }, { fill: "tile", h: 60 }],
  Ch5: [{ fill: "concrete", h: 170 }, { fill: { p: "EPW" }, h: 60 }],
  Ch6: [{ fill: "concrete", h: 150 }, { fill: { p: "HYDROSTOP-HW" }, h: 60 }],
  Ch7: [{ fill: "concrete", h: 150 }, { fill: { color: families.accessory.color }, h: 36 }, { fill: { p: "REPCOAT" }, h: 56 }],
  Ch8: [{ fill: "concrete", h: 170 }, { fill: { p: "EN100" }, h: 60 }],
};

/** Hand-set axis maxima for bar panels (no auto-scaling). */
export const AXIS_MAX: Record<string, number> = {
  tensile: 1200, tear: 600, water_tightness: 800, crack_bridging: 4, elongation: 500, bond_concrete: 3,
};
/** Per-chapter overrides where the same property needs a different axis (units differ between product families). */
export const AXIS_OVERRIDE: Record<string, Record<string, number>> = {
  Ch3: { tensile: 30, elongation: 500, tear: 100 },
  Ch4: { bond_concrete: 2 },
  Ch8: { bond_concrete: 3 },
};
export const axisFor = (ch: string, prop: string) => AXIS_OVERRIDE[ch]?.[prop] ?? AXIS_MAX[prop];
export const inkColor = brand.ink;
