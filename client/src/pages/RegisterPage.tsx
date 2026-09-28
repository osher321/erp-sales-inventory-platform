import { useState } from "react";
import type { FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { ApiError } from "../api/httpClient";
import { useToast } from "../components/ui/Toast";
import { useLanguage } from "../i18n/LanguageContext";
import { LanguageSwitcher } from "../components/layout/LanguageSwitcher";

interface FieldErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

export default function RegisterPage() {
  const { isAuthenticated, register } = useAuth();
  const navigate = useNavigate();
  const { showSuccess } = useToast();
  const { t } = useLanguage();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  function validate(): boolean {
    const errors: FieldErrors = {};
    if (!name.trim()) errors.name = t("auth.register.fullNameRequired");
    if (!email.trim()) errors.email = t("auth.register.emailRequired");
    else if (!/^\S+@\S+\.\S+$/.test(email)) errors.email = t("auth.register.emailInvalid");
    if (!password) errors.password = t("auth.register.passwordRequired");
    else if (password.length < 8) errors.password = t("auth.register.passwordTooShort");
    if (!confirmPassword) errors.confirmPassword = t("auth.register.confirmPasswordRequired");
    else if (confirmPassword !== password) errors.confirmPassword = t("auth.register.passwordMismatch");
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    if (!validate()) return;

    setSubmitting(true);
    try {
      await register(name.trim(), email.trim(), password);
      showSuccess(t("auth.register.successMessage"));
      navigate("/dashboard", { replace: true });
    } catch (err) {
      const message = err instanceof ApiError ? err.message : t("auth.register.genericError");
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
          <p className="mt-1 text-sm text-slate-500">{t("auth.register.subtitle")}</p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          {error && (
            <div role="alert" className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="mb-4">
            <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-slate-700">
              {t("auth.register.fullNameLabel")}
            </label>
            <input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              aria-invalid={Boolean(fieldErrors.name)}
              aria-describedby={fieldErrors.name ? "name-error" : undefined}
              className={`block w-full rounded-md border px-3 py-2 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                fieldErrors.name ? "border-red-300" : "border-slate-300"
              }`}
              placeholder={t("auth.register.fullNamePlaceholder")}
            />
            {fieldErrors.name && (
              <p id="name-error" className="mt-1 text-xs text-red-600">
                {fieldErrors.name}
              </p>
            )}
          </div>

          <div className="mb-4">
            <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-700">
              {t("auth.register.emailLabel")}
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
              placeholder="jane.doe@example.com"
            />
            {fieldErrors.email && (
              <p id="email-error" className="mt-1 text-xs text-red-600">
                {fieldErrors.email}
              </p>
            )}
          </div>

          <div className="mb-4">
            <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-slate-700">
              {t("auth.register.passwordLabel")}
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-invalid={Boolean(fieldErrors.password)}
              aria-describedby={fieldErrors.password ? "password-error" : undefined}
              className={`block w-full rounded-md border px-3 py-2 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                fieldErrors.password ? "border-red-300" : "border-slate-300"
              }`}
              placeholder={t("auth.register.passwordPlaceholder")}
            />
            {fieldErrors.password && (
              <p id="password-error" className="mt-1 text-xs text-red-600">
                {fieldErrors.password}
              </p>
            )}
          </div>

          <div className="mb-6">
            <label htmlFor="confirmPassword" className="mb-1.5 block text-sm font-medium text-slate-700">
              {t("auth.register.confirmPasswordLabel")}
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              aria-invalid={Boolean(fieldErrors.confirmPassword)}
              aria-describedby={fieldErrors.confirmPassword ? "confirmPassword-error" : undefined}
              className={`block w-full rounded-md border px-3 py-2 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                fieldErrors.confirmPassword ? "border-red-300" : "border-slate-300"
              }`}
              placeholder="••••••••"
            />
            {fieldErrors.confirmPassword && (
              <p id="confirmPassword-error" className="mt-1 text-xs text-red-600">
                {fieldErrors.confirmPassword}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
            {isSubmitting ? t("auth.register.creatingAccount") : t("auth.register.createAccountBtn")}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-slate-500">
          {t("auth.register.alreadyHaveAccount")}{" "}
          <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
            {t("auth.register.signIn")}
          </Link>
        </p>
      </div>
    </div>
  );
}
