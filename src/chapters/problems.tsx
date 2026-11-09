import React from "react";
import { brand, stroke } from "../theme/brand";
import { fills, Patterns } from "../components/Patterns";

/** "The problem" diagrams — linework only, no numbers. Local origin = centre of the stage (translate(960 540) applied by the caller). */
const W = brand.water;
const Block: React.FC<{ x: number; y: number; w: number; h: number; fill: string }> = ({ x, y, w, h, fill }) => (
  <rect x={x} y={y} width={w} height={h} fill={fill} stroke={brand.ink} strokeWidth={stroke.heavy} />
);
const Drop: React.FC<{ x: number; y: number; r?: number; o?: number }> = ({ x, y, r = 9, o = 1 }) => (
  <circle cx={x} cy={y} r={r} fill={W} stroke={brand.ink} strokeWidth={1.5} opacity={o} />
);
const Arrow: React.FC<{ x: number; y: number; len: number; dir?: 1 | -1; color?: string }> = ({ x, y, len, dir = 1, color = brand.ink }) => (
  <g stroke={color} fill={color} strokeWidth={5}>
    <line x1={x} y1={y} x2={x + dir * len} y2={y} />
    <polygon points={`${x + dir * (len + 18)},${y} ${x + dir * len},${y - 13} ${x + dir * len},${y + 13}`} />
  </g>
);
const cyc = (f: number, period: number) => (f % period) / period;

export const ProblemA: React.FC<{ f: number }> = ({ f }) => {
  const pulse = 40 + 18 * Math.sin(f / 7);
  return (
    <g>
      <Patterns />
      <Block x={-460} y={-240} w={340} h={500} fill={fills.soil} />
      <rect x={-460} y={-60} width={340} height={320} fill={W} opacity={0.4} />
      <path d={`M-460 -60 Q-400 -78 -340 -60 T-220 -60 T-120 -60`} fill="none" stroke="#fff" strokeWidth={3} />
      <Block x={-120} y={-240} w={110} h={440} fill={fills.concrete} />
      <Block x={-120} y={200} w={560} h={60} fill={fills.concrete} />
      {[-20, 60, 140].map((y, i) => <Arrow key={i} x={-300 + (i % 2) * 30} y={y} len={pulse} color={brand.accent} />)}
      <path d="M-60 -120 l16 40 l-20 40 l18 40" fill="none" stroke={brand.ink} strokeWidth={5} />
      {[0, 0.4, 0.8].map((o, i) => <Drop key={i} x={30} y={-60 + ((cyc(f, 60) + o) % 1) * 250} o={0.9} />)}
      <rect x={-10} y={196} width={30} height={8} fill={brand.paper} stroke={brand.ink} strokeWidth={2} />
      {[0, 0.5].map((o, i) => <Drop key={i} x={5 + i * 12} y={180 - ((cyc(f, 50) + o) % 1) * 4} r={7} />)}
    </g>
  );
};

export const ProblemB: React.FC<{ f: number }> = ({ f }) => (
  <g>
    <Patterns />
    <Block x={-430} y={80} w={860} h={70} fill={fills.concrete} />
    <Block x={-430} y={30} w={800} h={50} fill={fills.insulation} />
    <Block x={330} y={-150} w={100} h={230} fill={fills.concrete} />
    {Array.from({ length: 14 }, (_, i) => { const ph = (f * 6 + i * 53) % 330; const x = -420 + i * 58 + ph * 0.1; return <line key={i} x1={x} y1={-230 + ph} x2={x - 8} y2={-230 + ph + 26} stroke={W} strokeWidth={4} strokeLinecap="round" opacity={ph < 290 ? 1 : 0} />; })}
    <ellipse cx={230} cy={24} rx={110} ry={9} fill={W} stroke={brand.ink} strokeWidth={2} />
    <path d="M-120 80 l12 28 l-14 24 l12 18" fill="none" stroke={brand.ink} strokeWidth={5} />
    {[0, 0.5].map((o, i) => <Drop key={i} x={-110} y={90 + ((cyc(f, 55) + o) % 1) * 110} />)}
    <g transform="translate(-340 -170)"><circle r={42} fill={brand.accent} stroke={brand.ink} strokeWidth={3} />{Array.from({ length: 10 }, (_, i) => { const a = (i / 10) * 6.283 + f / 40; return <line key={i} x1={Math.cos(a) * 56} y1={Math.sin(a) * 56} x2={Math.cos(a) * 78} y2={Math.sin(a) * 78} stroke={brand.accent} strokeWidth={5} strokeLinecap="round" />; })}</g>
  </g>
);

