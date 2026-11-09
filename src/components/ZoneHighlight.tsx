import React from "react";
import { elements } from "./buildingGeometry";
import { poly2, pts } from "./iso";
import { Layout, toScreen } from "./cutawayLayout";
import { brand } from "../theme/brand";
import { Zone } from "../data/selector";
import { ease, prog } from "../theme/motion";

/** Pulsing accent outline around every face/shape of a zone. `frame` counts from the moment the zone lit up. */
export const ZoneHighlight: React.FC<{ zone: Zone; layout: Layout; frame: number }> = ({ zone, layout, frame }) => {
  const appear = prog(frame, 0, 10, ease.out);
  const pulse = 0.75 + 0.25 * Math.sin(frame / 6);
  const els = elements.filter((e) => e.zone === zone);
  return (
    <g opacity={appear * pulse} filter="url(#glow)">
      {els.flatMap((e) => [
        ...e.faces.filter((f) => !f.noFill || f.dash).map((f, i) => (
          <polygon key={`${e.id}f${i}`} points={pts(f.poly, layout.s, layout.ox, layout.oy)} fill={brand.accent} fillOpacity={0.12} stroke={brand.accent} strokeWidth={5} strokeLinejoin="round" />
        )),
        ...(e.shapes ?? []).map((s, i) => (
          <polygon key={`${e.id}s${i}`} points={poly2(s.pts, layout.s, layout.ox, layout.oy)} fill="none" stroke={brand.accent} strokeWidth={5} strokeLinejoin="round" />
        )),
        ...(e.lines ?? []).map((l, i) => {
          const [x1, y1] = toScreen(layout, l.a), [x2, y2] = toScreen(layout, l.b);
          return <line key={`${e.id}l${i}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke={brand.accent} strokeWidth={5} strokeLinecap="round" />;
        }),
      ])}
    </g>
  );
};
