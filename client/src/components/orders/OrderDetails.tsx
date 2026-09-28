import { useState } from "react";
import * as ordersApi from "../../api/orders.api";
import { ApiError } from "../../api/httpClient";
import { OrderStatusBadge } from "../ui/Badge";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { useToast } from "../ui/Toast";
import { formatCurrency, formatDateTime } from "../../lib/format";
import { ORDER_STATUSES } from "../../lib/orderStatus";
import { useLanguage } from "../../i18n/LanguageContext";
import type { Order, OrderStatus } from "../../types/api";

interface OrderDetailsProps {
  order: Order;
  onStatusUpdated: (updated: Order) => void;
}

export function OrderDetails({ order, onStatusUpdated }: OrderDetailsProps) {
  const { showSuccess } = useToast();
  const { t } = useLanguage();
  const [pendingStatus, setPendingStatus] = useState<OrderStatus | "">("");
  const [isConfirmOpen, setConfirmOpen] = useState(false);
  const [isSubmitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirmStatusChange() {
    if (!pendingStatus) return;
    setSubmitting(true);
    setError(null);
    try {
      const updated = await ordersApi.updateOrderStatus(order.id, pendingStatus);
      onStatusUpdated(updated);
      showSuccess(
        t("orders.details.statusUpdatedToast", { orderNumber: order.orderNumber, status: t(`orderStatus.${pendingStatus}`) }),
      );
      setConfirmOpen(false);
      setPendingStatus("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("orders.details.failedToUpdate"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{t("orders.details.orderNumber")}</p>
          <p className="text-base font-semibold text-slate-900">{order.orderNumber}</p>
        </div>
        <div className="flex items-center gap-2">
          <OrderStatusBadge status={order.status} />
        </div>
      </div>

      {order.customer && (
        <div className="rounded-md bg-slate-50 px-4 py-3">
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-400">{t("orders.details.customer")}</p>
          <p className="text-sm font-medium text-slate-900">
            {order.customer.firstName} {order.customer.lastName}
          </p>
          <p className="text-xs text-slate-500">{order.customer.email} · {order.customer.phone}</p>
          <p className="text-xs text-slate-500">
            {order.customer.address}, {order.customer.city}
          </p>
        </div>
      )}

      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">{t("orders.details.orderItems")}</p>
        <div className="overflow-x-auto rounded-md border border-slate-200">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead>
              <tr className="text-start text-xs font-medium uppercase tracking-wide text-slate-500">
                <th scope="col" className="px-3 py-2">{t("orders.details.product")}</th>
                <th scope="col" className="px-3 py-2">{t("orders.details.sku")}</th>
                <th scope="col" className="px-3 py-2 text-right">{t("orders.details.quantity")}</th>
                <th scope="col" className="px-3 py-2 text-right">{t("orders.details.unitPrice")}</th>
                <th scope="col" className="px-3 py-2 text-right">{t("orders.details.subtotal")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {order.items?.map((item) => (
                <tr key={item.id}>
                  <td className="px-3 py-2 text-slate-700">{item.product?.name ?? t("common.emDash")}</td>
                  <td className="px-3 py-2 text-slate-500">{item.product?.sku ?? t("common.emDash")}</td>
                  <td className="px-3 py-2 text-right text-slate-700">{item.quantity}</td>
                  <td className="px-3 py-2 text-right text-slate-700">{formatCurrency(item.unitPrice)}</td>
                  <td className="px-3 py-2 text-right font-medium text-slate-900">{formatCurrency(item.subtotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-md bg-slate-50 px-4 py-3 text-sm">
        <div className="flex justify-between text-slate-600">
          <span>{t("orders.details.subtotal")}</span>
          <span>{formatCurrency(order.subtotal)}</span>
        </div>
        <div className="flex justify-between text-slate-600">
          <span>{t("orders.details.vat")}</span>
          <span>{formatCurrency(order.vatAmount)}</span>
        </div>
        <div className="mt-1 flex justify-between border-t border-slate-200 pt-1 font-semibold text-slate-900">
          <span>{t("orders.details.total")}</span>
          <span>{formatCurrency(order.total)}</span>
        </div>
      </div>

      <p className="text-xs text-slate-400">{t("orders.details.createdAt")} {formatDateTime(order.createdAt)}</p>

      <div className="border-t border-slate-200 pt-4">
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">{t("orders.details.updateStatusTitle")}</p>
        {error && (
          <div role="alert" className="mb-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}
        <div className="flex items-center gap-2">
          <label htmlFor="order-status-select" className="sr-only">
            {t("orders.details.newStatusSrLabel")}
          </label>
          <select
            id="order-status-select"
            value={pendingStatus}
            onChange={(e) => setPendingStatus(e.target.value as OrderStatus)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">{t("orders.details.selectNewStatus")}</option>
            {ORDER_STATUSES.map((status) => (
              <option key={status} value={status} disabled={status === order.status}>
                {t(`orderStatus.${status}`)}
                {status === order.status ? ` ${t("orders.details.current")}` : ""}
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={!pendingStatus}
            onClick={() => setConfirmOpen(true)}
            className="rounded-md bg-indigo-600 px-3.5 py-2 text-sm font-semibold text-white hover:bg-indigo-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {t("orders.details.updateStatusBtn")}
          </button>
        </div>
      </div>

      <ConfirmDialog
        isOpen={isConfirmOpen}
        title={t("orders.details.confirmTitle")}
        message={
          pendingStatus
            ? t("orders.details.confirmMessage", {
                orderNumber: order.orderNumber,
                from: t(`orderStatus.${order.status}`),
                to: t(`orderStatus.${pendingStatus}`),
              })
            : ""
        }
        confirmLabel={t("orders.details.updateStatusBtn")}
        isLoading={isSubmitting}
        onConfirm={handleConfirmStatusChange}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
