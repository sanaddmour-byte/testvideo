import React from "react";
import { AbsoluteFill, Img, Sequence, interpolate, staticFile, useCurrentFrame } from "remotion";
import { SceneFrame } from "../components/SceneFrame";
import { SelectorMatrix } from "../components/SelectorMatrix";
import { ZoneIndex } from "../chapters/Ch1Map";
import { selector, ZONES, Zone } from "../data/selector";
import { beatFrames, chapterFrames } from "../data/timeline";
import { families, familyOf, brand, type } from "../theme/brand";
import { vcontent, vsafe } from "../theme/layout";
import { frames, prog } from "../theme/motion";
import { useT } from "../i18n";

/** Portrait selector matrix + close. Matrix pages of 8 rows keep the text at 36 px or larger. */
const ORDER = ["spray", "liquid", "sheet", "epoxy", "cement", "coating", "accessory"] as const;
const sorted = [...selector].sort((a, b) => ORDER.indexOf(familyOf(a.id)) - ORDER.indexOf(familyOf(b.id)));
const PAGE = 9;
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
      <div style={{ position: "absolute", left: vsafe.x, top: 250, display: "flex", flexWrap: "wrap", gap: "6px 26px", fontSize: type.body, width: vcontent.width }}>
        {fams.map((fm) => <span key={fm} style={{ display: "flex", alignItems: "center", gap: 10 }}><span style={{ width: 18, height: 18, borderRadius: 4, background: families[fm].color }} />{t(families[fm].key)}</span>)}
      </div>
      <SelectorMatrix rows={rows} frame={f} start={2} x={vsafe.x} y={350} width={vcontent.width} rowH={62} nameW={410} zoneW={80} showOther={false} />
    </>
  );
};

const MatrixBody: React.FC<{ idx: number; len: number }> = ({ idx, len }) => {
  const f = useCurrentFrame();
  const t = useT();
  const foot = [t("ch9.source")];
  const wrap = (c: React.ReactNode) => <SceneFrame title={t("ch9.title")} subtitle={t("ch9.subtitle")} footExtra={foot}>{c}</SceneFrame>;
  if (idx === 2) {
    const zi = Math.min(ZONES.length - 1, Math.floor(f / (len / ZONES.length)));
    return wrap(
      <>
        <ZoneIndex frame={f} active={ZONES[zi] as Zone} done={ZONES.slice(0, zi) as Zone[]} x={vsafe.x} y={300} width={vcontent.width} rowH={70} />
        <div style={{ position: "absolute", left: vsafe.x, right: vsafe.x, top: 930, fontSize: 56, fontWeight: 700, lineHeight: 1.2, opacity: prog(f, 6, frames.base) }}>
          {t("ch9.note")}
          <div style={{ fontSize: type.body, fontWeight: 500, color: brand.muted, marginTop: 24 }}>{t("ch9.source")}</div>
        </div>
      </>,
    );
  }
  if (idx === 0) return wrap(<Page rows={pages[0]} f={f} />);
  const per = len / pages.length;
  const pi = Math.min(pages.length - 1, Math.floor(f / per));
  return wrap(<Page key={pi} rows={pages[pi]} f={f - pi * per} />);
};

const Card: React.FC = () => {
  const f = useCurrentFrame();
  const t = useT();
  return (
    <SceneFrame logo>
      <div style={{ position: "absolute", left: vsafe.x, right: vsafe.x, top: 480, fontSize: 62, fontWeight: 700, lineHeight: 1.25 }}>
        {t("close.text").split(/(?<=\.)\s+/).map((s, i) => <div key={i} style={{ opacity: prog(f, 6 + i * 22, frames.base), transform: `translateY(${(1 - prog(f, 6 + i * 22, frames.base)) * 14}px)`, marginBottom: 28 }}>{s}</div>)}
      </div>
    </SceneFrame>
  );
};
const End: React.FC = () => {
  const f = useCurrentFrame();
  const t = useT();
  return (
    <SceneFrame logo={false}>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 40, opacity: prog(f, 0, frames.slow) }}>
        <Img src={staticFile("brand/dcp_logo.svg")} style={{ height: 380 }} />
        <div style={{ fontSize: type.body, color: brand.muted, border: `2px dashed ${brand.muted}`, borderRadius: 10, padding: "8px 24px" }}>{t("close.logo")}</div>
        <div style={{ fontSize: type.body, color: brand.muted, border: `2px dashed ${brand.muted}`, borderRadius: 10, padding: "8px 24px" }}>{t("close.contact")}</div>
      </div>
    </SceneFrame>
  );
};

export const vSelectorFrames = () => chapterFrames("Ch9") + chapterFrames("Ch10");
export const VSelector: React.FC = () => {
  const off = chapterFrames("Ch9");
  return (
    <AbsoluteFill>
      {beatFrames("Ch9").map((b, i) => <Sequence key={b.id} from={b.from} durationInFrames={b.len}><Fade len={b.len}><MatrixBody idx={i} len={b.len} /></Fade></Sequence>)}
      {beatFrames("Ch10").map((b, i) => <Sequence key={b.id} from={off + b.from} durationInFrames={b.len}><Fade len={b.len}>{i === 0 ? <Card /> : <End />}</Fade></Sequence>)}
    </AbsoluteFill>
  );
};
