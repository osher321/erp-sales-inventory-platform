import { NavLink } from "react-router-dom";
import { NAV_ITEMS } from "./navigation";
import { useLanguage } from "../../i18n/LanguageContext";

interface SidebarProps {
  isOpen: boolean;
  onNavigate: () => void;
}

export function Sidebar({ isOpen, onNavigate }: SidebarProps) {
  const { t } = useLanguage();

  return (
    <>
      {isOpen && (
        <button
          type="button"
          aria-label={t("nav.closeNavigation")}
          onClick={onNavigate}
          className="fixed inset-0 z-30 bg-slate-900/50 lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 start-0 z-40 flex w-64 shrink-0 transform flex-col bg-slate-900 transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full rtl:translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center gap-2 border-b border-slate-800 px-5">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-indigo-500 text-sm font-bold text-white">
            E
          </span>
          <span className="text-sm font-semibold leading-tight text-white">
            {t("nav.appName")}
          </span>
        </div>

        <nav aria-label={t("nav.mainNavigation")} className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onNavigate}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-indigo-500/15 text-white"
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                }`
              }
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {t(item.labelKey)}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-slate-800 px-5 py-4 text-xs text-slate-500">
          ERP Sales &amp; Inventory Integration Platform
        </div>
      </aside>
    </>
  );
}
