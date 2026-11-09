import React from "react";
import { brand, type } from "../theme/brand";
import { useT } from "../i18n";

/** Visible grey tag for any value stored as [DATA REQUIRED — R&D]. Never a blank (brief §3.3). */
export const DataPending: React.FC<{ size?: number }> = ({ size = type.body }) => {
  const t = useT();
  return (
    <span style={{ display: "inline-block", background: brand.pendingFill, color: brand.pendingInk, borderRadius: 8, padding: "2px 14px", fontSize: size * 0.85, fontWeight: 600, border: `2px dashed ${brand.pendingInk}` }}>
      {t("dataPending")}
    </span>
  );
};
