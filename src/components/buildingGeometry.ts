import { box, cylinder, Face, Line, planeX, planeY, planeZ, proj, Shape2, V3 } from "./iso";
import { brand } from "../theme/brand";
import { fills } from "./Patterns";
import { Zone } from "../data/selector";

export type El = { id: string; zone: Zone | null; faces: Face[]; lines?: Line[]; shapes?: Shape2[] };

const C = fills.concrete;
const els: El[] = [];
const add = (id: string, zone: Zone | null, faces: Face[], extra: Partial<El> = {}) => els.push({ id, zone, faces, ...extra });

// ---- context: soil section on the two back planes + ground ring around the excavation
add("soilL", null, [planeX(-1.5, -1.5, 12, -6.2, 0, fills.soil)]);
add("soilR", null, [planeY(-1.5, -1.5, 15.5, -6.2, 0, fills.soil)]);
add("ground", null, [{
  poly: [[-1.5, -1.5, 0], [15.5, -1.5, 0], [15.5, 12, 0], [-1.5, 12, 0]],
  hole: [[0, 0, 0], [10, 0, 0], [10, 8, 0], [0, 8, 0]], fill: fills.ground, shade: 0,
}]);

// ---- Zone A: raft, retaining walls, lift pit (below grade)
add("raft", "A", box(0, 0, -5.6, 10, 8, -4.4, C));
const pit: [number, number, number, number] = [6, 3, 8.5, 5.5];
const pitClip: V3[] = [[pit[0], pit[1], -4.4], [pit[2], pit[1], -4.4], [pit[2], pit[3], -4.4], [pit[0], pit[3], -4.4]];
add("pit", "A", [
  { poly: pitClip, fill: "#8D877C", shade: 0 },
  { ...planeX(pit[0], pit[1], pit[3], -5.2, -4.4, C), clip: pitClip },
  { ...planeY(pit[1], pit[0], pit[2], -5.2, -4.4, C), clip: pitClip },
  { ...planeZ(-5.2, pit[0], pit[2], pit[1], pit[3], "#B9B3A7"), clip: pitClip },
]);
add("wallL", "A", box(0, 0, -4.4, 0.6, 8, 0, C));
add("wallR", "A", box(0.6, 0, -4.4, 10, 0.6, 0, C));
add("wallGhost", "A", [
  { poly: [[10, 0, -4.4], [10, 8, -4.4], [10, 8, 0], [10, 0, 0]], fill: "none", noFill: true, dash: "10 8", stroke: brand.ink, sw: 1.2 },
  { poly: [[0, 8, -4.4], [10, 8, -4.4], [10, 8, 0], [0, 8, 0]], fill: "none", noFill: true, dash: "10 8", stroke: brand.ink, sw: 1.2 },
]);

// ---- building shell (context): back walls, columns, slabs
add("backL", null, box(0, 0, 0, 0.5, 8, 8.8, C));
add("backR", null, box(0.5, 0, 0, 10, 0.5, 8.8, C));
add("col0", null, box(9.3, 7.3, 0, 9.8, 7.8, 2.8, C));
add("col1", null, box(9.3, 3.7, 0, 9.8, 4.2, 2.8, C));

// ---- Zone C: bathroom (wet area) + balcony
add("bath", "C", [
  planeZ(3.25, 1, 4.5, 1, 4.5, fills.tile),
  planeX(1, 1, 4.5, 3.25, 5.7, fills.hatch, { alpha: 0.9 }),
  planeY(1, 1, 4.5, 3.25, 5.7, fills.hatch, { alpha: 0.9 }),
  ...box(1.3, 1.3, 3.25, 2.7, 2.7, 3.45, "#FFFFFF"),
], { shapes: [{ pts: cylinder("z", [3.6, 3.6, 3.26], 0.01, 0.22).cap, fill: brand.ink, alpha: 0.7 }] });
add("slab1", null, box(0, 0, 2.8, 10, 8, 3.2, C, { alpha: 0.55 }));

