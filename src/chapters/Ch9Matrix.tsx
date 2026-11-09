import React from "react";
import { AbsoluteFill, Sequence, interpolate, useCurrentFrame } from "remotion";
import { SceneFrame } from "../components/SceneFrame";
import { SelectorMatrix } from "../components/SelectorMatrix";
import { ZoneIndex } from "./Ch1Map";
import { selector, ZONES, Zone } from "../data/selector";
import { beatFrames } from "../data/timeline";
import { families, familyOf, brand, type } from "../theme/brand";
import { content } from "../theme/layout";
import { frames, prog } from "../theme/motion";
import { useDir, useT } from "../i18n";

const ORDER = ["spray", "liquid", "sheet", "epoxy", "cement", "coating", "accessory"] as const;
const sorted = [...selector].sort((a, b) => ORDER.indexOf(familyOf(a.id)) - ORDER.indexOf(familyOf(b.id)));
const PAGE = 10;
const pages = Array.from({ length: Math.ceil(sorted.length / PAGE) }, (_, i) => sorted.slice(i * PAGE, (i + 1) * PAGE));

const Fade: React.FC<{ len: number; children: React.ReactNode }> = ({ len, children }) => {
  const f = useCurrentFrame();
  return <AbsoluteFill style={{ opacity: interpolate(f, [0, 6, len - 6, len], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>{children}</AbsoluteFill>;
};

const Page: React.FC<{ rows: typeof sorted; f: number }> = ({ rows, f }) => {
  const t = useT();
  const fams = [...new Set(rows.map((r) => familyOf(r.id)))];
  return (
    <>
      <SelectorMatrix rows={rows} frame={f} start={2} x={content.left} y={250} width={1728} />
      <div style={{ position: "absolute", left: content.left, top: 190, display: "flex", gap: 28, fontSize: type.body }}>
        {fams.map((fm) => <span key={fm} style={{ display: "flex", alignItems: "center", gap: 10 }}><span style={{ width: 18, height: 18, borderRadius: 4, background: families[fm].color }} />{t(families[fm].key)}</span>)}
      </div>
    </>
  );
};

const Body: React.FC<{ idx: number; len: number }> = ({ idx, len }) => {
  const f = useCurrentFrame();
  const t = useT();
  const rtl = useDir() === "rtl";
  const foot = [t("ch9.source")];
  if (idx === 2) {
    const per = len / ZONES.length;
    const zi = Math.min(ZONES.length - 1, Math.floor(f / per));
    return (
      <SceneFrame title={t("ch9.title")} subtitle={t("ch9.subtitle")} footExtra={foot}>
        <ZoneIndex frame={f} active={ZONES[zi] as Zone} done={ZONES.slice(0, zi) as Zone[]} x={rtl ? content.right - 560 : content.left} y={238} width={560} />
        <div style={{ position: "absolute", left: rtl ? content.left : 760, right: rtl ? 760 : content.left, top: 300, fontSize: 56, fontWeight: 700, lineHeight: 1.2, opacity: prog(f, 6, frames.base), textAlign: rtl ? "right" : "left" }}>
          {t("ch9.note")}
          <div style={{ fontSize: type.body, fontWeight: 500, color: brand.muted, marginTop: 24 }}>{t("ch9.source")}</div>
        </div>
      </SceneFrame>
    );
  }
  if (idx === 0) {
    return <SceneFrame title={t("ch9.title")} subtitle={t("ch9.subtitle")} footExtra={foot}><Page rows={pages[0]} f={f} /></SceneFrame>;
  }
  const per = len / pages.length;
  const pi = Math.min(pages.length - 1, Math.floor(f / per));
  return (
    <SceneFrame title={t("ch9.title")} subtitle={t("ch9.subtitle")} footExtra={foot}>
      <Page key={pi} rows={pages[pi]} f={f - pi * per} />
    </SceneFrame>
  );
};

export const Ch9Matrix: React.FC = () => (
  <AbsoluteFill>
    {beatFrames("Ch9").map((b, i) => (
      <Sequence key={b.id} from={b.from} durationInFrames={b.len} name={`Ch9 ${b.id}`}><Fade len={b.len}><Body idx={i} len={b.len} /></Fade></Sequence>
    ))}
  </AbsoluteFill>
);
