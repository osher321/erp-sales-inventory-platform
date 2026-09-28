import { useLanguage } from "../../i18n/LanguageContext";

export function LanguageSwitcher({ className = "" }: { className?: string }) {
  const { language, setLanguage, t } = useLanguage();

  return (
    <div
      role="group"
      aria-label={t("language.label")}
      className={`inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white p-0.5 ${className}`}
    >
      <button
        type="button"
        onClick={() => setLanguage("en")}
        aria-pressed={language === "en"}
        title="English"
        className={`whitespace-nowrap rounded px-2 py-1 text-xs font-medium transition-colors ${
          language === "en"
            ? "bg-indigo-500 text-white"
            : "text-slate-600 hover:bg-slate-100"
        }`}
      >
        <span aria-hidden="true">🇬🇧</span> <span className="hidden sm:inline">English</span>
      </button>
      <button
        type="button"
        onClick={() => setLanguage("he")}
        aria-pressed={language === "he"}
        title="עברית"
        className={`whitespace-nowrap rounded px-2 py-1 text-xs font-medium transition-colors ${
          language === "he"
            ? "bg-indigo-500 text-white"
            : "text-slate-600 hover:bg-slate-100"
        }`}
      >
        <span aria-hidden="true">🇮🇱</span> <span className="hidden sm:inline">עברית</span>
      </button>
    </div>
  );
}
