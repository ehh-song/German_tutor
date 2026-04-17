export const SUPPORTED_LANGUAGES = {
  de: { name: "German",   nativeName: "Deutsch",  flag: "🇩🇪" },
  fr: { name: "French",   nativeName: "Français", flag: "🇫🇷" },
  es: { name: "Spanish",  nativeName: "Español",  flag: "🇪🇸" },
  it: { name: "Italian",  nativeName: "Italiano", flag: "🇮🇹" },
  ja: { name: "Japanese", nativeName: "日本語",   flag: "🇯🇵" },
  zh: { name: "Chinese",  nativeName: "中文",     flag: "🇨🇳" },
  ko: { name: "Korean",   nativeName: "한국어",   flag: "🇰🇷" },
} as const;

export type LanguageCode = keyof typeof SUPPORTED_LANGUAGES;

export function isValidLanguage(lang: string): lang is LanguageCode {
  return lang in SUPPORTED_LANGUAGES;
}

export function getLanguage(lang: string): (typeof SUPPORTED_LANGUAGES)[LanguageCode] | null {
  if (isValidLanguage(lang)) return SUPPORTED_LANGUAGES[lang];
  return null;
}
