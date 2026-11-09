/**
 * Brand tokens.
 * `accent` and `ink` are the two colours printed in the DCP logo SVG (assets/brand/dcp_logo.svg).
 * Everything else is a NEUTRAL PLACEHOLDER palette until DCP supplies brand colours (brief §7).
 */
export const brand = {
  accent: "#F06C38", // DCP logo orange — used only for zone highlight + brand marks
  ink: "#211D22", // DCP logo near-black — linework and text
  paper: "#F6F3EE",
  paper2: "#ECE7DF",
  grid: "#D9D2C7",
  muted: "#6B646C",
  pendingFill: "#CFCBC4",
  pendingInk: "#4A454C",
  // Section-hatch fills (standard drawing conventions)
  concrete: "#E6E1D8",
  soil: "#D9CDB9",
  steel: "#3B3A44",
  insulation: "#F1E7A9",
  water: "#8DB9D8",
  rust: "#A8532B",
  glass: "#CFE3EA",
} as const;

/** One colour per product family — identical in every scene and layer stack (brief §7). */
export const families = {
  spray: { color: "#2F6DB5", key: "family.spray" },
  sheet: { color: "#2E8B6F", key: "family.sheet" },
  liquid: { color: "#7A5BC4", key: "family.liquid" },
  epoxy: { color: "#B8892B", key: "family.epoxy" },
  cement: { color: "#6F7C88", key: "family.cement" },
  coating: { color: "#C0495B", key: "family.coating" },
  accessory: { color: "#3E9AA8", key: "family.accessory" },
} as const;
export type Family = keyof typeof families;

const FAMILY_OF: Record<string, Family> = {
  "PU-P150": "spray", "PU-P100": "spray", "PU-P60": "spray", "PU-H50": "spray",
  "PU-C100": "liquid", "AQUATHANE-R100": "liquid", "AQUATHANE-E400": "liquid",
  HS: "sheet", FB: "sheet", "FB-S": "sheet", L: "sheet", R: "sheet",
  EPW: "epoxy", "EPW-P": "epoxy", "EPW-S": "epoxy", EN100: "epoxy",
  "SETSEAL-300C": "cement", "SETSEAL-R": "cement",
  REPCOAT: "coating", "REPCOAT-FF": "coating", "REPCOAT-FF-PLUS": "coating", "REPCOAT-S": "coating",
  "REPCOAT-P": "coating", AL: "coating",
  "HYDROSTOP-HW": "accessory", "HYPERSEAL-DP2010H": "accessory",
  "PRIMER-EP": "accessory", "PRIMER-PU": "accessory", "PRIMER-PU1000": "accessory",
  "DONPROOF-DPM": "accessory", "STRONGCOAT-DPM": "accessory", "REPCOAT-P-PRIMER": "accessory",
};
export const familyOf = (pid: string): Family => {
  const f = FAMILY_OF[pid];
  if (!f) throw new Error(`No product family for ${pid}`);
  return f;
};
export const colorOf = (pid: string) => families[familyOf(pid)].color;

export const font = {
  latin: "'Inter', system-ui, sans-serif",
  arabic: "'Noto Sans Arabic', 'Inter', system-ui, sans-serif",
} as const;
export const type = {
  body: 36, // brief §7: body text >= 36 px at 1080p
  label: 40,
  title: 64,
  footnote: 24, // the one "small" element
} as const;
export const stroke = { thin: 1.5, base: 2, heavy: 3.5 } as const;
