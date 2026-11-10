import React from "react";
import { AbsoluteFill, Sequence, interpolate, useCurrentFrame } from "remotion";
import { SceneFrame } from "../components/SceneFrame";
import { BuildingCutaway, fit } from "../components/BuildingCutaway";
import { ZoneIndex } from "../chapters/Ch1Map";
import { Carbonation, Thermal, Water } from "../chapters/Ch0Cold";
import { beatFrames, chapterFrames } from "../data/timeline";
import { ZONES, Zone } from "../data/selector";
import { brand } from "../theme/brand";
import { vcontent, vsafe } from "../theme/layout";
import { pop, prog } from "../theme/motion";
import { useT } from "../i18n";

/** Portrait overview: the three mechanisms (Ch0) then the zone map (Ch1). No data values on screen, so no source footnote. */
const FIT = [{ cx: 580, cy: 535, sc: 1.1 }, { cx: 605, cy: 515, sc: 1.2 }, { cx: 650, cy: 470, sc: 1.2 }];
const DIAG = [Water, Carbonation, Thermal];
const KEYS = ["ch0.water", "ch0.carbonation", "ch0.uv"];

const Fade: React.FC<{ len: number; children: React.ReactNode }> = ({ len, children }) => {
  const f = useCurrentFrame();
  return <AbsoluteFill style={{ opacity: interpolate(f, [0, 8, len - 8, len], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>{children}</AbsoluteFill>;
};

const Mechanism: React.FC<{ i: number }> = ({ i }) => {
  const f = useCurrentFrame();
  const t = useT();
  const D = DIAG[i], { cx, cy, sc } = FIT[i];
  return (
    <SceneFrame title={t(KEYS[i])} titleMax={780}>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <g transform={`translate(540 860) scale(${sc}) translate(${-cx} ${-cy})`}><D f={f} /></g>
      </svg>
      <div style={{ position: "absolute", left: vsafe.x, top: 420, display: "flex", gap: 12 }}>
        {[0, 1, 2].map((k) => <span key={k} style={{ width: 44, height: 8, borderRadius: 4, background: k === i ? brand.accent : brand.grid }} />)}
      </div>
    </SceneFrame>
  );
};

const MapScene: React.FC = () => {
  const f = useCurrentFrame();
  const t = useT();
  const beats = beatFrames("Ch1");
  const draw = beats[0];
  const idx = beats.findIndex((b, i) => i > 0 && f >= b.from && f < b.from + b.len);
  const active: Zone | null = idx > 0 ? ZONES[idx - 1] : null;
  const since = idx > 0 ? beats[idx].from : 0;
  const done = idx > 0 ? (ZONES.slice(0, idx - 1) as Zone[]) : [];
  const layout = fit(vsafe.x, 320, vcontent.width, 700);
  return (
    <SceneFrame title={t("ch1.title")} subtitle={t("ch1.subtitle")}>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <BuildingCutaway frame={f} layout={layout} reveal={prog(f, 0, draw.len - 20, (x) => x)} active={active} activeSince={since} done={done} focus={active ? pop(f, since, "settle") : 0} focusZone={active} pins />
      </svg>
      <ZoneIndex frame={f} start={Math.round(draw.len * 0.5)} active={active} done={done} x={vsafe.x} y={1060} width={vcontent.width} rowH={64} />
    </SceneFrame>
  );
};

export const vOverviewFrames = () => chapterFrames("Ch0") + chapterFrames("Ch1");

export const VOverview: React.FC = () => {
  const c0 = beatFrames("Ch0");
  const off = chapterFrames("Ch0");
  return (
    <AbsoluteFill>
      {c0.map((b, i) => <Sequence key={b.id} from={b.from} durationInFrames={b.len}><Fade len={b.len}><Mechanism i={i} /></Fade></Sequence>)}
      <Sequence from={off} durationInFrames={chapterFrames("Ch1")}><MapScene /></Sequence>
    </AbsoluteFill>
  );
};