// ---- Zone B: podium deck, roof
add("podium", "B", [
  ...box(10, 0, 2.8, 16, 8, 3.2, C),
  ...box(15.7, 0, 3.2, 16, 8, 3.9, C),
  ...box(10, 7.7, 3.2, 16, 8, 3.9, C),
]);

// ---- Zone D: water tank on the podium deck
{
  const t = cylinder("z", [13, 3.8, 3.2], 2.6, 1.7);
  const w = cylinder("z", [13, 3.8, 3.2], 1.5, 1.5);
  add("tank", "D", [], {
    shapes: [
      { pts: t.body, fill: "#E7ECEE", stroke: brand.ink, sw: 2 },
      { pts: w.cap, fill: fills.water, stroke: brand.ink, sw: 1.2 },
      { pts: t.cap, fill: "none", stroke: brand.ink, sw: 2 },
    ],
    lines: [{ a: [11.3, 3.8, 3.2], b: [11.3, 3.8, 5.8], sw: 1.5 }, { a: [14.7, 3.8, 3.2], b: [14.7, 3.8, 5.8], sw: 1.5 }],
  });
}

add("slab2", null, box(0, 0, 5.8, 10, 8, 6.2, C, { alpha: 0.55 }));
add("col2", null, box(9.3, 0.4, 3.2, 9.8, 0.9, 5.8, C));
add("col3", null, box(9.3, 3.7, 3.2, 9.8, 4.2, 5.8, C));
add("col4", null, box(9.3, 7.3, 3.2, 9.8, 7.8, 5.8, C));

// ---- Zone C: balcony projecting from the left-front face
add("balcony", "C", [...box(3, 8, 5.8, 8, 11, 6.2, C), planeY(11, 3, 8, 6.2, 7.2, fills.glass, { alpha: 0.4 })], {
  lines: [
    { a: [3, 11, 7.2], b: [8, 11, 7.2], sw: 2 }, { a: [3, 8, 7.2], b: [3, 11, 7.2], sw: 2 }, { a: [8, 8, 7.2], b: [8, 11, 7.2], sw: 2 },
    ...[3, 4, 5, 6, 7, 8].map((x): Line => ({ a: [x, 11, 6.2], b: [x, 11, 7.2], sw: 1.3 })),
  ],
});

// ---- Zone F: exposed-concrete façade (upper storey, right-front face)
add("facade", "F", [
  planeX(10, 0, 8, 6.2, 8.8, C),
  planeX(10, 0.8, 2.4, 6.9, 8.2, fills.glass),
  planeX(10, 3.2, 4.8, 6.9, 8.2, fills.glass),
  planeX(10, 5.6, 7.2, 6.9, 8.2, fills.glass),
], { lines: [{ a: [10, 0, 7.5], b: [10, 8, 7.5], sw: 1, alpha: 0.6 }, { a: [10, 0, 6.85], b: [10, 8, 6.85], sw: 1, alpha: 0.6 }] });

// ---- roof (zone B)
add("roof", "B", [
  ...box(0, 0, 8.8, 10, 8, 9.2, C),
  ...box(0.2, 0.2, 9.2, 9.8, 7.8, 9.5, fills.insulation),
  ...box(9.7, 0.2, 9.5, 10, 7.8, 10.1, C),
  ...box(0.2, 7.7, 9.5, 10, 8, 10.1, C),
]);

