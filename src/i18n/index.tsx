import React, { createContext, useContext } from "react";
import en from "./en.json";
import ar from "./ar.json";
import { DEFAULT_LANG, Lang } from "../config";
import { brand, font } from "../theme/brand";

const dicts = { en, ar } as const;

type Dict = Record<string, unknown>;
const dig = (d: Dict, path: string): string | undefined => {
  let cur: unknown = d;
  for (const part of path.split(".")) {
    if (cur && typeof cur === "object" && part in (cur as Dict)) cur = (cur as Dict)[part];
    else return undefined;
  }
  return typeof cur === "string" ? cur : undefined;
};

export const translate = (lang: Lang, key: string, vars?: Record<string, string>): string => {
  // Empty ar.json values fall back to English so a partial translation still renders.
  const raw = dig(dicts[lang] as Dict, key) || dig(en as Dict, key);
  if (raw === undefined) throw new Error(`Missing i18n key: ${key}`);
  return vars ? raw.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? `{${k}}`) : raw;
};

const Ctx = createContext<Lang>(DEFAULT_LANG);
export const LangProvider: React.FC<{ lang: Lang; children: React.ReactNode }> = ({ lang, children }) => (
  <Ctx.Provider value={lang}>
    <div style={{ position: "absolute", inset: 0, background: brand.paper, direction: lang === "ar" ? "rtl" : "ltr", fontFamily: lang === "ar" ? font.arabic : font.latin }}>{children}</div>
  </Ctx.Provider>
);
export const useLang = () => useContext(Ctx);
export const useDir = () => (useContext(Ctx) === "ar" ? "rtl" : "ltr");
export const useT = () => {
  const lang = useContext(Ctx);
  return (key: string, vars?: Record<string, string>) => translate(lang, key, vars);
};
