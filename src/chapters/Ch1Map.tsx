import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { SceneFrame } from "../components/SceneFrame";
import { BuildingCutaway, fit } from "../components/BuildingCutaway";
import { beatFrames } from "../data/timeline";
import { ZONES, Zone } from "../data/selector";
import { brand, type } from "../theme/brand";
import { content, safe } from "../theme/layout";
import { frames, pop, prog } from "../theme/motion";
import { useDir, useT } from "../i18n";

/** Reusable zone index (also used as the "where to use" index that returns between chapters). */
export const ZoneIndex: React.FC<{ frame: number; start?: number; active: Zone | null; done: Zone[]; x: number; y: number; width: number; rowH?: number }> = ({ frame, start = 0, active, done, x, y, width, rowH = 86 }) => {
  const t = useT();
  const rtl = useDir() === "rtl";
  return (
    <div style={{ position: "absolute", left: x, top: y, width }}>
      {ZONES.map((z, i) => {
        const a = prog(frame, start + i * frames.stagger * 2, frames.base);
        const isActive = active === z, isDone = done.includes(z);
        return (
          <div key={z} style={{ display: "flex", alignItems: "center", gap: 18, height: rowH, opacity: a * (active && !isActive ? 0.55 : 1), transform: `translateX(${(1 - a) * (rtl ? -24 : 24)}px)`,
            background: isActive ? "rgba(240,108,56,.14)" : "transparent", borderInlineStart: `6px solid ${isActive ? brand.accent : "transparent"}`, paddingInlineStart: 14, borderRadius: 6 }}>
            <div style={{ width: 56, height: 56, borderRadius: 28, flex: "none", display: "flex", alignItems: "center", justifyContent: "center", fontSize: type.body, fontWeight: 800,
              background: isActive ? brand.accent : brand.paper, color: isActive ? "#fff" : brand.ink, border: `3px solid ${isActive ? brand.accent : brand.ink}` }}>{z}</div>
            <div style={{ fontSize: type.body, lineHeight: 1.1, fontWeight: isActive ? 800 : 600 }}>{t(`zones.${z}`)}</div>
            {isDone && !isActive && <span style={{ marginInlineStart: "auto", fontSize: type.body, fontWeight: 800 }}>✓</span>}
          </div>
        );
      })}
    </div>
  );
};

export const Ch1Map: React.FC = () => {
  const f = useCurrentFrame();
  const t = useT();
  const rtl = useDir() === "rtl";
  const beats = beatFrames("Ch1");
  const draw = beats[0];
  // active zone from the beat we are in (beats 1..7 ↔ zones A..G)
  const idx = beats.findIndex((b, i) => i > 0 && f >= b.from && f < b.from + b.len);
  const active: Zone | null = idx > 0 ? ZONES[idx - 1] : null;
  const since = idx > 0 ? beats[idx].from : 0;
  const done = idx > 0 ? (ZONES.slice(0, idx - 1) as Zone[]) : [];
  const reveal = prog(f, 0, draw.len - 20, (x) => x);
  const focus = active ? pop(f, since, "settle") : 0;

  const listW = 560;
  const artW = content.width - listW - 60, artX = rtl ? content.left + listW + 60 : content.left;
  const layout = fit(artX + (rtl ? 0 : 230), 130, artW - 230, 720);
  const listX = rtl ? content.left : content.right - listW;

  return (
    <SceneFrame title={t("ch1.title")} subtitle={active ? undefined : t("ch1.subtitle")}>
      <AbsoluteFill>
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
          <BuildingCutaway frame={f} layout={layout} reveal={reveal} active={active} activeSince={since} done={done} focus={focus} focusZone={active} pins={true} />
        </svg>
      </AbsoluteFill>
      <ZoneIndex frame={f} start={Math.round(draw.len * 0.5)} active={active} done={done} x={listX} y={238} width={listW} />
      {active && (
        <div style={{ position: "absolute", left: listX, top: 150, width: listW, fontSize: type.body, fontWeight: 700, lineHeight: 1.1, opacity: prog(f, since + 4, frames.base), textAlign: rtl ? "right" : "left" }}>
          <span style={{ color: brand.accent }}>{active}</span> · {t(`zoneDetail.${active}`)}
        </div>
      )}
    </SceneFrame>
  );
};
