import { useAuth } from "../../auth/AuthContext";
import { getInitials } from "../../lib/format";
import { LogoutIcon, MenuIcon } from "../icons";
import { useLanguage } from "../../i18n/LanguageContext";
import { LanguageSwitcher } from "./LanguageSwitcher";

interface HeaderProps {
  onOpenSidebar: () => void;
}

export function Header({ onOpenSidebar }: HeaderProps) {
  const { user, logout } = useAuth();
  const { t } = useLanguage();

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onOpenSidebar}
          aria-label={t("nav.openNavigation")}
          className="shrink-0 rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 lg:hidden"
        >
          <MenuIcon className="h-5 w-5" />
        </button>
        <h1 className="truncate text-sm font-semibold text-slate-900 sm:text-base">
          {t("header.title")}
        </h1>
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-4">
        <LanguageSwitcher />
        {user && (
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700">
              {getInitials(user.name)}
            </span>
            <div className="hidden text-start sm:block">
              <p className="text-sm font-medium leading-tight text-slate-900">{user.name}</p>
              <p className="text-xs leading-tight text-slate-500">{user.email}</p>
            </div>
          </div>
        )}
        <button
          type="button"
          onClick={logout}
          className="flex items-center gap-1.5 rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        >
          <LogoutIcon className="h-4 w-4" />
          <span className="hidden sm:inline">{t("header.logout")}</span>
        </button>
      </div>
    </header>
  );
}