export const ProblemC: React.FC<{ f: number }> = ({ f }) => (
  <g>
    <Patterns />
    <Block x={-440} y={110} w={880} h={70} fill={fills.concrete} />
    <Block x={-440} y={70} w={880} h={40} fill={fills.tile} />
    <Block x={-440} y={-170} w={60} h={240} fill={fills.concrete} />
    <rect x={-380} y={62} width={760} height={8} fill={W} opacity={0.7} />
    {[0, 0.33, 0.66].map((o, i) => <Drop key={i} x={-280 + i * 14} y={-120 + ((cyc(f, 45) + o) % 1) * 180} r={8} />)}
    {[-200, 0, 200].map((x, i) => <line key={i} x1={x} y1={70} x2={x} y2={110} stroke={W} strokeWidth={6} opacity={0.9} />)}
    {[-200, 0, 200].map((x, i) => <Drop key={`s${i}`} x={x} y={92 + ((cyc(f, 70) + i * 0.3) % 1) * 78} r={7} />)}
    <rect x={-440} y={180} width={880} height={50} fill={W} opacity={0.3 + 0.15 * Math.sin(f / 10)} />
  </g>
);

export const ProblemD: React.FC<{ f: number }> = ({ f }) => {
  const push = 36 + 14 * Math.sin(f / 8);
  return (
    <g>
      <Patterns />
      <Block x={-320} y={-200} w={70} h={400} fill={fills.concrete} />
      <Block x={250} y={-200} w={70} h={400} fill={fills.concrete} />
      <Block x={-320} y={200} w={640} h={60} fill={fills.concrete} />
      <rect x={-250} y={-120} width={500} height={320} fill={fills.water} stroke={brand.ink} strokeWidth={2} />
      {[-40, 40, 120].map((y, i) => <g key={i}><Arrow x={-230} y={y} len={push} dir={-1} color={brand.accent} /><Arrow x={230} y={y} len={push} dir={1} color={brand.accent} /></g>)}
      <path d="M-290 200 l-10 30 l10 20" fill="none" stroke={brand.ink} strokeWidth={5} />
      {[0, 0.5].map((o, i) => <Drop key={i} x={-300 - i * 6} y={215 + ((cyc(f, 60) + o) % 1) * 50} r={8} />)}
    </g>
  );
};

export const ProblemE: React.FC<{ f: number }> = ({ f }) => {
  const mv = 14 * Math.sin(f / 9);
  return (
    <g>
      <Patterns />
      <Block x={-430} y={20} w={400 + mv} h={110} fill={fills.concrete} />
      <Block x={30 + mv} y={20} w={400 - mv} h={110} fill={fills.concrete} />
      <path d="M0 20 V130" stroke={W} strokeWidth={22} opacity={0.8} />
      {[0, 0.5].map((o, i) => <Drop key={i} x={0} y={30 + ((cyc(f, 50) + o) % 1) * 110} r={9} />)}
      <Arrow x={-80} y={-40} len={46} dir={-1} />
      <Arrow x={80} y={-40} len={46} dir={1} />
      <Block x={-70} y={-230} w={140} h={150} fill={fills.concrete} />
      <rect x={-210} y={-170} width={420} height={34} rx={17} fill="#CFCBC4" stroke={brand.ink} strokeWidth={3} />
      <rect x={-78} y={-182} width={12} height={58} fill={W} opacity={0.9} /><rect x={66} y={-182} width={12} height={58} fill={W} opacity={0.9} />
      {[0, 0.5].map((o, i) => <Drop key={`p${i}`} x={72} y={-126 + ((cyc(f, 55) + o) % 1) * 36} r={7} />)}
    </g>
  );
};

