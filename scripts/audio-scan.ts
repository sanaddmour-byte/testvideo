// Writes src/generated/audioManifest.json so the composition only mounts <Audio> for files that exist.
import { existsSync, writeFileSync } from "node:fs";
const m = { music: existsSync("public/audio/music.mp3"), vo: existsSync("public/audio/vo_en.mp3") };
writeFileSync("src/generated/audioManifest.json", JSON.stringify(m) + "\n");
console.log("audio slots:", m);
