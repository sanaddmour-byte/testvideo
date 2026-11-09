import React from "react";
import { AbsoluteFill, Sequence, useCurrentFrame, interpolate } from "remotion";
import { SceneFrame } from "../components/SceneFrame";
import { Patterns, fills } from "../components/Patterns";
import { brand, stroke, type } from "../theme/brand";
import { beatFrames } from "../data/timeline";
import { ease, prog } from "../theme/motion";
import { useT } from "../i18n";
import { safe } from "../theme/layout";

const X0 = 560, Y0 = 250, WALL_W = 240, WALL_H = 500; // wall section geometry (px)

const Label: React.FC<{ x: number; y: number; to: [number, number]; text: string; a: number }> = ({ x, y, to, text, a }) => (
  <g opacity={a}>
    <line x1={x} y1={y} x2={to[0]} y2={to[1]} stroke={brand.ink} strokeWidth={2} />
    <text x={x} y={to[1] < y ? y + 40 : y - 14} fontSize={type.body} fontWeight={700} fill={brand.ink} textAnchor="middle">{text}</text>
  </g>
);

// ------------------------------------------------------------------ 0.1 water ingress
const Water: React.FC<{ f: number }> = ({ f }) => {
  const t = useT();
  const crack = "M0 -10 L18 40 L-6 90 L20 140 L2 190 L24 240";
  const crackPath = `M${X0 + 60} ${Y0 + 60} l18 50 l-24 50 l26 50 l-18 50 l22 50`;
  const jointY = Y0 + 380;
  const wet = prog(f, 40, 70, ease.inOut);
  const dropT = (f * 0.012) % 1;
  // droplets follow crack (zigzag) and joint (straight)
  const crackPts = [[0, 0], [18, 50], [-6, 100], [20, 150], [2, 200], [24, 250]];
  const seg = (u: number) => { const n = crackPts.length - 1, k = Math.min(n - 1, Math.floor(u * n)), r = u * n - k; return [crackPts[k][0] + (crackPts[k + 1][0] - crackPts[k][0]) * r, crackPts[k][1] + (crackPts[k + 1][1] - crackPts[k][1]) * r]; };
  return (
    <g>
      <Patterns />
      {/* rain */}
      {Array.from({ length: 16 }, (_, i) => {
        const x = X0 - 380 + (i % 8) * 46, ph = ((f * 5 + i * 37) % 420);
        return <line key={i} x1={x + ph * 0.25} y1={Y0 - 40 + ph} x2={x + ph * 0.25 - 8} y2={Y0 - 40 + ph + 26} stroke={brand.water} strokeWidth={4} strokeLinecap="round" opacity={ph < 380 ? 0.9 : 0} />;
      })}
      {/* wall */}
      <rect x={X0} y={Y0} width={WALL_W} height={WALL_H} fill={fills.concrete} stroke={brand.ink} strokeWidth={stroke.heavy} />
      {/* wet stain on the inside face */}
      <rect x={X0 + WALL_W} y={Y0 + 30} width={90 * wet} height={420} fill={brand.water} opacity={0.35 * wet} />
      {/* crack */}
      <path d={crackPath} fill="none" stroke={brand.ink} strokeWidth={6} pathLength={1} strokeDasharray="1" strokeDashoffset={1 - prog(f, 0, 30)} />
      {/* joint: gap across the wall thickness */}
      <rect x={X0} y={jointY} width={WALL_W} height={20} fill={brand.paper} stroke={brand.ink} strokeWidth={2} opacity={prog(f, 0, 20)} />
      {/* droplets */}
      {[0, 0.33, 0.66].map((o, i) => {
        const u = (dropT + o) % 1, [dx, dy] = seg(u);
        return <circle key={i} cx={X0 + 60 + dx * 1} cy={Y0 + 60 + dy * 1} r={9} fill={brand.water} stroke={brand.ink} strokeWidth={1.5} opacity={prog(f, 25, 10)} />;
      })}
      {[0.1, 0.5, 0.9].map((o, i) => {
        const u = (dropT * 1.2 + o) % 1;
        return <circle key={`j${i}`} cx={X0 + u * WALL_W} cy={jointY + 10} r={8} fill={brand.water} stroke={brand.ink} strokeWidth={1.5} opacity={prog(f, 25, 10)} />;
      })}
      <Label x={X0 + 40} y={Y0 + WALL_H + 60} to={[X0 + 62, Y0 + 270]} text={t("ch0.crack")} a={prog(f, 30, 14)} />
      <Label x={X0 + WALL_W + 140} y={jointY + 90} to={[X0 + WALL_W - 20, jointY + 22]} text={t("ch0.joint")} a={prog(f, 36, 14)} />
    </g>
  );
};

