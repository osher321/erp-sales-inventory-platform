import { Component } from "react";
import type { ReactNode } from "react";
import { AlertTriangleIcon } from "./icons";
import { useLanguage } from "../i18n/LanguageContext";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

function ErrorFallback() {
  const { t } = useLanguage();
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="flex w-full max-w-sm flex-col items-center gap-3 rounded-xl border border-red-200 bg-white p-8 text-center shadow-sm">
        <AlertTriangleIcon className="h-8 w-8 text-red-500" />
        <h1 className="text-lg font-semibold text-slate-900">{t("errorBoundary.title")}</h1>
        <p className="text-sm text-slate-500">{t("errorBoundary.description")}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
        >
          {t("errorBoundary.refresh")}
        </button>
      </div>
    </div>
  );
}

// Catches render-time exceptions anywhere below it (including ones triggered
// by DOM mutation outside React's control, e.g. browser translation tools)
// so a crash shows a recoverable screen instead of unmounting the whole app.
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, info: { componentStack?: string | null }) {
    console.error("Unhandled render error caught by ErrorBoundary:", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback />;
    }
    return this.props.children;
  }
}
