export type V3 = [number, number, number];
export type V2 = [number, number];
const C = Math.cos(Math.PI / 6);

/** Isometric projection at unit scale. +x → right/down, +y → left/down, +z → up. */
export const proj = ([x, y, z]: V3): V2 => [(x - y) * C, (x + y) * 0.5 - z];

export const pts = (poly: V3[], s = 1, ox = 0, oy = 0) =>
  poly.map((p) => { const [a, b] = proj(p); return `${(a * s + ox).toFixed(1)},${(b * s + oy).toFixed(1)}`; }).join(" ");

export type Fill = string; // css colour or url(#pattern)
export type Face = { poly: V3[]; fill: Fill; shade?: number; stroke?: string; dash?: string; sw?: number; noFill?: boolean; hole?: V3[]; alpha?: number; clip?: V3[] };
export type Line = { a: V3; b: V3; sw?: number; color?: string; dash?: string; alpha?: number };
export type Shape2 = { pts: V2[]; fill: Fill; stroke?: string; sw?: number; alpha?: number };

/** Axis-aligned box: the three faces visible from the (+x,+y,+z) viewpoint. */
export const box = (x0: number, y0: number, z0: number, x1: number, y1: number, z1: number, fill: Fill, o: Partial<Face> = {}): Face[] => [
  { poly: [[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]], fill, shade: 0, ...o },
  { poly: [[x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [x1, y0, z1]], fill, shade: 0.1, ...o },
  { poly: [[x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]], fill, shade: 0.18, ...o },
];
/** Plane facing +x. */
export const planeX = (x: number, y0: number, y1: number, z0: number, z1: number, fill: Fill, o: Partial<Face> = {}): Face =>
  ({ poly: [[x, y0, z0], [x, y1, z0], [x, y1, z1], [x, y0, z1]], fill, shade: 0.08, ...o });
/** Plane facing +y. */
export const planeY = (y: number, x0: number, x1: number, z0: number, z1: number, fill: Fill, o: Partial<Face> = {}): Face =>
  ({ poly: [[x0, y, z0], [x1, y, z0], [x1, y, z1], [x0, y, z1]], fill, shade: 0.14, ...o });
/** Horizontal plane. */
export const planeZ = (z: number, x0: number, x1: number, y0: number, y1: number, fill: Fill, o: Partial<Face> = {}): Face =>
  ({ poly: [[x0, y0, z], [x1, y0, z], [x1, y1, z], [x0, y1, z]], fill, shade: 0, ...o });

const circle = (axis: "x" | "y" | "z", c: V3, r: number, n = 28): V3[] =>
  Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2, u = Math.cos(a) * r, v = Math.sin(a) * r;
    return axis === "z" ? [c[0] + u, c[1] + v, c[2]] : axis === "x" ? [c[0], c[1] + u, c[2] + v] : [c[0] + u, c[1], c[2] + v];
  });

const hull = (p: V2[]): V2[] => {
  const s = [...p].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o: V2, a: V2, b: V2) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo: V2[] = [], up: V2[] = [];
  for (const q of s) { while (lo.length >= 2 && cross(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
  for (const q of [...s].reverse()) { while (up.length >= 2 && cross(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); }
  return [...lo.slice(0, -1), ...up.slice(0, -1)];
};

/** Cylinder: silhouette hull + top cap. Returned polys are already projected (2-D). */
export const cylinder = (axis: "x" | "y" | "z", c0: V3, len: number, r: number) => {
  const c1: V3 = axis === "z" ? [c0[0], c0[1], c0[2] + len] : axis === "x" ? [c0[0] + len, c0[1], c0[2]] : [c0[0], c0[1] + len, c0[2]];
  const a = circle(axis, c0, r), b = circle(axis, c1, r);
  return { body: hull([...a, ...b].map(proj)), cap: b.map(proj), capPoly: b };
};
export const poly2 = (p: V2[], s = 1, ox = 0, oy = 0) => p.map(([a, b]) => `${(a * s + ox).toFixed(1)},${(b * s + oy).toFixed(1)}`).join(" ");
