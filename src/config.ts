// Project-wide switches. Change here only; scenes never hard-code these.

/** Epoxy primers are moving from Strongcoat into DonProof. "legacy" until the client confirms (brief §4). */
export const PRIMER_NAMING: "legacy" | "donproof" = "legacy";

export const FPS = 30;
export const WIDTH = 1920;
export const HEIGHT = 1080;

/** UI language. "ar" flips layouts to RTL and reads src/i18n/ar.json (falls back to en for empty keys). */
export type Lang = "en" | "ar";
export const DEFAULT_LANG: Lang = "en";
