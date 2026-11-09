import React from "react";
import { Audio, Composition, Sequence, staticFile } from "remotion";
import { DEFAULT_LANG, FPS, HEIGHT, Lang, WIDTH } from "./config";
import { LangProvider } from "./i18n";
import { chapter, chapterFrames, timeline } from "./data/timeline";
import { Ch0Cold } from "./chapters/Ch0Cold";
import { Ch1Map } from "./chapters/Ch1Map";
import { LookBars, LookLayers, LookMatrix, LookTable } from "./LookDev";
import audio from "./generated/audioManifest.json";

type Props = { lang: Lang };

/** Chapters built so far, in order. Add each new chapter here (and nowhere else) — Master and per-chapter compositions follow. */
export const CHAPTERS: { id: string; C: React.FC }[] = [
  { id: "Ch0", C: Ch0Cold },
  { id: "Ch1", C: Ch1Map },
];

// One music slot + one voiceover slot. The film renders cleanly when the files are absent (audioManifest.json is written by `npm run audio:scan`).
const Slots: React.FC<{ offsetFrames: number }> = ({ offsetFrames }) => (
  <>
    {audio.music && <Audio src={staticFile("audio/music.mp3")} volume={0.18} loop />}
    {audio.vo && <Audio src={staticFile("audio/vo_en.mp3")} startFrom={offsetFrames} />}
  </>
);

const wrap = (C: React.FC) => ({ lang }: Props) => (<LangProvider lang={lang}><C /></LangProvider>);

const ChapterComp = (id: string, C: React.FC) => ({ lang }: Props) => (
  <LangProvider lang={lang}>
    <C />
    <Slots offsetFrames={Math.round(chapter(id).start * FPS)} />
  </LangProvider>
);

const Master: React.FC<Props> = ({ lang }) => (
  <LangProvider lang={lang}>
    {CHAPTERS.map(({ id, C }) => (
      <Sequence key={id} from={Math.round(chapter(id).start * FPS)} durationInFrames={chapterFrames(id)} name={id}><C /></Sequence>
    ))}
    <Slots offsetFrames={0} />
  </LangProvider>
);

export const masterFrames = () => {
  const last = CHAPTERS[CHAPTERS.length - 1].id;
  return Math.round((chapter(last).start + chapter(last).dur) * FPS);
};

export const Root: React.FC = () => {
  const common = { fps: FPS, width: WIDTH, height: HEIGHT, defaultProps: { lang: DEFAULT_LANG } as Props };
  return (
    <>
      {CHAPTERS.map(({ id, C }) => (
        <Composition key={id} id={id} component={ChapterComp(id, C)} durationInFrames={chapterFrames(id)} {...common} />
      ))}
      <Composition id="Master" component={Master} durationInFrames={masterFrames()} {...common} />
      <Composition id="Look-Layers" component={wrap(LookLayers)} durationInFrames={240} {...common} />
      <Composition id="Look-Bars" component={wrap(LookBars)} durationInFrames={120} {...common} />
      <Composition id="Look-Table" component={wrap(LookTable)} durationInFrames={120} {...common} />
      <Composition id="Look-Matrix" component={wrap(LookMatrix)} durationInFrames={150} {...common} />
    </>
  );
};
export const totalPlanned = timeline.total;
