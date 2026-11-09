import React from "react";
import { brand, colorOf, type } from "../theme/brand";
import { productName, shown } from "../data/products";
import { DataPending } from "./DataPending";
import { frames, prog } from "../theme/motion";
import { useT } from "../i18n";

/** A table cell is either a data key, or null = "not reported in this TDS" (distinct from Data pending). */
export type TableRow = { prop: string; cells: (string | null)[] };

/** Side-by-side text table for values measured to different test methods. Carries the "different test methods" tag. */
export const ComparisonTable: React.FC<{
  products: string[]; rows: TableRow[]; frame: number; start?: number; x: number; y: number; width?: number; tag?: boolean;
}> = ({ products, rows, frame, start = 0, x, y, width = 1500, tag = true }) => {
  const t = useT();
  const first = 360, col = (width - first) / products.length;
  return (
    <div style={{ position: "absolute", left: x, top: y, width }}>
      {tag && (
        <div style={{ display: "inline-block", background: brand.ink, color: "#fff", borderRadius: 8, padding: "2px 16px", fontSize: type.body * 0.8, fontWeight: 700, marginBottom: 12 }}>
          {t("table.differentMethods")}
        </div>
      )}
      <div style={{ display: "flex", borderBottom: `3px solid ${brand.ink}`, paddingBottom: 6 }}>
        <div style={{ width: first }} />
        {products.map((id) => (
          <div key={id} style={{ width: col, fontSize: type.body, fontWeight: 800, display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ width: 18, height: 18, background: colorOf(id), borderRadius: 4, display: "inline-block", flex: "none" }} />
            {productName(id)}
          </div>
        ))}
      </div>
      {rows.map((r, ri) => {
        const a = prog(frame, start + ri * 10, frames.base);
        return (
          <div key={r.prop} style={{ display: "flex", alignItems: "flex-start", minHeight: 76, padding: "8px 0", borderBottom: `1px solid ${brand.grid}`, opacity: a, transform: `translateY(${(1 - a) * 12}px)` }}>
            <div style={{ width: first, fontSize: type.body, fontWeight: 600 }}>{t(`prop.${r.prop}`)}</div>
            {r.cells.map((k, ci) => {
              if (k === null) return <div key={ci} style={{ width: col, fontSize: type.body, color: brand.muted }}>{t("table.notReported")}</div>;
              const s = shown(k);
              return (
                <div key={ci} style={{ width: col - 16, fontSize: type.body, lineHeight: 1.15 }}>
                  {s.pending ? <DataPending /> : (<><div style={{ fontWeight: 700 }}>{s.text}</div>{s.standard && <div style={{ fontSize: type.body * 0.7, color: brand.muted }}>{s.standard}</div>}</>)}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
};
