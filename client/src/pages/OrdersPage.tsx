import { useCallback, useEffect, useState } from "react";
import * as ordersApi from "../api/orders.api";
import type { OrderSortField } from "../api/orders.api";
import { ApiError } from "../api/httpClient";
import { CreateOrderForm } from "../components/orders/CreateOrderForm";
import { OrderDetails } from "../components/orders/OrderDetails";
import { PlusIcon, SearchIcon } from "../components/icons";
import { OrderStatusBadge } from "../components/ui/Badge";
import { Modal } from "../components/ui/Modal";
import { Pagination } from "../components/ui/Pagination";
import { Card, EmptyState, ErrorState, LoadingState } from "../components/ui/StateViews";
import { useToast } from "../components/ui/Toast";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { useOpenCreateFromNavigation } from "../hooks/useOpenCreateFromNavigation";
import { formatCurrency, formatDate } from "../lib/format";
import { ORDER_STATUSES } from "../lib/orderStatus";
import { useLanguage } from "../i18n/LanguageContext";
import type { Order, OrderListResult, OrderStatus } from "../types/api";

const PAGE_SIZE = 10;

const SORT_OPTIONS: { key: string; value: OrderSortField }[] = [
  { key: "sortCreatedAt", value: "createdAt" },
  { key: "sortTotal", value: "total" },
  { key: "sortOrderNumber", value: "orderNumber" },
];

