import React from "react";
import { AbsoluteFill, Sequence, interpolate, useCurrentFrame } from "remotion";
import { SceneFrame } from "../components/SceneFrame";
import { BuildingCutaway, fit } from "../components/BuildingCutaway";
import { ZoneIndex } from "./Ch1Map";
import { LayerStack, Layer } from "../components/LayerStack";
import { DetailCallout } from "../components/DetailCallout";
import { ComparisonBars } from "../components/ComparisonBars";
import { ComparisonTable } from "../components/ComparisonTable";
import { DataValue } from "../components/DataValue";
import { PROBLEMS } from "./problems";
import { Patterns, fills } from "../components/Patterns";
import { axisFor, chapterSpec, ChapterSpec, fillOf, STACK_VISUALS } from "../specs/zones";
import { beatFrames } from "../data/timeline";
import { ZONES, Zone } from "../data/selector";
import { productFootnote, productName } from "../data/products";
import { brand, colorOf, families, familyOf, type } from "../theme/brand";
import { content, safe } from "../theme/layout";
import { frames, pop, prog } from "../theme/motion";
import { useDir, useT } from "../i18n";

const layersOf = (ch: string, spec: ChapterSpec): Layer[] =>
  spec.stack.map((s, i) => ({ label: s.label, dataKey: (s.key ?? undefined) as string | string[] | undefined, fill: fillOf(STACK_VISUALS[ch][i].fill), h: STACK_VISUALS[ch][i].h, hatch: STACK_VISUALS[ch][i].hatch }));
const stackGeom = (layers: Layer[]) => { const total = layers.reduce((a, l) => a + l.h, 0); return { total, y: Math.max(250, 540 - total / 2 + 20) }; };
const keysOfStack = (spec: ChapterSpec) => spec.stack.flatMap((s) => (s.key ? (Array.isArray(s.key) ? s.key : [s.key]) : []));

/** Zone E has no layer stack: a movement joint with a cast-in waterstop. */
const JointFigure: React.FC<{ frame: number; x: number; y: number; spec: ChapterSpec; labels: boolean }> = ({ frame, x, y, spec, labels }) => {
  const a = prog(frame, 0, frames.slow), b = pop(frame, 36, "settle");
  const w = 230, gap = 56, h = 280;
  const ws = colorOf("HYDROSTOP-HW");
  const keys = spec.stack.flatMap((s) => (s.key ? (Array.isArray(s.key) ? s.key : [s.key]) : []));
  return (
    <g>
      <Patterns />
      <g opacity={a}>
        <rect x={x} y={y} width={w} height={h} fill={fills.concrete} stroke={brand.ink} strokeWidth={2} />
        <rect x={x + w + gap} y={y} width={w} height={h} fill={fills.concrete} stroke={brand.ink} strokeWidth={2} />
      </g>
      <g opacity={Math.min(1, b)} transform={`translate(0 ${(1 - Math.min(1, b)) * -30})`}>
        <rect x={x + 30} y={y + h / 2 - 9} width={2 * w + gap - 60} height={18} fill={ws} stroke={brand.ink} strokeWidth={2} />
        <circle cx={x + w + gap / 2} cy={y + h / 2} r={30} fill="none" stroke={brand.ink} strokeWidth={4} />
        <circle cx={x + w + gap / 2} cy={y + h / 2} r={30} fill={ws} opacity={0.35} />
        {[60, 110, 330, 380].map((dx) => <rect key={dx} x={x + dx} y={y + h / 2 - 22} width={8} height={44} fill={ws} stroke={brand.ink} strokeWidth={1.5} />)}
      </g>
      {labels && (
        <foreignObject x={x + 2 * w + gap + 70} y={y + 10} width={760} height={h}>
          <div style={{ fontSize: type.body, lineHeight: "42px", opacity: prog(frame, 50, frames.base) }}>
            {spec.stack.slice().reverse().map((s, i) => (
              <div key={i} style={{ marginBottom: 14 }}>
                <div style={{ fontWeight: 700 }}>{s.label}</div>
                {s.key && (Array.isArray(s.key) ? s.key : [s.key]).map((k) => <div key={k}><DataValue k={k} bold={false} /></div>)}
              </div>
            ))}
          </div>
        </foreignObject>
      )}
      <text x={x} y={y + h + 44} fontSize={type.footnote} fill={brand.muted}>Schematic — not to scale</text>
      {keys.length === 0 ? null : null}
    </g>
  );
};

