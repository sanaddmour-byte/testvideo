import React from "react";
import { footnotes } from "../data/products";
import { useLang } from "../i18n";
import { brand, type } from "../theme/brand";
import { safe } from "../theme/layout";

/** "Source: <product> TDS, <doc code>, <date>" — on every frame that shows data (brief §3.8). */
export const SourceFootnote: React.FC<{ keys: string[]; extra?: string[] }> = ({ keys, extra = [] }) => {
  const lang = useLang();
  const lines = [...footnotes(keys, lang), ...extra];
  if (!lines.length) return null;
  return (
    <div style={{ position: "absolute", left: safe.x, right: safe.x, bottom: safe.y - 12, fontSize: type.footnote, color: brand.muted, lineHeight: 1.25 }}>
      {lines.join("  ·  ")}
    </div>
  );
};
