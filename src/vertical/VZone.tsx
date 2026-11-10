import React from "react";
import { AbsoluteFill, Sequence, interpolate, useCurrentFrame } from "remotion";
import { SceneFrame } from "../components/SceneFrame";
import { BuildingCutaway, fit } from "../components/BuildingCutaway";
import { ZoneIndex } from "../chapters/Ch1Map";
import { LayerStack, Layer } from "../components/LayerStack";
import { DetailCallout } from "../components/DetailCallout";
import { ComparisonBars } from "../components/ComparisonBars";
import { ComparisonTable } from "../components/ComparisonTable";
import { DataValue } from "../components/DataValue";
import { PROBLEMS } from "../chapters/problems";
import { Patterns, fills } from "../components/Patterns";
import { axisFor, chapterSpec, ChapterSpec, fillOf, STACK_VISUALS } from "../specs/zones";
import { beatFrames, chapterFrames } from "../data/timeline";
import { ZONES, Zone } from "../data/selector";
import { productFootnote, productName } from "../data/products";
import { brand, colorOf, families, familyOf, type } from "../theme/brand";
import { vcontent, vsafe } from "../theme/layout";
import { frames, pop, prog } from "../theme/motion";
import { useT } from "../i18n";
import { FPS } from "../config";

/** Portrait (1080×1920) cutdown of a zone chapter — same data, beats and timing as the 16:9 chapter, native vertical layout. */
export const VERTICAL_MIN_FRAMES = 30 * FPS; // cutdowns run 30–45 s
export const vFrames = (ch: string) => Math.max(chapterFrames(ch), VERTICAL_MIN_FRAMES);

const layersOf = (ch: string, spec: ChapterSpec): Layer[] =>
  spec.stack.map((s, i) => ({ label: s.label, dataKey: (s.key ?? undefined) as string | string[] | undefined, fill: fillOf(STACK_VISUALS[ch][i].fill), h: STACK_VISUALS[ch][i].h, hatch: STACK_VISUALS[ch][i].hatch }));
const keysOfStack = (spec: ChapterSpec) => spec.stack.flatMap((s) => (s.key ? (Array.isArray(s.key) ? s.key : [s.key]) : []));

const JointFigure: React.FC<{ frame: number; x: number; y: number; spec: ChapterSpec; labels: boolean }> = ({ frame, x, y, spec, labels }) => {
  const a = prog(frame, 0, frames.slow), b = pop(frame, 36, "settle");
  const w = 160, gap = 44, h = 240, ws = colorOf("HYDROSTOP-HW");
  return (
    <g>
      <Patterns />
      <g opacity={a}>
        <rect x={x} y={y} width={w} height={h} fill={fills.concrete} stroke={brand.ink} strokeWidth={2} />
        <rect x={x + w + gap} y={y} width={w} height={h} fill={fills.concrete} stroke={brand.ink} strokeWidth={2} />
      </g>
      <g opacity={Math.min(1, b)}>
        <rect x={x + 20} y={y + h / 2 - 8} width={2 * w + gap - 40} height={16} fill={ws} stroke={brand.ink} strokeWidth={2} />
        <circle cx={x + w + gap / 2} cy={y + h / 2} r={26} fill={ws} fillOpacity={0.35} stroke={brand.ink} strokeWidth={4} />
      </g>
      {labels && (
        <foreignObject x={x + 2 * w + gap + 60} y={y} width={1026 - (x + 2 * w + gap + 60)} height={h + 60}>
          <div style={{ fontSize: type.body, lineHeight: "42px", opacity: prog(frame, 50, frames.base) }}>
            {spec.stack.slice().reverse().map((s, i) => (
              <div key={i} style={{ marginBottom: 12 }}>
                <div style={{ fontWeight: 700 }}>{s.label}</div>
                {s.key && (Array.isArray(s.key) ? s.key : [s.key]).map((k) => <div key={k}><DataValue k={k} bold={false} /></div>)}
              </div>
            ))}
          </div>
        </foreignObject>
      )}
    </g>
  );
};

