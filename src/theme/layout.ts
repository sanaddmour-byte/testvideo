import { HEIGHT, WIDTH } from "../config";

/** 5% title-safe margins; the lower third is kept free for captions (brief §7). */
export const safe = {
  x: Math.round(WIDTH * 0.05),
  y: Math.round(HEIGHT * 0.05),
} as const;
export const lowerThirdTop = Math.round(HEIGHT * (1 - 0.2)); // 864: nothing but the footnote below this line
export const content = {
  left: safe.x,
  right: WIDTH - safe.x,
  top: safe.y,
  bottom: lowerThirdTop - 24,
  width: WIDTH - 2 * safe.x,
  height: lowerThirdTop - 24 - safe.y,
} as const;
