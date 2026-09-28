import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { en } from "./translations/en";
import { he } from "./translations/he";

export type Language = "en" | "he";

const STORAGE_KEY = "erp.language";

const dictionaries = { en, he } as const;

function getDirection(language: Language): "ltr" | "rtl" {
  return language === "he" ? "rtl" : "ltr";
}

function getStoredLanguage(): Language {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "en" || stored === "he") return stored;
  } catch {
    // localStorage unavailable — fall back to default
  }
  return "en";
}

function resolvePath(source: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, key) => {
    if (acc && typeof acc === "object" && key in acc) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, source);
}

function interpolate(template: string, params?: Record<string, string | number>): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in params ? String(params[key]) : match,
  );
}

type TranslateFn = (key: string, params?: Record<string, string | number>) => string;

interface LanguageContextValue {
  language: Language;
  setLanguage: (language: Language) => void;
  dir: "ltr" | "rtl";
  t: TranslateFn;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => getStoredLanguage());

  useEffect(() => {
    document.documentElement.dir = getDirection(language);
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = useCallback((next: Language) => {
    setLanguageState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // localStorage unavailable — language choice will not persist across refresh
    }
  }, []);

  const t = useCallback<TranslateFn>(
    (key, params) => {
      const value = resolvePath(dictionaries[language], key);
      if (typeof value === "string") return interpolate(value, params);
      const fallback = resolvePath(dictionaries.en, key);
      if (typeof fallback === "string") return interpolate(fallback, params);
      return key;
    },
    [language],
  );

  const value = useMemo<LanguageContextValue>(
    () => ({ language, setLanguage, dir: getDirection(language), t }),
    [language, setLanguage, t],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within a LanguageProvider");
  return ctx;
}
