import { useState } from "react";
import type { FormEvent } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { ApiError } from "../api/httpClient";
import { useLanguage } from "../i18n/LanguageContext";
import { LanguageSwitcher } from "../components/layout/LanguageSwitcher";

export default function LoginPage() {
  const { isAuthenticated, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});

  if (isAuthenticated) {
    const redirectTo = (location.state as { from?: { pathname: string } } | null)?.from?.pathname ?? "/dashboard";
    return <Navigate to={redirectTo} replace />;
  }

  function validate(): boolean {
    const errors: { email?: string; password?: string } = {};
    if (!email.trim()) errors.email = t("auth.login.emailRequired");
    else if (!/^\S+@\S+\.\S+$/.test(email)) errors.email = t("auth.login.emailInvalid");
    if (!password) errors.password = t("auth.login.passwordRequired");
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    if (!validate()) return;

    setSubmitting(true);
    try {
      await login(email, password);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      const message = err instanceof ApiError ? err.message : t("auth.login.genericError");
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-4 flex justify-center">
          <LanguageSwitcher />
        </div>
        <div className="mb-8 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-lg font-bold text-white">
            E
          </span>
          <h1 className="mt-4 text-xl font-semibold text-slate-900">{t("auth.appName")}</h1>
          <p className="mt-1 text-sm text-slate-500">{t("auth.login.subtitle")}</p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          {error && (
            <div role="alert" className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="mb-4">
            <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-700">
              {t("auth.login.emailLabel")}
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={Boolean(fieldErrors.email)}
              aria-describedby={fieldErrors.email ? "email-error" : undefined}
              className={`block w-full rounded-md border px-3 py-2 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                fieldErrors.email ? "border-red-300" : "border-slate-300"
              }`}
              placeholder="demo@example.com"
            />
            {fieldErrors.email && (
              <p id="email-error" className="mt-1 text-xs text-red-600">
                {fieldErrors.email}
              </p>
            )}
          </div>

          <div className="mb-6">
            <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-slate-700">
              {t("auth.login.passwordLabel")}
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-invalid={Boolean(fieldErrors.password)}
              aria-describedby={fieldErrors.password ? "password-error" : undefined}
              className={`block w-full rounded-md border px-3 py-2 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                fieldErrors.password ? "border-red-300" : "border-slate-300"
              }`}
              placeholder="••••••••"
            />
            {fieldErrors.password && (
              <p id="password-error" className="mt-1 text-xs text-red-600">
                {fieldErrors.password}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
            {isSubmitting ? t("auth.login.signingIn") : t("auth.login.signIn")}
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-slate-400">
          {t("auth.login.demoAccount")} <span className="font-medium text-slate-500">demo@example.com</span>
        </p>

        <p className="mt-4 text-center text-sm text-slate-500">
          {t("auth.login.noAccount")}{" "}
          <Link to="/register" className="font-medium text-indigo-600 hover:text-indigo-500">
            {t("auth.login.createAccount")}
          </Link>
        </p>
      </div>
    </div>
  );
}
