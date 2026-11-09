import React from "react";
import { AbsoluteFill, Img, Sequence, interpolate, staticFile, useCurrentFrame } from "remotion";
import { SceneFrame } from "../components/SceneFrame";
import { beatFrames } from "../data/timeline";
import { brand, type } from "../theme/brand";
import { frames, prog } from "../theme/motion";
import { safe } from "../theme/layout";
import { useT } from "../i18n";

const Fade: React.FC<{ len: number; children: React.ReactNode }> = ({ len, children }) => {
  const f = useCurrentFrame();
  return <AbsoluteFill style={{ opacity: interpolate(f, [0, 8, len - 8, len], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>{children}</AbsoluteFill>;
};

const Card: React.FC = () => {
  const f = useCurrentFrame();
  const t = useT();
  const sentences = t("close.text").split(/(?<=\.)\s+/);
  return (
    <SceneFrame logo>
      <div style={{ position: "absolute", left: safe.x + 60, right: safe.x + 60, top: 270, fontSize: 60, fontWeight: 700, lineHeight: 1.25 }}>
        {sentences.map((s, i) => <div key={i} style={{ opacity: prog(f, 6 + i * 22, frames.base), transform: `translateY(${(1 - prog(f, 6 + i * 22, frames.base)) * 14}px)`, marginBottom: 22 }}>{s}</div>)}
      </div>
    </SceneFrame>
  );
};

const End: React.FC = () => {
  const f = useCurrentFrame();
  const t = useT();
  const a = prog(f, 0, frames.slow);
  return (
    <SceneFrame logo={false}>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 40, opacity: a }}>
        <Img src={staticFile("brand/dcp_logo.svg")} style={{ height: 300 }} />
        <div style={{ fontSize: type.body, color: brand.muted, border: `2px dashed ${brand.muted}`, borderRadius: 10, padding: "8px 24px" }}>{t("close.logo")}</div>
        <div style={{ fontSize: type.body, color: brand.muted, border: `2px dashed ${brand.muted}`, borderRadius: 10, padding: "8px 24px" }}>{t("close.contact")}</div>
      </div>
    </SceneFrame>
  );
};

export const Ch10Close: React.FC = () => (
  <AbsoluteFill>
    {beatFrames("Ch10").map((b, i) => (
      <Sequence key={b.id} from={b.from} durationInFrames={b.len} name={`Ch10 ${b.id}`}><Fade len={b.len}>{i === 0 ? <Card /> : <End />}</Fade></Sequence>
    ))}
  </AbsoluteFill>
);
