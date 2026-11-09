import React from "react";
import { colorOf } from "../theme/brand";
import { brand, type } from "../theme/brand";
import { shown, firstNumber, productName } from "../data/products";
import { DataPending } from "./DataPending";
import { frames, prog } from "../theme/motion";
import { useT } from "../i18n";

export type BarProp = { key: string; /** explicit axis maximum, set by hand per property */ axisMax: number };

/**
 * Hand-built SVG/HTML bars. Axis maxima are given explicitly (no auto-scaling).
 * Throws if the products do not all report a property to the SAME stated test standard (brief §3.6).
 */
export const ComparisonBars: React.FC<{
  products: string[]; props: BarProp[]; frame: number; start?: number; x: number; y: number; width?: number;
}> = ({ products, props, frame, start = 0, x, y, width = 1100 }) => {
  const t = useT();
  const rowH = 58, labelW = 400, barMax = width - labelW - 420;
  let yy = y;
  return (
    <div style={{ position: "absolute", left: x, top: y, width }}>
      {props.map((p, pi) => {
        const stds = new Set(products.map((id) => shown(`${id}.${p.key}`).entry.test_standard));
        if (stds.size !== 1 || stds.has("NOT STATED")) throw new Error(`ComparisonBars: ${p.key} mixes/lacks test standards for ${products.join(",")}: ${[...stds].join(" | ")}`);
        const std = [...stds][0];
        return (
          <div key={p.key} style={{ marginBottom: 22 }}>
            <div style={{ fontSize: type.body, fontWeight: 800 }}>
              {t(`prop.${p.key}`)} <span style={{ fontWeight: 500, color: brand.muted, fontSize: type.body * 0.75 }}>{std}</span>
            </div>
            {products.map((id, i) => {
              const s = shown(`${id}.${p.key}`);
              const num = s.pending ? null : firstNumber(s.entry.value);
              const grow = prog(frame, start + pi * 14 + i * frames.stagger, frames.slow);
              const w = num === null ? 0 : Math.max(8, (num / p.axisMax) * barMax) * grow;
              return (
                <div key={id} style={{ display: "flex", alignItems: "center", height: rowH }}>
                  <div style={{ width: labelW, fontSize: type.body, fontWeight: 600, whiteSpace: "nowrap" }}>{productName(id)}</div>
                  <div style={{ width: barMax, borderLeft: `3px solid ${brand.ink}` }}>
                    <div style={{ height: 30, width: w, background: colorOf(id), borderRadius: "0 6px 6px 0" }} />
                  </div>
                  <div style={{ paddingLeft: 14, opacity: grow, whiteSpace: "nowrap" }}>
                    {s.pending ? <DataPending /> : <span style={{ fontSize: type.body, fontWeight: 700 }}>{s.text}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
};
