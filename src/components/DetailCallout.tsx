import React from "react";
import { brand, type } from "../theme/brand";
import { ease, frames, pop, prog } from "../theme/motion";
import { WIDTH, HEIGHT } from "../config";

/** Numbered pin on the drawing + leader + text card (text = TDS / method-statement wording). */
export const DetailCallout: React.FC<{
  n: number; pin: [number, number]; box: [number, number]; text: string; frame: number; start: number; width?: number; source?: string;
}> = ({ n, pin, box, text, frame, start, width = 520, source }) => {
  const s = pop(frame, start);
  const line = prog(frame, start + 6, frames.base, ease.out);
  const card = prog(frame, start + 12, frames.base);
  const [px, py] = pin, [bx, by] = box;
  const cx = bx + (px < bx ? 0 : width), cy = by + 36;
  return (
    <>
      <svg style={{ position: "absolute", inset: 0 }} width={WIDTH} height={HEIGHT}>
        <line x1={px} y1={py} x2={px + (cx - px) * line} y2={py + (cy - py) * line} stroke={brand.ink} strokeWidth={2.5} />
        <g transform={`translate(${px} ${py}) scale(${s})`}>
          <circle r={24} fill={brand.accent} stroke={brand.paper} strokeWidth={3} />
          <text textAnchor="middle" dominantBaseline="central" fontSize={30} fontWeight={800} fill="#fff">{n}</text>
        </g>
      </svg>
      <div style={{ position: "absolute", left: bx, top: by, width, opacity: card, transform: `translateY(${(1 - card) * 14}px)`, background: "#fff", border: `2px solid ${brand.ink}`, borderRadius: 10, padding: "12px 18px", fontSize: type.body, lineHeight: 1.2, boxShadow: "0 6px 0 rgba(33,29,34,.12)" }}>
        {text}
        {source && <div style={{ fontSize: type.footnote, color: brand.muted, marginTop: 6 }}>{source}</div>}
      </div>
    </>
  );
};
