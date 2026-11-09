import React from "react";
import { brand } from "../theme/brand";

// Seeded stipple so every frame renders identically.
const dots = (n: number, size: number, seed: number) => {
  let s = seed; const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  return Array.from({ length: n }, () => ({ x: rnd() * size, y: rnd() * size, r: 0.6 + rnd() * 0.9 }));
};
const STIPPLE = dots(14, 22, 7);

/** Standard section hatching (brief §7): concrete stipple, soil hatch, steel solid, insulation zig-zag. */
export const Patterns: React.FC = () => (
  <defs>
    <pattern id="p-concrete" width="22" height="22" patternUnits="userSpaceOnUse">
      <rect width="22" height="22" fill={brand.concrete} />
      {STIPPLE.map((d, i) => <circle key={i} cx={d.x} cy={d.y} r={d.r} fill={brand.ink} opacity={0.55} />)}
    </pattern>
    <pattern id="p-soil" width="20" height="20" patternUnits="userSpaceOnUse">
      <rect width="20" height="20" fill={brand.soil} />
      <path d="M-2 14 L14 -2 M6 22 L22 6" stroke={brand.ink} strokeWidth={1} opacity={0.5} />
      <circle cx="14" cy="14" r="1.4" fill="none" stroke={brand.ink} strokeWidth={0.9} opacity={0.5} />
      <circle cx="4" cy="6" r="1" fill="none" stroke={brand.ink} strokeWidth={0.9} opacity={0.5} />
    </pattern>
    <pattern id="p-insulation" width="24" height="12" patternUnits="userSpaceOnUse">
      <rect width="24" height="12" fill={brand.insulation} />
      <path d="M0 6 L4 1 L8 11 L12 1 L16 11 L20 1 L24 6" fill="none" stroke={brand.ink} strokeWidth={1} />
    </pattern>
    <pattern id="p-tile" width="16" height="16" patternUnits="userSpaceOnUse">
      <rect width="16" height="16" fill="#E9F0F2" />
      <path d="M0 0 H16 M0 0 V16" stroke={brand.ink} strokeWidth={0.8} opacity={0.5} />
    </pattern>
    <pattern id="p-hatch" width="9" height="9" patternUnits="userSpaceOnUse">
      <rect width="9" height="9" fill="#F4F0E8" />
      <path d="M-1 10 L10 -1" stroke={brand.ink} strokeWidth={0.8} opacity={0.5} />
    </pattern>
    <pattern id="p-water" width="30" height="10" patternUnits="userSpaceOnUse">
      <rect width="30" height="10" fill={brand.water} />
      <path d="M0 5 Q7.5 0 15 5 T30 5" fill="none" stroke="#fff" strokeWidth={1.2} opacity={0.8} />
    </pattern>
    <filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="5" result="b" />
      <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
    </filter>
  </defs>
);
export const fills = {
  concrete: "url(#p-concrete)", soil: "url(#p-soil)", insulation: "url(#p-insulation)", tile: "url(#p-tile)",
  hatch: "url(#p-hatch)", water: "url(#p-water)", steel: brand.steel, glass: brand.glass, ground: brand.paper2,
  paper: brand.paper, epoxy: "#D7CBB0",
} as const;
