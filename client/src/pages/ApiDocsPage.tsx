import { DocsIcon } from "../components/icons";
import { useLanguage } from "../i18n/LanguageContext";

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

export default function ApiDocsPage() {
  const { t } = useLanguage();

  return (
    <div className="mx-auto flex max-w-7xl flex-col">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-slate-900">{t("apiDocs.title")}</h2>
        <p className="mt-1 text-sm text-slate-500">{t("apiDocs.subtitle")}</p>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-slate-200 bg-white px-6 py-20 text-center shadow-sm">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
          <DocsIcon className="h-7 w-7" />
        </span>
        <h3 className="mt-4 text-base font-semibold text-slate-900">{t("apiDocs.swaggerTitle")}</h3>
        <p className="mt-2 max-w-sm text-sm text-slate-500">
          {t("apiDocs.description", { path: "/api-docs" })}
        </p>
        <a
          href={`${API_BASE_URL}/api-docs`}
          target="_blank"
          rel="noreferrer"
          className="mt-5 inline-flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
        >
          {t("apiDocs.openButton")}
        </a>
      </div>
    </div>
  );
}
