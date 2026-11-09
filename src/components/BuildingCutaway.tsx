import React from "react";
import { interpolate } from "remotion";
import { anchors, El, elements, zoneBox } from "./buildingGeometry";
import { Face, poly2, pts } from "./iso";
import { Layout, toScreen } from "./cutawayLayout";
export type { Layout } from "./cutawayLayout";
export { fit, toScreen } from "./cutawayLayout";
import { Patterns } from "./Patterns";
import { ZoneHighlight } from "./ZoneHighlight";
import { brand, stroke, type } from "../theme/brand";
import { Zone, ZONES } from "../data/selector";

const faceEl = (f: Face, l: Layout, key: string, t: number, dim: number) => {
  const pointsStr = pts(f.poly, l.s, l.ox, l.oy);
  const shade = f.shade ?? 0;
  const common = { stroke: f.stroke ?? brand.ink, strokeWidth: f.sw ?? stroke.thin, strokeLinejoin: "round" as const };
  const clipId = f.clip ? `clip-${key}` : undefined;
  let body: React.ReactNode;
  if (f.hole) {
    const d = `M${pointsStr.replace(/ /g, "L")}Z M${pts(f.hole, l.s, l.ox, l.oy).replace(/ /g, "L")}Z`;
    body = <path d={d} fillRule="evenodd" fill={f.fill} fillOpacity={t} {...common} />;
  } else {
    body = (
      <>
        {!f.noFill && <polygon points={pointsStr} fill={f.fill} fillOpacity={(f.alpha ?? 1) * Math.min(1, t * 1.4)} stroke="none" />}
        {!f.noFill && shade > 0 && <polygon points={pointsStr} fill="#000" fillOpacity={shade * 0.35 * t} stroke="none" />}
        <polygon points={pointsStr} fill="none" pathLength={1} strokeDasharray={f.dash ?? "1"} strokeDashoffset={f.dash ? 0 : 1 - t} strokeOpacity={f.dash ? t : 1} {...common} />
      </>
    );
  }
  return (
    <g key={key} opacity={dim} clipPath={clipId ? `url(#${clipId})` : undefined}>
      {f.clip && <clipPath id={clipId}><polygon points={pts(f.clip, l.s, l.ox, l.oy)} /></clipPath>}
      {body}
    </g>
  );
};

const elementNode = (e: El, l: Layout, t: number, dim: number) => (
  <g key={e.id} opacity={dim}>
    {e.faces.map((f, i) => faceEl(f, l, `${e.id}-${i}`, t, 1))}
    {e.shapes?.map((sh, i) => (
      <polygon key={`s${i}`} points={poly2(sh.pts, l.s, l.ox, l.oy)} fill={sh.fill} fillOpacity={(sh.alpha ?? 1) * t} stroke={sh.stroke ?? "none"} strokeWidth={sh.sw ?? stroke.base} strokeOpacity={t} />
    ))}
    {e.lines?.map((ln, i) => {
      const [x1, y1] = toScreen(l, ln.a), [x2, y2] = toScreen(l, ln.b);
      return <line key={`l${i}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke={ln.color ?? brand.ink} strokeWidth={ln.sw ?? stroke.base} strokeOpacity={(ln.alpha ?? 1) * t} strokeDasharray={ln.dash} strokeLinecap="round" />;
    })}
  </g>
);

export type CutawayProps = {
  frame: number;
  layout: Layout;
  /** 0..1: the building draws in element by element */
  reveal?: number;
  active?: Zone | null;
  /** frame at which `active` became active (drives the highlight pulse) */
  activeSince?: number;
  /** zones already walked through (get a small tick) */
  done?: Zone[];
  pins?: boolean;
  /** 0..1 camera push towards the active zone */
  focus?: number;
  focusZone?: Zone | null;
};

export const BuildingCutaway: React.FC<CutawayProps> = ({ frame, layout, reveal = 1, active = null, activeSince = 0, done = [], pins = true, focus = 0, focusZone = null }) => {
  const n = elements.length;
  let tx = 0, ty = 0, k = 1;
  if (focusZone && focus > 0) {
    const zb = zoneBox(focusZone);
    const zx = zb.cx * layout.s + layout.ox, zy = zb.cy * layout.s + layout.oy;
    const cx = layout.x + layout.w / 2, cy = layout.y + layout.h / 2;
    k = 1 + 0.16 * focus;
    tx = (cx - zx) * 0.3 * focus; ty = (cy - zy) * 0.3 * focus;
  }
  const pivotX = layout.x + layout.w / 2, pivotY = layout.y + layout.h / 2;
  return (
    <g transform={`translate(${tx} ${ty}) translate(${pivotX} ${pivotY}) scale(${k}) translate(${-pivotX} ${-pivotY})`}>
      <Patterns />
      {elements.map((e, i) => {
        const t = interpolate(reveal, [(i / n) * 0.78, (i / n) * 0.78 + 0.22], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        if (t <= 0) return null;
        const dim = active ? (e.zone === active ? 1 : e.zone === null ? 0.5 : 0.24) : 1;
        return elementNode(e, layout, t, dim);
      })}
      {active && reveal >= 1 && <ZoneHighlight zone={active} layout={layout} frame={frame - activeSince} />}
      {pins && reveal >= 0.9 && ZONES.map((z) => {
        const [px, py] = toScreen(layout, anchors[z]);
        const isActive = active === z, isDone = done.includes(z);
        // while a zone is active, the other pins shrink to dots so the drawing stays readable
        if (active && !isActive) {
          return <circle key={z} cx={px} cy={py - 20} r={9} fill={isDone ? brand.ink : brand.paper} stroke={brand.ink} strokeWidth={2.5} opacity={0.7} />;
        }
        const r = 30;
        return (
          <g key={z} transform={`translate(${px} ${py - 46})`}>
            <line x1={0} y1={r} x2={0} y2={46} stroke={isActive ? brand.accent : brand.ink} strokeWidth={2} />
            <circle r={r} fill={isActive ? brand.accent : brand.paper} stroke={isActive ? brand.accent : brand.ink} strokeWidth={3} />
            <text textAnchor="middle" dominantBaseline="central" fontSize={type.body} fontWeight={700} fill={isActive ? "#fff" : brand.ink}>{z}</text>
          </g>
        );
      })}
    </g>
  );
};
