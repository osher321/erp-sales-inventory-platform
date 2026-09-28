import { useNavigate } from "react-router-dom";
import type { ComponentType, SVGProps } from "react";
import { CustomersIcon, InventoryIcon, OrdersIcon, ProductsIcon } from "../icons";
import { useLanguage } from "../../i18n/LanguageContext";

interface QuickAction {
  labelKey: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  to: string;
  openCreate?: boolean;
}

const ACTIONS: QuickAction[] = [
  { labelKey: "dashboard.quickActions.newCustomer", icon: CustomersIcon, to: "/customers", openCreate: true },
  { labelKey: "dashboard.quickActions.newProduct", icon: ProductsIcon, to: "/products", openCreate: true },
  { labelKey: "dashboard.quickActions.newSalesOrder", icon: OrdersIcon, to: "/orders", openCreate: true },
  { labelKey: "dashboard.quickActions.viewInventory", icon: InventoryIcon, to: "/inventory" },
];

export function QuickActions() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {ACTIONS.map((action) => (
        <button
          key={action.labelKey}
          type="button"
          onClick={() => navigate(action.to, action.openCreate ? { state: { openCreate: true } } : undefined)}
          className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-start shadow-sm transition-colors hover:border-indigo-300 hover:bg-indigo-50/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
            <action.icon className="h-5 w-5" />
          </span>
          <span className="text-sm font-medium text-slate-900">{t(action.labelKey)}</span>
        </button>
      ))}
    </div>
  );
}
