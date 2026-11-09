// `npm run render:master` / `npm run render:chapters` — 1920×1080, 30 fps, H.264. Chapter markers are muxed in with ffmpeg.
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition, getCompositions } from "@remotion/renderer";
import { execFileSync } from "node:child_process";
import { copyFileSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import timeline from "../data/timeline.json" with { type: "json" };

const BROWSER = "/opt/pw-browsers/chromium";
const mode = process.argv[2];
const titles: Record<string, string> = JSON.parse(JSON.stringify((await import("../src/i18n/en.json", { with: { type: "json" } })).default.chapters));

const addChapters = (src: string, dst: string, list: { id: string; start: number; dur: number }[]) => {
  const meta = [";FFMETADATA1", ...list.flatMap((c) => ["[CHAPTER]", "TIMEBASE=1/1000", `START=${Math.round(c.start * 1000)}`, `END=${Math.round((c.start + c.dur) * 1000) - 1}`, `title=${titles[c.id] ?? c.id}`])].join("\n");
  const mf = dst + ".meta.txt";
  writeFileSync(mf, meta);
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", src, "-i", mf, "-map", "0:v", "-map", "0:a?", "-map_metadata", "1", "-map_chapters", "1", "-codec", "copy", "-movflags", "+faststart", dst]);
  rmSync(mf); rmSync(src);
};

const main = async () => {
  mkdirSync("out/chapters", { recursive: true });
  mkdirSync("out/captions", { recursive: true });
  const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts"), onProgress: () => undefined });
  const comps = await getCompositions(serveUrl, { browserExecutable: BROWSER });
  const built = comps.map((c) => c.id).filter((id) => /^Ch\d+$/.test(id));
  const render = async (id: string, out: string) => {
    const composition = await selectComposition({ serveUrl, id, browserExecutable: BROWSER });
    console.log(`rendering ${id} (${composition.durationInFrames} frames)…`);
    await renderMedia({ composition, serveUrl, codec: "h264", pixelFormat: "yuv420p", outputLocation: out, browserExecutable: BROWSER, concurrency: 4, imageFormat: "png", crf: 18, onProgress: (() => { let last = -1; return ({ progress }: { progress: number }) => { const p = Math.floor(progress * 10); if (p !== last) { last = p; process.stdout.write(`  ${p * 10}%`); } }; })() });
    process.stdout.write("\n");
  };
  if (mode === "chapters") {
    for (const id of (process.argv[3] ? [process.argv[3]] : built)) {
      const c = timeline.chapters.find((x) => x.id === id)!;
      await render(id, `out/chapters/${id}.raw.mp4`);
      addChapters(`out/chapters/${id}.raw.mp4`, `out/chapters/${id}.mp4`, [{ id, start: 0, dur: c.dur }]);
      copyFileSync(`script/captions/${id}_en.srt`, `out/captions/${id}_en.srt`);
    }
  } else if (mode === "master") {
    await render("Master", "out/master.raw.mp4");
    addChapters("out/master.raw.mp4", "out/master.mp4", timeline.chapters.filter((c) => built.includes(c.id)));
    copyFileSync("script/captions_en.srt", "out/captions/master_en.srt");
  } else throw new Error("usage: tsx scripts/render.ts master|chapters");
};
main().catch((e) => { console.error(e); process.exit(1); });
