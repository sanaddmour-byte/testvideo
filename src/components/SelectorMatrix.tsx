import React from "react";
import { selector, SelRow, ZONES } from "../data/selector";
import { brand, colorOf, type } from "../theme/brand";
import { frames, pop, prog } from "../theme/motion";
import { useT } from "../i18n";

/** Zone × product grid. A tick only appears where the TDS lists that use (data/selector.json is generated from products.json). */
export const SelectorMatrix: React.FC<{
  rows?: SelRow[]; frame: number; start?: number; x: number; y: number; width?: number; rowH?: number; highlightZone?: string | null;
}> = ({ rows = selector, frame, start = 0, x, y, width = 1500, rowH = 52, highlightZone = null }) => {
  const t = useT();
  const nameW = 420, zoneW = 74, otherW = width - nameW - zoneW * ZONES.length;
  return (
    <div style={{ position: "absolute", left: x, top: y, width, fontSize: type.body }}>
      <div style={{ display: "flex", height: rowH, borderBottom: `3px solid ${brand.ink}`, alignItems: "center", fontWeight: 800 }}>
        <div style={{ width: nameW }} />
        {ZONES.map((z) => (
          <div key={z} style={{ width: zoneW, textAlign: "center", color: highlightZone === z ? brand.accent : brand.ink }}>{z}</div>
        ))}
        <div style={{ width: otherW, fontSize: type.body, color: brand.muted, paddingLeft: 12 }}>{t("table.otherUses")}</div>
      </div>
      {rows.map((r, i) => {
        const a = prog(frame, start + i * frames.stagger * 2, frames.base);
        return (
          <div key={r.id} style={{ display: "flex", height: rowH, alignItems: "center", opacity: a, borderBottom: `1px solid ${brand.grid}` }}>
            <div style={{ width: nameW, display: "flex", alignItems: "center", gap: 10, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden" }}>
              <span style={{ width: 16, height: 16, borderRadius: 4, background: colorOf(r.id), flex: "none" }} />
              {r.name.replace(/ \(.*\)$/, "")}
            </div>
            {ZONES.map((z, zi) => {
              const on = r.zones.includes(z);
              const s = on ? pop(frame, start + i * frames.stagger * 2 + 8 + zi * 2) : 0;
              return (
                <div key={z} style={{ width: zoneW, textAlign: "center", background: highlightZone === z ? "rgba(240,108,56,.10)" : undefined, height: rowH, lineHeight: `${rowH}px` }}>
                  {on && <span style={{ display: "inline-block", transform: `scale(${s})`, fontWeight: 800, color: brand.ink }}>✓</span>}
                </div>
              );
            })}
            <div style={{ width: otherW, paddingLeft: 12, fontSize: type.body, color: brand.muted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {r.other_listed_uses.join("; ")}
            </div>
          </div>
        );
      })}
    </div>
  );
};
