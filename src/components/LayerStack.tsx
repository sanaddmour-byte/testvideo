import React from "react";
import { brand, stroke, type } from "../theme/brand";
import { fills, Patterns } from "./Patterns";
import { frames, pop, prog, ease } from "../theme/motion";
import { DataValue } from "./DataValue";
import { useDir } from "../i18n";

export type Layer = {
  /** printed on screen next to the layer (product names come from the data layer, generic names from i18n) */
  label: string;
  /** data key for the DFT / coverage label, e.g. "FB.thickness" — shows Data pending if the TDS has no value */
  dataKey?: string;
  /** solid fill (family colour) or a pattern from fills */
  fill: string;
  /** visual thickness in px — schematic, NOT to scale */
  h: number;
  hatch?: boolean;
};

/** Animated cross-section: layers build from the bottom (substrate) upward; each label holds >= 2.5 s. */
export const LayerStack: React.FC<{
  layers: Layer[]; frame: number; start?: number; x: number; y: number; width?: number; every?: number; noteNotToScale?: string; labelH?: number;
}> = ({ layers, frame, start = 0, x, y, width = 620, every = frames.slow, noteNotToScale, labelH = 124 }) => {
  const rtl = useDir() === "rtl";
  const total = layers.reduce((a, l) => a + l.h, 0);
  const n = layers.length;
  const labelsTop = y + total / 2 - (n * labelH) / 2;
  const edgeX = rtl ? x : x + width;
  const labelX = rtl ? x - 110 : x + width + 110;
  let yy = y + total; // build upward from the bottom
  return (
    <g>
      <Patterns />
      {layers.map((l, i) => {
        const t0 = start + i * every;
        const p = pop(frame, t0, "settle");
        const drop = (1 - Math.min(1, p)) * 40;
        yy -= l.h;
        const top = yy;
        const a = prog(frame, t0, frames.quick);
        const lab = prog(frame, t0 + frames.base, frames.quick);
        const midY = top + l.h / 2;
        const labY = labelsTop + (n - 1 - i) * labelH + labelH / 2; // top layer = first label
        return (
          <g key={i}>
            <g opacity={a} transform={`translate(0 ${-drop})`}>
              <rect x={x} y={top} width={width} height={l.h} fill={l.fill} stroke={brand.ink} strokeWidth={stroke.base} />
              {l.hatch && <rect x={x} y={top} width={width} height={l.h} fill={fills.hatch} opacity={0.35} />}
            </g>
            <polyline points={`${edgeX},${midY} ${edgeX + (rtl ? -50 : 50)},${midY} ${labelX - (rtl ? -14 : 14)},${labY}`} fill="none" stroke={brand.ink} strokeWidth={2} strokeDasharray="6 6" opacity={lab} />
            <circle cx={edgeX} cy={midY} r={5} fill={brand.ink} opacity={lab} />
            <foreignObject x={rtl ? labelX - 700 : labelX} y={labY - labelH / 2 + 6} width={700} height={labelH - 12}>
              <div style={{ opacity: lab, fontSize: type.body, lineHeight: 1.15, textAlign: rtl ? "right" : "left", transform: `translateY(${(1 - lab) * 10}px)` }}>
                <div style={{ fontWeight: 700 }}>{l.label}</div>
                {l.dataKey && <div><DataValue k={l.dataKey} size={type.body} bold={false} /></div>}
              </div>
            </foreignObject>
          </g>
        );
      })}
      {noteNotToScale && <text x={x} y={y + total + 44} fontSize={type.footnote} fill={brand.muted}>{noteNotToScale}</text>}
    </g>
  );
};
