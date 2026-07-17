import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { en, translations, type TranslationKey } from "./translations";

export type Lang = "en" | "es";

const storageKey = "recruiting.lang";

type I18nContextValue = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: TranslationKey) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

function detectInitialLang(): Lang {
  const stored = window.localStorage.getItem(storageKey);
  if (stored === "en" || stored === "es") {
    return stored;
  }

  return window.navigator.language.toLowerCase().startsWith("es") ? "es" : "en";
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => detectInitialLang());

  const setLang = useCallback((nextLang: Lang) => {
    setLangState(nextLang);
    window.localStorage.setItem(storageKey, nextLang);
  }, []);

  const t = useCallback(
    (key: TranslationKey) => translations[lang][key] ?? en[key],
    [lang],
  );

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);

  if (!context) {
    throw new Error("useI18n must be used inside I18nProvider");
  }

  return context;
}
