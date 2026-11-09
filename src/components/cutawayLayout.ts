import { bounds } from "./buildingGeometry";
import { proj, V3 } from "./iso";

export type Layout = { s: number; ox: number; oy: number; x: number; y: number; w: number; h: number };
export const fit = (x: number, y: number, w: number, h: number): Layout => {
  const s = Math.min(w / bounds.w, h / bounds.h);
  return { s, x, y, w, h, ox: x + (w - bounds.w * s) / 2 - bounds.x0 * s, oy: y + (h - bounds.h * s) / 2 - bounds.y0 * s };
};
export const toScreen = (l: Layout, p: V3): [number, number] => { const [a, b] = proj(p); return [a * l.s + l.ox, b * l.s + l.oy]; };