const Fade: React.FC<{ len: number; children: React.ReactNode }> = ({ len, children }) => {
  const f = useCurrentFrame();
  return <AbsoluteFill style={{ opacity: interpolate(f, [0, 6, len - 6, len], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>{children}</AbsoluteFill>;
};

const Body: React.FC<{ ch: string; idx: number; len: number }> = ({ ch, idx, len }) => {
  const f = useCurrentFrame();
  const t = useT();
  const rtl = useDir() === "rtl";
  const spec = chapterSpec(ch);
  const zone = spec.zone as Zone;
  const title = t(`chapters.${ch}`);
  const stepKeys = ["", "ch.problem", "ch.candidates", "ch.stack", "ch.details", "ch.compare", ""];
  const sub = idx === 0 ? t("ch.zone", { zone }) : idx === 6 ? t("ch.compare") : t(stepKeys[idx]);
  const layers = layersOf(ch, spec);
  const g = stackGeom(layers);
  const isE = ch === "Ch6";
  const frame = (children: React.ReactNode, foot: string[] = [], extra: string[] = []) => (
    <SceneFrame title={title} subtitle={sub} footKeys={foot} footExtra={extra}>{children}</SceneFrame>
  );

  if (idx === 0) {
    const layout = fit(content.left + (rtl ? 700 : 150), 130, content.width - 850, 720);
    const done = ZONES.slice(0, ZONES.indexOf(zone)) as Zone[];
    const listW = 560;
    return frame(
      <>
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
          <BuildingCutaway frame={f} layout={layout} reveal={1} active={zone} activeSince={0} done={done} focus={pop(f, 0, "settle")} focusZone={zone} pins={false} />
        </svg>
        <ZoneIndex frame={f} start={0} active={zone} done={done} x={rtl ? content.left : content.right - listW} y={238} width={listW} />
      </>,
    );
  }
  if (idx === 1) {
    const P = PROBLEMS[zone];
    return frame(
      <>
        <div style={{ position: "absolute", left: safe.x, top: 190, maxWidth: 1400, fontSize: 48, fontWeight: 700, opacity: prog(f, 4, frames.base) }}>{t(`zc.${ch}.problem`)}</div>
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}><g transform="translate(960 600) scale(0.92)"><P f={f} /></g></svg>
      </>,
    );
  }
  if (idx === 2) {
    return frame(
      <div style={{ position: "absolute", left: safe.x, top: 230, display: "flex", flexDirection: "column", gap: 22 }}>
        {spec.candidates.map((id, i) => {
          const s = pop(f, 6 + i * 8);
          const fam = families[familyOf(id)];
          return (
            <div key={id} style={{ display: "flex", alignItems: "center", gap: 24, transform: `translateX(${(1 - Math.min(1, s)) * (rtl ? 120 : -120)}px)`, opacity: Math.min(1, s) }}>
              <div style={{ width: 22, height: 84, background: fam.color, borderRadius: 6 }} />
              <div>
                <div style={{ fontSize: 56, fontWeight: 800, lineHeight: 1.05 }}>{productName(id)}</div>
                <div style={{ fontSize: type.body, color: brand.muted }}>{t(fam.key)}</div>
              </div>
            </div>
          );
        })}
      </div>,
    );
  }
  if (idx === 3) {
    return frame(
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        {isE ? <JointFigure frame={f} x={150} y={300} spec={spec} labels /> : <LayerStack layers={layers} frame={f} start={4} x={150} y={g.y} width={560} every={frames.slow} noteNotToScale={t("ch.stack")} />}
      </svg>,
      keysOfStack(spec),
    );
  }
  if (idx === 4) {
    const px = 150 + 560 * 0.78;
    return frame(
      <>
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
          {isE ? <JointFigure frame={9999} x={150} y={300} spec={spec} labels={false} /> : <LayerStack layers={layers} frame={9999} x={150} y={g.y} width={560} labels={false} />}
        </svg>
        {spec.callouts.map((c, i) => {
          const pinY = isE ? 300 + 60 + i * 90 : g.y + g.total * (0.14 + 0.3 * i);
          const pinX = isE ? 150 + 120 + i * 190 : px;
          return <DetailCallout key={i} n={i + 1} pin={[pinX, pinY]} box={[880, 260 + i * 190]} width={900} text={c.quote} frame={f} start={6 + i * 28} />;
        })}
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
        <ComparisonBars products={p.products} props={p.props.map((k) => ({ key: k, axisMax: axisFor(ch, k) }))} frame={f} start={4} x={content.left} y={250} width={1500} />
      ) : (
        <ComparisonTable products={p.products} rows={p.rows.map((r) => ({ prop: r.prop, cells: r.cells as (string | null)[] }))} frame={f} start={4} x={content.left} y={240} width={1728} />
      ),
      cellKeys,
    );
  }
  // idx === 6: choose X when / choose Y when — TDS wording
  return frame(
    <div style={{ position: "absolute", left: safe.x, right: safe.x, top: 250, display: "flex", gap: 60, flexDirection: rtl ? "row-reverse" : "row" }}>
      {spec.choose.map((c, i) => {
        const a = prog(f, 4 + i * 14, frames.base);
        return (
          <div key={i} style={{ flex: 1, opacity: a, transform: `translateY(${(1 - a) * 16}px)`, borderTop: `8px solid ${colorOf(c.product)}`, paddingTop: 16 }}>
            <div style={{ fontSize: type.label, fontWeight: 800 }}>{t("ch.chooseWhen", { product: productName(c.product) })}</div>
            <div style={{ fontSize: 46, lineHeight: 1.2, marginTop: 14 }}>“{c.quote.replace(/\.$/, "")}”</div>
          </div>
        );
      })}
    </div>,
    [],
    [...new Set(spec.choose.map((c) => productFootnote(c.product)))],
  );
};

export const ZoneChapter: React.FC<{ ch: string }> = ({ ch }) => {
  const beats = beatFrames(ch);
  return (
    <AbsoluteFill>
      {beats.map((b, i) => (
        <Sequence key={b.id} from={b.from} durationInFrames={b.len} name={`${ch} ${b.id}`}>
          <Fade len={b.len}><Body ch={ch} idx={i} len={b.len} /></Fade>
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
