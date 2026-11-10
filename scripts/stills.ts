// Renders key-frame stills to qa/stills. Usage: tsx scripts/stills.ts [compositionId ...]
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { readFileSync } from "node:fs";
import { CHAPTER_STILLS } from "./stillsPlan";

// Chapters Ch2+ : one key frame per scene (a late frame inside each beat, so builds have finished).
const timeline = JSON.parse(readFileSync("data/timeline.json", "utf8")) as { chapters: { id: string; start: number }[]; beats: { ch: string; start: number; dur: number }[] };
const plan: Record<string, number[]> = { ...CHAPTER_STILLS };
for (const c of timeline.chapters) {
  if (c.id in plan) continue;
  plan[c.id] = timeline.beats.filter((b) => b.ch === c.id).map((b) => Math.round((b.start - c.start + b.dur * 0.82) * 30));
}

const BROWSER = "/opt/pw-browsers/chromium";
for (const c of timeline.chapters) if (/^Ch[2-8]$/.test(c.id)) plan[`V-${c.id}`] = plan[c.id];
plan["V-Overview"] = [60, 190, 330, 480, 580, 700, 820, 960, 1060];
plan["V-Selector"] = [60, 200, 380, 560, 700, 880, 1000];
const want = process.argv.slice(2);
const main = async () => {
  mkdirSync("qa/stills", { recursive: true });
  const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts"), onProgress: () => undefined });
  for (const [id, frames] of Object.entries(plan)) {
    if (want.length && !want.includes(id)) continue;
    const comp = await selectComposition({ serveUrl, id, browserExecutable: BROWSER });
    for (const fr of frames) {
      const frame = Math.min(comp.durationInFrames - 1, typeof fr === "number" ? fr : Math.round(fr * comp.fps));
      const out = `qa/stills/${id}_f${String(frame).padStart(4, "0")}.png`;
      await renderStill({ composition: comp, serveUrl, output: out, frame, browserExecutable: BROWSER, scale: 1, imageFormat: "png" });
      console.log("wrote", out);
    }
  }
};
main().catch((e) => { console.error(e); process.exit(1); });
