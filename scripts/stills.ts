// Renders key-frame stills to qa/stills. Usage: tsx scripts/stills.ts [compositionId ...]
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { CHAPTER_STILLS } from "./stillsPlan";

const BROWSER = "/opt/pw-browsers/chromium";
const want = process.argv.slice(2);
const main = async () => {
  mkdirSync("qa/stills", { recursive: true });
  const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts"), onProgress: () => undefined });
  for (const [id, frames] of Object.entries(CHAPTER_STILLS)) {
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
