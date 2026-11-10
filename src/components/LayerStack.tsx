import React from "react";
import { brand, stroke, type } from "../theme/brand";
import { fills, Patterns } from "./Patterns";
import { frames, pop, prog } from "../theme/motion";
import { DataValue } from "./DataValue";
import { shown } from "../data/products";
import { useDir } from "../i18n";

export type Layer = {
  label: string;
  /** one or more data keys, e.g. "FB.thickness" — Data pending if the TDS has no value */
  dataKey?: string | string[];
  fill: string;
  /** visual thickness in px — schematic, NOT to scale */
  h: number;
  hatch?: boolean;
};

const keysOf = (l: Layer) => (l.dataKey ? (Array.isArray(l.dataKey) ? l.dataKey : [l.dataKey]) : []);
const LINE = 42; // line height; characters per label line ≈ labelW / 21.9 at 36 px
const labelLines = (l: Layer, CPL: number) => Math.ceil(l.label.length / CPL) + keysOf(l).reduce((a, k) => { const s = shown(k); return a + (s.pending ? 1 : Math.ceil(s.text.length / CPL)); }, 0);

/** Animated cross-section: layers build from the bottom (substrate) upward; each label holds >= 2.5 s. */
export const LayerStack: React.FC<{
  layers: Layer[]; frame: number; start?: number; x: number; y: number; width?: number; every?: number; noteNotToScale?: string; labels?: boolean; bounds?: [number, number]; labelW?: number;
}> = ({ layers, frame, start = 0, x, y, width = 620, every = frames.slow, noteNotToScale, labels = true, bounds = [200, 850], labelW = 700 }) => {
  const CPL = Math.floor(labelW / 21.9);
  const rtl = useDir() === "rtl";
  const total = layers.reduce((a, l) => a + l.h, 0);
  const n = layers.length;
  const hs = layers.map((l) => labelLines(l, CPL) * LINE + 22); // label block heights, indexed bottom→top
  const sumH = hs.reduce((a, b) => a + b, 0);
  let cur = Math.min(Math.max(y + total / 2 - sumH / 2, bounds[0]), bounds[1] - sumH);
  const labelTop: number[] = new Array(n);
  for (let i = n - 1; i >= 0; i--) { labelTop[i] = cur; cur += hs[i]; } // top layer = first label
  const edgeX = rtl ? x : x + width;
  const labelX = rtl ? x - 110 : x + width + 110;
  let yy = y + total;
  return (
    <g>
      <Patterns />
      {layers.map((l, i) => {
        const t0 = start + i * every;
        const p = pop(frame, t0, "settle");
        const drop = (1 - Math.min(1, p)) * 40;
        yy -= l.h;
        const top = yy, midY = top + l.h / 2;
        const a = prog(frame, t0, frames.quick);
        const lab = prog(frame, t0 + frames.base, frames.quick);
        const labY = labelTop[i] + hs[i] / 2;
        return (
          <g key={i}>
            <g opacity={a} transform={`translate(0 ${-drop})`}>
              <rect x={x} y={top} width={width} height={l.h} fill={l.fill} stroke={brand.ink} strokeWidth={stroke.base} />
              {l.hatch && <rect x={x} y={top} width={width} height={l.h} fill={fills.hatch} opacity={0.35} />}
            </g>
            {labels && (
              <>
                <polyline points={`${edgeX},${midY} ${edgeX + (rtl ? -50 : 50)},${midY} ${labelX - (rtl ? -14 : 14)},${labY}`} fill="none" stroke={brand.ink} strokeWidth={2} strokeDasharray="6 6" opacity={lab} />
                <circle cx={edgeX} cy={midY} r={5} fill={brand.ink} opacity={lab} />
                <foreignObject x={rtl ? labelX - labelW : labelX} y={labelTop[i]} width={labelW} height={hs[i]}>
                  <div style={{ opacity: lab, fontSize: type.body, lineHeight: `${LINE}px`, textAlign: rtl ? "right" : "left", transform: `translateY(${(1 - lab) * 10}px)` }}>
                    <div style={{ fontWeight: 700 }}>{l.label}</div>
                    {keysOf(l).map((k) => <div key={k}><DataValue k={k} size={type.body} bold={false} /></div>)}
                  </div>
                </foreignObject>
              </>
            )}
          </g>
        );
      })}
      {noteNotToScale && <text x={x} y={y + total + 44} fontSize={type.footnote} fill={brand.muted}>{noteNotToScale}</text>}
    </g>
  );
};