// ------------------------------------------------------------------ 0.2 carbonation → corrosion → spalling
const Carbonation: React.FC<{ f: number }> = ({ f }) => {
  const t = useT();
  const W = 420, H = 440, x0 = X0 - 100, y0 = Y0 + 20, barX = x0 + 150, barY = y0 + H / 2;
  const front = prog(f, 10, 80, ease.inOut);       // carbonation front 0..1 across the cover
  const reach = front >= 0.99;
  const rust = prog(f, 92, 30);                    // rebar corrodes after the front arrives
  const crackT = prog(f, 112, 24);
  const spall = prog(f, 138, 36, ease.inOut);
  const r = 26 + 10 * rust;
  return (
    <g>
      <Patterns />
      {/* CO2 molecules drifting in */}
      {Array.from({ length: 7 }, (_, i) => {
        const ph = ((f * 2 + i * 41) % 200) / 200, y = y0 + 40 + i * 58;
        return (
          <g key={i} opacity={ph < 0.85 && f < 100 ? 1 : 0}>
            <circle cx={x0 - 130 + ph * 220} cy={y} r={15} fill="#fff" stroke={brand.ink} strokeWidth={2} />
            <text x={x0 - 130 + ph * 220} y={y} textAnchor="middle" dominantBaseline="central" fontSize={15} fontWeight={700}>CO₂</text>
          </g>
        );
      })}
      {/* concrete block */}
      <path d={`M${x0} ${y0} H${x0 + W} V${y0 + H} H${x0} Z`} fill={fills.concrete} stroke={brand.ink} strokeWidth={stroke.heavy} />
      {spall > 0 && <polygon points={`${x0 - 2},${y0 + 150} ${x0 + 150},${y0 + 130} ${x0 + 190},${y0 + 230} ${x0 + 150},${y0 + 300} ${x0 - 2},${y0 + 290}`} fill={brand.paper} stroke={brand.ink} strokeWidth={2} strokeDasharray="8 6" />}
      <g transform={`translate(${spall * 70} ${spall * 260}) rotate(${spall * 28} ${x0 + 40} ${y0 + H / 2})`} opacity={1 - spall * 0.6}>
        {/* spalling piece: cover region over the rebar that breaks away */}
        <polygon points={`${x0},${y0 + 150} ${x0 + 150},${y0 + 130} ${x0 + 190},${y0 + 230} ${x0 + 150},${y0 + 300} ${x0},${y0 + 290}`} fill={fills.concrete} stroke={brand.ink} strokeWidth={stroke.heavy} opacity={spall > 0 ? 1 : 0} />
      </g>
      {/* carbonation front (colour change zone) */}
      <rect x={x0} y={y0} width={190 * front} height={H} fill={brand.accent} opacity={0.22} />
      <line x1={x0 + 190 * front} y1={y0} x2={x0 + 190 * front} y2={y0 + H} stroke={brand.accent} strokeWidth={4} />
      {/* cracks radiating from the rebar to the surface */}
      <path d={`M${barX} ${barY} L${barX - 40} ${barY - 30} L${barX - 90} ${barY - 20} L${x0} ${barY - 40}`} fill="none" stroke={brand.ink} strokeWidth={4} pathLength={1} strokeDasharray="1" strokeDashoffset={1 - crackT} />
      {/* rebar */}
      <circle cx={barX} cy={barY} r={r} fill={rust > 0 ? brand.rust : brand.steel} stroke={brand.ink} strokeWidth={3} />
      <Label x={barX + 150} y={barY + 120} to={[barX + 20, barY + 18]} text={t("ch0.rebar")} a={prog(f, 5, 14)} />
      <Label x={x0 + 80} y={y0 + H + 56} to={[x0 + 70, y0 + H - 10]} text={t("ch0.cover")} a={prog(f, 5, 14)} />
      <Label x={x0 - 40} y={y0 - 20} to={[x0 - 8, y0 + 10]} text={t("ch0.co2")} a={prog(f, 5, 14) * (reach ? 0 : 1)} />
    </g>
  );
};