// ---- Zone E: expansion joint, pipe penetrations
{
  const p1 = cylinder("x", [-1.4, 6, 4.8], 2.0, 0.34);
  const p2 = cylinder("z", [6, 5, 9.5], 1.7, 0.3);
  const collar = cylinder("z", [6, 5, 9.5], 0.25, 0.7);
  add("joint", "E", [
    planeZ(3.21, 9.8, 10.2, 0, 8, "#35323A"),
    planeZ(9.51, 0.2, 9.8, 3.85, 4.15, "#35323A"),
  ], {
    shapes: [
      { pts: p1.body, fill: "#CFCBC4", stroke: brand.ink, sw: 2 }, { pts: p1.cap, fill: "#F0EEEA", stroke: brand.ink, sw: 2 },
      { pts: collar.body, fill: "#CFCBC4", stroke: brand.ink, sw: 2 },
      { pts: p2.body, fill: "#CFCBC4", stroke: brand.ink, sw: 2 }, { pts: p2.cap, fill: "#F0EEEA", stroke: brand.ink, sw: 2 },
    ],
    lines: Array.from({ length: 8 }, (_, i): Line => ({ a: [9.8, i + 0.2, 3.22], b: [10.2, i + 0.8, 3.22], sw: 1.4, color: "#FFFFFF" })),
  });
}

// ---- Zone G: steel portal frames + industrial floor (front-left bay)
{
  const col = (x: number, y: number): Face[] => box(x - 0.15, y - 0.15, 0, x + 0.15, y + 0.15, 4.6, fills.steel);
  const frames = [9.4, 11.6];
  const lines: Line[] = [];
  for (const y of frames) {
    lines.push({ a: [0.6, y, 4.6], b: [4.7, y, 5.6], sw: 5, color: brand.steel }, { a: [4.7, y, 5.6], b: [8.8, y, 4.6], sw: 5, color: brand.steel });
  }
  const rafterZ = (x: number) => 4.6 + (x <= 4.7 ? (x - 0.6) / 4.1 : (8.8 - x) / 4.1);
  for (const x of [0.6, 2.6, 4.7, 6.7, 8.8]) lines.push({ a: [x, frames[0], rafterZ(x)], b: [x, frames[1], rafterZ(x)], sw: 2.5, color: brand.steel });
  lines.push({ a: [0.6, frames[0], 4.6], b: [0.6, frames[1], 4.6], sw: 3, color: brand.steel }, { a: [8.8, frames[0], 4.6], b: [8.8, frames[1], 4.6], sw: 3, color: brand.steel });
  add("steel", "G", [
    planeZ(0.02, 0, 9.4, 8.6, 12, fills.epoxy),
    ...col(0.6, frames[0]), ...col(8.8, frames[0]), ...col(0.6, frames[1]), ...col(8.8, frames[1]),
  ], { lines });
}

export const elements = els;

export const anchors: Record<Zone, V3> = {
  A: [9, 6.5, -2], B: [5, 4, 10.4], C: [2.8, 2.8, 5.9], D: [13, 3.8, 6.2], E: [-0.4, 6, 5.4], F: [10, 4, 8.4], G: [4.7, 10.6, 5.6],
};

export const bounds = (() => {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  const eat = ([a, b]: [number, number]) => { x0 = Math.min(x0, a); y0 = Math.min(y0, b); x1 = Math.max(x1, a); y1 = Math.max(y1, b); };
  for (const e of els) {
    for (const f of e.faces) f.poly.forEach((p) => eat(proj(p)));
    e.shapes?.forEach((s) => s.pts.forEach(eat));
    e.lines?.forEach((l) => { eat(proj(l.a)); eat(proj(l.b)); });
  }
  return { x0, y0, x1, y1, w: x1 - x0, h: y1 - y0 };
})();

export const zoneBox = (z: Zone) => {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  const eat = ([a, b]: [number, number]) => { x0 = Math.min(x0, a); y0 = Math.min(y0, b); x1 = Math.max(x1, a); y1 = Math.max(y1, b); };
  for (const e of els.filter((e) => e.zone === z)) {
    for (const f of e.faces) f.poly.forEach((p) => eat(proj(p)));
    e.shapes?.forEach((s) => s.pts.forEach(eat));
    e.lines?.forEach((l) => { eat(proj(l.a)); eat(proj(l.b)); });
  }
  return { x0, y0, x1, y1, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2 };
};
