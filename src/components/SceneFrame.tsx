import React from "react";
import { AbsoluteFill, Img, staticFile, useVideoConfig } from "remotion";
import { brand, type } from "../theme/brand";
import { safe as lsafe, vsafe } from "../theme/layout";
import { useDir } from "../i18n";
import { SourceFootnote } from "./SourceFootnote";

/** Common page: paper background, brand mark inside the safe area, optional title, footnote. */
export const SceneFrame: React.FC<{
  title?: string; subtitle?: string; titleMax?: number; footKeys?: string[]; footExtra?: string[]; logo?: boolean; children?: React.ReactNode;
}> = ({ title, subtitle, titleMax = 1100, footKeys = [], footExtra = [], logo = true, children }) => {
  const rtl = useDir() === "rtl";
  const { width, height } = useVideoConfig();
  const vertical = height > width;
  const safe = vertical ? vsafe : lsafe;
  if (vertical && titleMax === 1100) titleMax = 800;
  return (
    <AbsoluteFill style={{ background: brand.paper, color: brand.ink }}>
      {children}
      {title && (
        <div style={{ position: "absolute", top: safe.y, [rtl ? "right" : "left"]: safe.x, maxWidth: titleMax }}>
          <div style={{ fontSize: type.title, fontWeight: 800, letterSpacing: -1, lineHeight: 1.05 }}>{title}</div>
          {subtitle && <div style={{ fontSize: type.body, color: brand.muted, marginTop: 8 }}>{subtitle}</div>}
        </div>
      )}
      {logo && <Img src={staticFile("brand/dcp_logo.svg")} style={{ position: "absolute", top: safe.y - 8, [rtl ? "left" : "right"]: safe.x, height: vertical ? 96 : 84 }} />}
      <SourceFootnote keys={footKeys} extra={footExtra} />
    </AbsoluteFill>
  );
};