export const ProblemF: React.FC<{ f: number }> = ({ f }) => {
  const front = 0.3 + 0.7 * ((f % 120) / 120);
  return (
    <g>
      <Patterns />
      <Block x={-120} y={-230} w={320} h={470} fill={fills.concrete} />
      <rect x={-120} y={-230} width={140 * front} height={470} fill={brand.accent} opacity={0.22} />
      <line x1={-120 + 140 * front} y1={-230} x2={-120 + 140 * front} y2={240} stroke={brand.accent} strokeWidth={4} />
      {[-110, 10, 130].map((y, i) => <circle key={i} cx={78} cy={y} r={20} fill={brand.steel} stroke={brand.ink} strokeWidth={3} />)}
      {Array.from({ length: 6 }, (_, i) => { const ph = ((f * 2 + i * 33) % 180) / 180; return <g key={i} opacity={ph < 0.9 ? 1 : 0}><circle cx={-420 + ph * 260} cy={-180 + i * 70} r={17} fill="#fff" stroke={brand.ink} strokeWidth={2} /><text x={-420 + ph * 260} y={-180 + i * 70} textAnchor="middle" dominantBaseline="central" fontSize={15} fontWeight={700}>CO₂</text></g>; })}
      {Array.from({ length: 6 }, (_, i) => { const ph = (f * 5 + i * 47) % 300; return <line key={`r${i}`} x1={-330 + i * 40 + ph * 0.1} y1={-240 + ph} x2={-338 + i * 40 + ph * 0.1} y2={-214 + ph} stroke={W} strokeWidth={4} strokeLinecap="round" opacity={ph < 260 ? 0.9 : 0} />; })}
    </g>
  );
};

export const ProblemG: React.FC<{ f: number }> = ({ f }) => {
  const rust = Math.min(1, (f % 150) / 90);
  return (
    <g>
      <Patterns />
      <Block x={-440} y={150} w={880} h={80} fill={fills.concrete} />
      <Block x={-440} y={110} w={40} h={40} fill={fills.concrete} /><Block x={400} y={110} w={40} h={40} fill={fills.concrete} />
      <rect x={-60} y={-230} width={120} height={30} fill={brand.steel} stroke={brand.ink} strokeWidth={3} />
      <rect x={-60} y={120} width={120} height={30} fill={brand.steel} stroke={brand.ink} strokeWidth={3} />
      <rect x={-12} y={-200} width={24} height={320} fill={brand.steel} stroke={brand.ink} strokeWidth={3} />
      {[0, 1, 2].map((i) => <circle key={i} cx={-8 + i * 8} cy={100 - i * 22} r={4 + 12 * rust} fill={brand.rust} opacity={rust} />)}
      {Array.from({ length: 5 }, (_, i) => { const ph = (cyc(f, 70) + i * 0.2) % 1; return <circle key={i} cx={-380 + i * 60 + ph * 120} cy={-120 + ph * 240} r={10} fill="#C8D54B" stroke={brand.ink} strokeWidth={2} opacity={ph < 0.95 ? 1 : 0} />; })}
      <ellipse cx={-120} cy={148} rx={110} ry={9} fill="#C8D54B" stroke={brand.ink} strokeWidth={2} opacity={0.9} />
    </g>
  );
};

export const PROBLEMS: Record<string, React.FC<{ f: number }>> = { A: ProblemA, B: ProblemB, C: ProblemC, D: ProblemD, E: ProblemE, F: ProblemF, G: ProblemG };
