import { Easing, interpolate, spring, SpringConfig } from "remotion";
import { FPS } from "../config";

/** All easing + timing tokens live here so every scene moves the same way (brief §2). */
export const springs: Record<"soft" | "snappy" | "settle", Partial<SpringConfig>> = {
  soft: { damping: 200 },
  snappy: { damping: 22, stiffness: 190, mass: 0.9 },
  settle: { damping: 16, stiffness: 120 },
};

export const ease = {
  out: Easing.bezier(0.16, 1, 0.3, 1),
  inOut: Easing.bezier(0.65, 0, 0.35, 1),
  linear: Easing.linear,
} as const;

export const frames = {
  quick: 9,
  base: 18,
  slow: 36,
  stagger: 4,
  /** every data label holds on screen for at least 2.5 s (brief §7) */
  minLabelHold: Math.round(2.5 * FPS),
} as const;

/** 0→1 progress over `len` frames starting at `start`. */
export const prog = (frame: number, start: number, len: number, easing: (t: number) => number = ease.out) =>
  interpolate(frame, [start, start + len], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing });

/** Spring 0→1 starting at `start`. */
export const pop = (frame: number, start: number, kind: keyof typeof springs = "snappy") =>
  spring({ frame: frame - start, fps: FPS, config: springs[kind] });

export const sec = (s: number) => Math.round(s * FPS);