export default function OrdersPage() {
  const { showSuccess, showError } = useToast();
  const { t } = useLanguage();

  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput, 350);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "ALL">("ALL");
  const [sortBy, setSortBy] = useState<OrderSortField>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const [data, setData] = useState<OrderListResult | null>(null);
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isCreateOpen, setCreateOpen] = useState(false);
  useOpenCreateFromNavigation(() => setCreateOpen(true));
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await ordersApi.listOrders({
        page,
        limit: PAGE_SIZE,
        search: debouncedSearch.trim() || undefined,
        status: statusFilter === "ALL" ? undefined : statusFilter,
        sortBy,
        sortOrder,
      });
      setData(result);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("orders.failedToLoad"));
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, statusFilter, sortBy, sortOrder, t]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter, sortBy, sortOrder]);

  async function handleCreateOrder(input: ordersApi.CreateOrderInput) {
    const created = await ordersApi.createOrder(input);
    setCreateOpen(false);
    showSuccess(t("orders.createdToast", { orderNumber: created.orderNumber }));
    await fetchOrders();
  }

  async function handleOpenOrder(orderId: string) {
    try {
      const order = await ordersApi.getOrderById(orderId);
      setSelectedOrder(order);
    } catch (err) {
      showError(err instanceof ApiError ? err.message : t("orders.failedToLoadDetails"));
    }
  }

  function handleStatusUpdated(updated: Order) {
    setSelectedOrder(updated);
    fetchOrders();
  }

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">{t("orders.title")}</h2>
          <p className="mt-1 text-sm text-slate-500">{t("orders.subtitle")}</p>
        </div>
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="flex items-center justify-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
        >
          <PlusIcon className="h-4 w-4" />
          {t("orders.createOrder")}
        </button>
      </div>

      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full max-w-sm">
          <label htmlFor="order-search" className="sr-only">
            {t("orders.searchLabel")}
          </label>
          <SearchIcon className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            id="order-search"
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder={t("orders.searchPlaceholder")}
            className="block w-full rounded-md border border-slate-300 py-2 ps-9 pe-3 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div>
            <label htmlFor="order-status-filter" className="sr-only">
              {t("orders.filterByStatusAriaLabel")}
            </label>
            <select
              id="order-status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as OrderStatus | "ALL")}
              className="rounded-md border border-slate-300 py-2 ps-3 pe-8 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">{t("orders.allStatuses")}</option>
              {ORDER_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {t(`orderStatus.${status}`)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="order-sort-by" className="sr-only">
              {t("orders.sortByLabel")}
            </label>
            <select
              id="order-sort-by"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as OrderSortField)}
              className="rounded-md border border-slate-300 py-2 ps-3 pe-8 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {t("orders.sortPrefix")} {t(`orders.${option.key}`)}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={() => setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))}
            aria-label={t("products.sortOrderAriaLabel", {
              order: sortOrder === "asc" ? t("products.sortAscending") : t("products.sortDescending"),
            })}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 shadow-sm hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            {sortOrder === "asc" ? `↑ ${t("orders.sortAsc")}` : `↓ ${t("orders.sortDesc")}`}
          </button>
        </div>
      </div>

      <Card>
        {isLoading && <LoadingState label={t("orders.loading")} />}

        {!isLoading && error && (
          <div className="p-2">
            <ErrorState message={error} onRetry={fetchOrders} />
          </div>
        )}

        {!isLoading && !error && data && data.orders.length === 0 && (
          <EmptyState
            title={debouncedSearch || statusFilter !== "ALL" ? t("orders.emptyFilteredTitle") : t("orders.emptyTitle")}
            description={debouncedSearch || statusFilter !== "ALL" ? t("orders.emptyFilteredDescription") : t("orders.emptyDescription")}
          />
        )}

        {!isLoading && !error && data && data.orders.length > 0 && (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead>
                  <tr className="text-start text-xs font-medium uppercase tracking-wide text-slate-500">
                    <th scope="col" className="px-5 py-3">{t("orders.columns.orderNumber")}</th>
                    <th scope="col" className="px-5 py-3">{t("orders.columns.customer")}</th>
                    <th scope="col" className="px-5 py-3">{t("orders.columns.createdAt")}</th>
                    <th scope="col" className="px-5 py-3">{t("orders.columns.status")}</th>
                    <th scope="col" className="px-5 py-3 text-right">{t("orders.columns.subtotal")}</th>
                    <th scope="col" className="px-5 py-3 text-right">{t("orders.columns.vat")}</th>
                    <th scope="col" className="px-5 py-3 text-right">{t("orders.columns.total")}</th>
                    <th scope="col" className="sticky end-0 bg-white px-5 py-3 text-end shadow-[0_0_8px_-2px_rgba(0,0,0,0.08)]">
                      {t("common.actions")}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.orders.map((order) => (
                    <tr key={order.id} className="group hover:bg-slate-50">
                      <td className="whitespace-nowrap px-5 py-3 font-medium text-slate-900">{order.orderNumber}</td>
                      <td className="whitespace-nowrap px-5 py-3 text-slate-700">
                        {order.customer ? `${order.customer.firstName} ${order.customer.lastName}` : t("orders.noCustomer")}
                      </td>
                      <td className="whitespace-nowrap px-5 py-3 text-slate-500">{formatDate(order.createdAt)}</td>
                      <td className="whitespace-nowrap px-5 py-3">
                        <OrderStatusBadge status={order.status} />
                      </td>
                      <td className="whitespace-nowrap px-5 py-3 text-right text-slate-600">{formatCurrency(order.subtotal)}</td>
                      <td className="whitespace-nowrap px-5 py-3 text-right text-slate-600">{formatCurrency(order.vatAmount)}</td>
                      <td className="whitespace-nowrap px-5 py-3 text-right font-medium text-slate-900">{formatCurrency(order.total)}</td>
                      <td className="sticky end-0 whitespace-nowrap bg-white px-5 py-3 text-end shadow-[0_0_8px_-2px_rgba(0,0,0,0.08)] group-hover:bg-slate-50">
                        <button
                          type="button"
                          onClick={() => handleOpenOrder(order.id)}
                          className="rounded-md border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                        >
                          {t("orders.view")}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Pagination
              page={data.pagination.page}
              totalPages={data.pagination.totalPages}
              total={data.pagination.total}
              limit={data.pagination.limit}
              onPageChange={setPage}
            />
          </>
        )}
      </Card>

      <Modal title={t("orders.createOrderTitle")} isOpen={isCreateOpen} onClose={() => setCreateOpen(false)} widthClassName="max-w-2xl">
        <CreateOrderForm onSubmit={handleCreateOrder} onCancel={() => setCreateOpen(false)} />
      </Modal>

      <Modal
        title={selectedOrder ? t("orders.orderDetailsTitle", { orderNumber: selectedOrder.orderNumber }) : t("orders.detailsFallbackTitle")}
        isOpen={selectedOrder !== null}
        onClose={() => setSelectedOrder(null)}
        widthClassName="max-w-2xl"
      >
        {selectedOrder && <OrderDetails order={selectedOrder} onStatusUpdated={handleStatusUpdated} />}
      </Modal>
    </div>
  );
}
