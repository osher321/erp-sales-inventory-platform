import type { ReactNode } from "react";
import type { HttpMethod, IntegrationEntityType, IntegrationSyncStatus, InventoryStatus, OrderStatus } from "../../types/api";
import { useLanguage } from "../../i18n/LanguageContext";

const ORDER_STATUS_STYLES: Record<OrderStatus, string> = {
  DRAFT: "bg-slate-100 text-slate-600 ring-slate-500/10",
  PENDING: "bg-amber-50 text-amber-700 ring-amber-600/20",
  CONFIRMED: "bg-blue-50 text-blue-700 ring-blue-600/20",
  SHIPPED: "bg-violet-50 text-violet-700 ring-violet-600/20",
  COMPLETED: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  CANCELLED: "bg-red-50 text-red-700 ring-red-600/20",
};

const INVENTORY_STATUS_STYLES: Record<InventoryStatus, string> = {
  IN_STOCK: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  LOW_STOCK: "bg-amber-50 text-amber-700 ring-amber-600/20",
  OUT_OF_STOCK: "bg-red-50 text-red-700 ring-red-600/20",
};

function BadgeBase({ className, children }: { className: string; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${className}`}
    >
      {children}
    </span>
  );
}

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const { t } = useLanguage();
  return <BadgeBase className={ORDER_STATUS_STYLES[status]}>{t(`orderStatus.${status}`)}</BadgeBase>;
}

export function InventoryStatusBadge({ status }: { status: InventoryStatus }) {
  const { t } = useLanguage();
  return <BadgeBase className={INVENTORY_STATUS_STYLES[status]}>{t(`stockStatus.${status}`)}</BadgeBase>;
}

const HTTP_METHOD_STYLES: Record<HttpMethod, string> = {
  GET: "bg-blue-50 text-blue-700 ring-blue-600/20",
  POST: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  PUT: "bg-amber-50 text-amber-700 ring-amber-600/20",
  PATCH: "bg-violet-50 text-violet-700 ring-violet-600/20",
  DELETE: "bg-red-50 text-red-700 ring-red-600/20",
};

export function HttpMethodBadge({ method }: { method: HttpMethod }) {
  return <BadgeBase className={`font-mono ${HTTP_METHOD_STYLES[method]}`}>{method}</BadgeBase>;
}

export function ApiOutcomeBadge({ statusCode }: { statusCode: number }) {
  const { t } = useLanguage();
  const isSuccess = statusCode < 400;
  return (
    <BadgeBase className={isSuccess ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20" : "bg-red-50 text-red-700 ring-red-600/20"}>
      {statusCode} {isSuccess ? t("integrationStatus.SUCCESS") : t("integrationStatus.FAILED")}
    </BadgeBase>
  );
}

const INTEGRATION_SYNC_STATUS_STYLES: Record<IntegrationSyncStatus, string> = {
  SUCCESS: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  PARTIAL: "bg-amber-50 text-amber-700 ring-amber-600/20",
  FAILED: "bg-red-50 text-red-700 ring-red-600/20",
};

export function IntegrationSyncStatusBadge({ status }: { status: IntegrationSyncStatus }) {
  const { t } = useLanguage();
  return (
    <BadgeBase className={INTEGRATION_SYNC_STATUS_STYLES[status]}>
      {t(`integrationStatus.${status}`)}
    </BadgeBase>
  );
}

export function IntegrationEntityBadge({ entity }: { entity: IntegrationEntityType }) {
  const { t } = useLanguage();
  return <BadgeBase className="bg-slate-100 text-slate-600 ring-slate-500/10">{t(`integrationEntity.${entity}`)}</BadgeBase>;
}
