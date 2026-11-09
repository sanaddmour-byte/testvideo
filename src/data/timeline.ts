import raw from "../../data/timeline.json";
import { FPS } from "../config";

export type Beat = { ch: string; id: string; start: number; dur: number; on: string; vo: string; keys: string[] };
export const timeline = raw as unknown as { fps: number; total: number; chapters: { id: string; start: number; dur: number }[]; beats: Beat[] };
export const chapterBeats = (ch: string) => timeline.beats.filter((b) => b.ch === ch);
export const chapter = (ch: string) => {
  const c = timeline.chapters.find((x) => x.id === ch);
  if (!c) throw new Error(`Unknown chapter ${ch}`);
  return c;
};
/** frame offsets of each beat inside its chapter */
export const beatFrames = (ch: string) => {
  const c = chapter(ch);
  return chapterBeats(ch).map((b) => ({ ...b, from: Math.round((b.start - c.start) * FPS), len: Math.round(b.dur * FPS) }));
};
export const chapterFrames = (ch: string) => Math.round(chapter(ch).dur * FPS);
