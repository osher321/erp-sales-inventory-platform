import type { ComponentType, SVGProps } from "react";
import {
  CustomersIcon,
  DashboardIcon,
  DocsIcon,
  InventoryIcon,
  LogsIcon,
  OrdersIcon,
  PriorityIcon,
  ProductsIcon,
} from "../icons";

export interface NavItem {
  labelKey: string;
  to: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
}

export const NAV_ITEMS: NavItem[] = [
  { labelKey: "nav.dashboard", to: "/dashboard", icon: DashboardIcon },
  { labelKey: "nav.customers", to: "/customers", icon: CustomersIcon },
  { labelKey: "nav.products", to: "/products", icon: ProductsIcon },
  { labelKey: "nav.orders", to: "/orders", icon: OrdersIcon },
  { labelKey: "nav.inventory", to: "/inventory", icon: InventoryIcon },
  { labelKey: "nav.priority", to: "/priority", icon: PriorityIcon },
  { labelKey: "nav.apiLogs", to: "/api-logs", icon: LogsIcon },
  { labelKey: "nav.apiDocs", to: "/api-docs", icon: DocsIcon },
];
