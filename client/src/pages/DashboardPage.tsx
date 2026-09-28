import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ApiError } from "../api/httpClient";
import { OrderStatusBadge } from "../components/ui/Badge";
import { Card, EmptyState, ErrorState, LoadingState } from "../components/ui/StateViews";
import { KpiCard } from "../components/ui/KpiCard";
import { OrdersStatusChart } from "../components/dashboard/OrdersStatusChart";
import { SalesOverviewChart } from "../components/dashboard/SalesOverviewChart";
import { QuickActions } from "../components/dashboard/QuickActions";
import { AlertTriangleIcon, CustomersIcon, OrdersIcon, ProductsIcon } from "../components/icons";
import { formatCurrency, formatDate } from "../lib/format";
import { loadDashboardData } from "../services/dashboard.service";
import type { DashboardData } from "../services/dashboard.service";
import { useLanguage } from "../i18n/LanguageContext";

export default function DashboardPage() {
  const { t } = useLanguage();
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await loadDashboardData();
      setData(result);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : t("dashboard.failedToLoad");
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // /api/products/low-stock's definition (stockQuantity <= minimumStock)
  // includes zero-stock items, which are already listed under "Out of Stock" —
  // excluded here so the same product isn't shown twice in the alerts list.
  const visibleLowStock = data ? data.lowStockProducts.filter((p) => p.stockQuantity > 0) : [];

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-slate-900">{t("dashboard.title")}</h2>
        <p className="mt-1 text-sm text-slate-500">{t("dashboard.subtitle")}</p>
      </div>

      {isLoading && <LoadingState label={t("dashboard.loading")} />}

      {!isLoading && error && <ErrorState message={error} onRetry={fetchData} />}

      {!isLoading && !error && data && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <KpiCard label={t("dashboard.kpi.totalCustomers")} value={data.totalCustomers.toLocaleString()} icon={CustomersIcon} tone="indigo" />
            <KpiCard label={t("dashboard.kpi.totalProducts")} value={data.totalProducts.toLocaleString()} icon={ProductsIcon} tone="indigo" />
            <KpiCard label={t("dashboard.kpi.totalOrders")} value={data.totalOrders.toLocaleString()} icon={OrdersIcon} tone="indigo" />
            <KpiCard label={t("dashboard.kpi.totalRevenue")} value={formatCurrency(data.totalRevenue)} icon={OrdersIcon} tone="emerald" />
            <KpiCard
              label={t("dashboard.kpi.lowStockProducts")}
              value={data.lowStockProducts.length.toLocaleString()}
              icon={AlertTriangleIcon}
              tone="amber"
            />
            <KpiCard
              label={t("dashboard.kpi.outOfStockProducts")}
              value={data.outOfStockProducts.length.toLocaleString()}
              icon={AlertTriangleIcon}
              tone="red"
            />
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold text-slate-900">{t("dashboard.quickActions.title")}</h3>
            <QuickActions />
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <Card className="xl:col-span-2">
              <div className="border-b border-slate-200 px-5 py-4">
                <h3 className="text-sm font-semibold text-slate-900">{t("dashboard.salesOverview.title")}</h3>
                <p className="text-xs text-slate-500">{t("dashboard.salesOverview.subtitle")}</p>
              </div>
              {data.salesOverTime.length === 0 ? (
                <EmptyState title={t("dashboard.salesOverview.empty")} description={t("dashboard.salesOverview.emptyDescription")} />
              ) : (
                <div className="px-5 py-4">
                  <SalesOverviewChart data={data.salesOverTime} />
                </div>
              )}
            </Card>

            <Card>
              <div className="border-b border-slate-200 px-5 py-4">
                <h3 className="text-sm font-semibold text-slate-900">{t("dashboard.ordersOverview.title")}</h3>
                <p className="text-xs text-slate-500">{t("dashboard.ordersOverview.subtitle")}</p>
              </div>
              {data.totalOrders === 0 ? (
                <EmptyState title={t("dashboard.ordersOverview.empty")} description={t("dashboard.ordersOverview.emptyDescription")} />
              ) : (
                <OrdersStatusChart counts={data.ordersByStatus} />
              )}
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <Card className="xl:col-span-2">
              <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                <h3 className="text-sm font-semibold text-slate-900">{t("dashboard.recentOrders.title")}</h3>
                <Link to="/orders" className="text-xs font-medium text-indigo-600 hover:text-indigo-500">
                  {t("dashboard.recentOrders.viewAll")}
                </Link>
              </div>
              {data.recentOrders.length === 0 ? (
                <EmptyState title={t("dashboard.recentOrders.empty")} description={t("dashboard.recentOrders.emptyDescription")} />
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200 text-sm">
                    <thead>
                      <tr className="text-start text-xs font-medium uppercase tracking-wide text-slate-500">
                        <th scope="col" className="px-5 py-3">{t("dashboard.recentOrders.columnOrderNumber")}</th>
                        <th scope="col" className="px-5 py-3">{t("dashboard.recentOrders.columnCustomer")}</th>
                        <th scope="col" className="px-5 py-3">{t("dashboard.recentOrders.columnStatus")}</th>
                        <th scope="col" className="px-5 py-3">{t("dashboard.recentOrders.columnDate")}</th>
                        <th scope="col" className="px-5 py-3 text-right">{t("dashboard.recentOrders.columnTotal")}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {data.recentOrders.map((order) => (
                        <tr key={order.id} className="hover:bg-slate-50">
                          <td className="whitespace-nowrap px-5 py-3 font-medium text-slate-900">{order.orderNumber}</td>
                          <td className="whitespace-nowrap px-5 py-3 text-slate-600">
                            {order.customer ? `${order.customer.firstName} ${order.customer.lastName}` : t("common.emDash")}
                          </td>
                          <td className="whitespace-nowrap px-5 py-3">
                            <OrderStatusBadge status={order.status} />
                          </td>
                          <td className="whitespace-nowrap px-5 py-3 text-slate-500">{formatDate(order.createdAt)}</td>
                          <td className="whitespace-nowrap px-5 py-3 text-right font-medium text-slate-900">
                            {formatCurrency(order.total)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>

            <Card>
              <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                <h3 className="text-sm font-semibold text-slate-900">{t("dashboard.inventoryAlerts.title")}</h3>
                <Link to="/inventory" className="text-xs font-medium text-indigo-600 hover:text-indigo-500">
                  {t("dashboard.inventoryAlerts.viewAll")}
                </Link>
              </div>

              {data.lowStockProducts.length === 0 && data.outOfStockProducts.length === 0 ? (
                <div className="px-5 py-10">
                  <EmptyState title={t("dashboard.inventoryAlerts.empty")} description={t("dashboard.inventoryAlerts.emptyDescription")} />
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {data.outOfStockProducts.length > 0 && (
                    <div>
                      <p className="px-5 pt-3 text-xs font-medium uppercase tracking-wide text-red-500">{t("dashboard.inventoryAlerts.outOfStock")}</p>
                      <ul className="divide-y divide-slate-100">
                        {data.outOfStockProducts.slice(0, 4).map((product) => (
                          <li key={product.id}>
                            <Link to="/inventory" className="flex items-center justify-between px-5 py-2.5 hover:bg-slate-50">
                              <div className="min-w-0">
                                <p className="truncate text-sm font-medium text-slate-900">{product.name}</p>
                                <p className="text-xs text-slate-500">{t("common.skuLabel", { sku: product.sku })}</p>
                              </div>
                              <span className="ms-3 shrink-0 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/20">
                                0 / {product.minimumStock}
                              </span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {visibleLowStock.length > 0 && (
                    <div>
                      <p className="px-5 pt-3 text-xs font-medium uppercase tracking-wide text-amber-500">{t("dashboard.inventoryAlerts.lowStock")}</p>
                      <ul className="divide-y divide-slate-100">
                        {visibleLowStock.slice(0, 4).map((product) => (
                          <li key={product.id}>
                            <Link to="/inventory" className="flex items-center justify-between px-5 py-2.5 hover:bg-slate-50">
                              <div className="min-w-0">
                                <p className="truncate text-sm font-medium text-slate-900">{product.name}</p>
                                <p className="text-xs text-slate-500">{t("common.skuLabel", { sku: product.sku })}</p>
                              </div>
                              <span className="ms-3 shrink-0 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-600/20">
                                {product.stockQuantity} / {product.minimumStock}
                              </span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