const Fade: React.FC<{ len: number; children: React.ReactNode }> = ({ len, children }) => {
  const f = useCurrentFrame();
  return <AbsoluteFill style={{ opacity: interpolate(f, [0, 6, len - 6, len], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>{children}</AbsoluteFill>;
};

const Body: React.FC<{ ch: string; idx: number }> = ({ ch, idx }) => {
  const f = useCurrentFrame();
  const t = useT();
  const spec = chapterSpec(ch);
  const zone = spec.zone as Zone;
  const stepKeys = ["", "ch.problem", "ch.candidates", "ch.stack", "ch.details", "ch.compare", "ch.compare"];
  const sub = idx === 0 ? t("ch.zone", { zone }) : t(stepKeys[idx]);
  const layers = layersOf(ch, spec);
  const total = layers.reduce((a, l) => a + l.h, 0);
  const isE = ch === "Ch6";
  const frame = (children: React.ReactNode, foot: string[] = [], extra: string[] = []) => (
    <SceneFrame title={t(`chapters.${ch}`)} subtitle={sub} footKeys={foot} footExtra={extra}>{children}</SceneFrame>
  );
  const svg = (children: React.ReactNode) => <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>{children}</svg>;

  if (idx === 0) {
    const layout = fit(vsafe.x, 310, vcontent.width, 700);
    const done = ZONES.slice(0, ZONES.indexOf(zone)) as Zone[];
    return frame(
      <>
        {svg(<BuildingCutaway frame={f} layout={layout} reveal={1} active={zone} activeSince={0} done={done} focus={pop(f, 0, "settle")} focusZone={zone} pins={false} />)}
        <ZoneIndex frame={f} active={zone} done={done} x={vsafe.x} y={1040} width={vcontent.width} rowH={66} />
      </>,
    );
  }
  if (idx === 1) {
    const P = PROBLEMS[zone];
    return frame(
      <>
        <div style={{ position: "absolute", left: vsafe.x, right: vsafe.x, top: 260, fontSize: 52, fontWeight: 700, lineHeight: 1.2, opacity: prog(f, 4, frames.base) }}>{t(`zc.${ch}.problem`)}</div>
        {svg(<g transform="translate(540 900) scale(1.0)"><P f={f} /></g>)}
      </>,
    );
  }
  if (idx === 2) {
    return frame(
      <div style={{ position: "absolute", left: vsafe.x, top: 300, display: "flex", flexDirection: "column", gap: 34 }}>
        {spec.candidates.map((id, i) => {
          const s = pop(f, 6 + i * 8);
          const fam = families[familyOf(id)];
          return (
            <div key={id} style={{ display: "flex", alignItems: "center", gap: 24, transform: `translateX(${(1 - Math.min(1, s)) * -120}px)`, opacity: Math.min(1, s) }}>
              <div style={{ width: 22, height: 96, background: fam.color, borderRadius: 6 }} />
              <div>
                <div style={{ fontSize: 60, fontWeight: 800, lineHeight: 1.05 }}>{productName(id)}</div>
                <div style={{ fontSize: type.body, color: brand.muted }}>{t(fam.key)}</div>
              </div>
            </div>
          );
        })}
      </div>,
    );
  }
  if (idx === 3) {
    const y0 = Math.max(330, 800 - total / 2);
    return frame(
      svg(isE ? <JointFigure frame={f} x={54} y={420} spec={spec} labels /> : <LayerStack layers={layers} frame={f} start={4} x={54} y={y0} width={340} labelW={500} bounds={[260, 1480]} every={frames.slow} noteNotToScale={t("ch.stack")} />),
      keysOfStack(spec),
    );
  }
  if (idx === 4) {
    const y0 = 290;
    return frame(
      <>
        {svg(isE ? <JointFigure frame={9999} x={54} y={y0} spec={spec} labels={false} /> : <LayerStack layers={layers} frame={9999} x={54} y={y0} width={460} labels={false} />)}
        {spec.callouts.map((c, i) => (
          <DetailCallout key={i} n={i + 1} badge pin={[isE ? 54 + 80 + i * 150 : 54 + 460 * 0.78, isE ? y0 + 100 + i * 60 : y0 + total * (0.14 + 0.3 * i)]} box={[54, y0 + Math.max(total, 260) + 80 + i * 250]} width={972} text={c.quote} frame={f} start={6 + i * 28} />
        ))}
      </>,
      [],
      [`Source: ${[...new Set(spec.callouts.map((c) => c.source))].join("  ·  ")}`],
    );
  }
  if (idx === 5) {
    const p = spec.panel;
    const cellKeys = p.rows.flatMap((r) => r.cells).filter((k): k is string => !!k);
    return frame(
      p.kind === "bars" ? (
        <ComparisonBars stacked products={p.products} props={p.props.map((k) => ({ key: k, axisMax: axisFor(ch, k) }))} frame={f} start={4} x={vsafe.x} y={290} width={vcontent.width} />
      ) : (
        <ComparisonTable stacked products={p.products} rows={p.rows.map((r) => ({ prop: r.prop, cells: r.cells as (string | null)[] }))} frame={f} start={4} x={vsafe.x} y={280} width={vcontent.width} />
      ),
      cellKeys,
    );
  }
  return frame(
    <div style={{ position: "absolute", left: vsafe.x, right: vsafe.x, top: 300, display: "flex", flexDirection: "column", gap: 60 }}>
      {spec.choose.map((c, i) => {
        const a = prog(f, 4 + i * 14, frames.base);
        return (
          <div key={i} style={{ opacity: a, transform: `translateY(${(1 - a) * 16}px)`, borderTop: `8px solid ${colorOf(c.product)}`, paddingTop: 16 }}>
            <div style={{ fontSize: type.label, fontWeight: 800 }}>{t("ch.chooseWhen", { product: productName(c.product) })}</div>
            <div style={{ fontSize: 48, lineHeight: 1.2, marginTop: 14 }}>“{c.quote.replace(/\.$/, "")}”</div>
          </div>
        );
      })}
    </div>,
    [],
    [...new Set(spec.choose.map((c) => productFootnote(c.product)))],
  );
};

export const VZone: React.FC<{ ch: string }> = ({ ch }) => {
  const beats = beatFrames(ch);
  const extra = vFrames(ch) - chapterFrames(ch); // hold the last scene so the cutdown reaches 30 s
  return (
    <AbsoluteFill>
      {beats.map((b, i) => {
        const len = b.len + (i === beats.length - 1 ? extra : 0);
        return <Sequence key={b.id} from={b.from} durationInFrames={len} name={`V ${ch} ${b.id}`}><Fade len={len}><Body ch={ch} idx={i} /></Fade></Sequence>;
      })}
    </AbsoluteFill>
  );
};