// ------------------------------------------------------------------ 0.3 UV and thermal cycling
const Thermal: React.FC<{ f: number }> = ({ f }) => {
  const swing = Math.sin(f / 9);
  const open = prog(f, 20, 70);
  const sx = X0 - 200, sy = Y0 + 330, sw = 560, sh = 90;
  const grow = swing * 14;
  return (
    <g>
      <Patterns />
      {/* sun */}
      <g transform={`translate(${X0 + 420} ${Y0 + 20})`}>
        <circle r={54} fill={brand.accent} stroke={brand.ink} strokeWidth={3} />
        {Array.from({ length: 12 }, (_, i) => <line key={i} x1={Math.cos((i / 12) * 6.283 + f / 40) * 70} y1={Math.sin((i / 12) * 6.283 + f / 40) * 70} x2={Math.cos((i / 12) * 6.283 + f / 40) * 96} y2={Math.sin((i / 12) * 6.283 + f / 40) * 96} stroke={brand.accent} strokeWidth={5} strokeLinecap="round" />)}
      </g>
      {/* rays onto slab */}
      {Array.from({ length: 5 }, (_, i) => <line key={i} x1={X0 + 380 - i * 70} y1={Y0 + 120} x2={X0 + 300 - i * 120} y2={sy - 6} stroke={brand.accent} strokeWidth={3} strokeDasharray="10 12" opacity={0.7} />)}
      {/* slab expands and contracts */}
      <rect x={sx - grow} y={sy} width={sw + grow * 2} height={sh} fill={fills.concrete} stroke={brand.ink} strokeWidth={stroke.heavy} />
      <rect x={sx - grow} y={sy} width={sw + grow * 2} height={sh} fill={brand.accent} opacity={0.12 + 0.12 * swing} />
      {/* surface cracks open */}
      {[0.22, 0.5, 0.78].map((u, i) => (
        <path key={i} d={`M${sx + sw * u} ${sy} l${6 + i * 3} 20 l-8 22 l8 20`} fill="none" stroke={brand.ink} strokeWidth={2 + open * 3} pathLength={1} strokeDasharray="1" strokeDashoffset={1 - prog(f, 15 + i * 12, 40)} />
      ))}
      {/* movement arrows */}
      <g stroke={brand.ink} strokeWidth={4} fill={brand.ink}>
        <line x1={sx - 30 - grow} y1={sy + sh / 2} x2={sx - 90 - grow} y2={sy + sh / 2} /><polygon points={`${sx - 100 - grow},${sy + sh / 2} ${sx - 78 - grow},${sy + sh / 2 - 12} ${sx - 78 - grow},${sy + sh / 2 + 12}`} />
        <line x1={sx + sw + 30 + grow} y1={sy + sh / 2} x2={sx + sw + 90 + grow} y2={sy + sh / 2} /><polygon points={`${sx + sw + 100 + grow},${sy + sh / 2} ${sx + sw + 78 + grow},${sy + sh / 2 - 12} ${sx + sw + 78 + grow},${sy + sh / 2 + 12}`} />
      </g>
      {/* thermometer */}
      <g transform={`translate(${sx - 60} ${Y0 + 40})`}>
        <rect x={-14} y={0} width={28} height={200} rx={14} fill="#fff" stroke={brand.ink} strokeWidth={3} />
        <rect x={-8} y={190 - (120 + swing * 70)} width={16} height={120 + swing * 70} rx={8} fill={brand.accent} />
        <circle cx={0} cy={216} r={28} fill={brand.accent} stroke={brand.ink} strokeWidth={3} />
      </g>
    </g>
  );
};

export const Ch0Cold: React.FC = () => {
  const t = useT();
  const beats = beatFrames("Ch0");
  const keys = ["ch0.water", "ch0.carbonation", "ch0.uv"];
  const comps = [Water, Carbonation, Thermal];
  return (
    <AbsoluteFill>
      {beats.map((b, i) => {
        const C = comps[i];
        return (
          <Sequence key={b.id} from={b.from} durationInFrames={b.len}>
            <BeatFrame len={b.len} title={t(keys[i])} index={i} count={beats.length}><C f={0} /></BeatFrame>
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};

const FIT = [{ cx: 580, cyy: 535, sc: 1.2, cy: 560 }, { cx: 605, cyy: 515, sc: 1.3, cy: 560 }, { cx: 650, cyy: 470, sc: 1.35, cy: 560 }];
const BeatFrame: React.FC<{ len: number; title: string; index: number; count: number; children: React.ReactElement<{ f: number }> }> = ({ len, title, index, count, children }) => {
  const f = useCurrentFrame();
  const { cx, cyy, sc, cy } = FIT[index];
  const fade = interpolate(f, [0, 8, len - 8, len], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <SceneFrame title={title} titleMax={1500}>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, opacity: fade }}>
        <g transform={`translate(960 ${cy}) scale(${sc}) translate(${-cx} ${-cyy})`}>{React.cloneElement(children, { f })}</g>
      </svg>
      <div style={{ position: "absolute", left: safe.x, top: safe.y + 100, display: "flex", gap: 12, opacity: fade }}>
        {Array.from({ length: count }, (_, i) => <span key={i} style={{ width: 44, height: 8, borderRadius: 4, background: i === index ? brand.accent : brand.grid }} />)}
      </div>
    </SceneFrame>
  );
};
