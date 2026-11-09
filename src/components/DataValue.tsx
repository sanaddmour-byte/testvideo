import React from "react";
import { shown } from "../data/products";
import { DataPending } from "./DataPending";
import { brand, type } from "../theme/brand";

/** Renders a value from data/products.json exactly as printed, or the Data-pending tag. */
export const DataValue: React.FC<{ k: string; size?: number; bold?: boolean; showStd?: boolean }> = ({ k, size = type.body, bold = true, showStd = false }) => {
  const s = shown(k);
  if (s.pending) return <DataPending size={size} />;
  return (
    <span style={{ fontSize: size, fontWeight: bold ? 700 : 500, color: brand.ink }}>
      {s.text}
      {showStd && s.standard && <span style={{ fontSize: size * 0.7, fontWeight: 500, color: brand.muted }}> ({s.standard})</span>}
    </span>
  );
};
