import { useCallback, useEffect, useMemo, useState } from "react";
import * as inventoryApi from "../api/inventory.api";
import { ApiError } from "../api/httpClient";
import { MovementHistory } from "../components/inventory/MovementHistory";
import { UpdateStockForm } from "../components/inventory/UpdateStockForm";
import { AlertTriangleIcon, ClockIcon, EditIcon, InventoryIcon, ProductsIcon, SearchIcon } from "../components/icons";
import { InventoryStatusBadge } from "../components/ui/Badge";
import { KpiCard } from "../components/ui/KpiCard";
import { Modal } from "../components/ui/Modal";
import { Card, EmptyState, ErrorState, LoadingState } from "../components/ui/StateViews";
import { useToast } from "../components/ui/Toast";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { useLanguage } from "../i18n/LanguageContext";
import type { InventoryItem, InventoryStatus } from "../types/api";

const STATUS_FILTERS: { key: string; value: InventoryStatus | "ALL" }[] = [
  { key: "ALL", value: "ALL" },
  { key: "IN_STOCK", value: "IN_STOCK" },
  { key: "LOW_STOCK", value: "LOW_STOCK" },
  { key: "OUT_OF_STOCK", value: "OUT_OF_STOCK" },
];

export default function InventoryPage() {
  const { showSuccess } = useToast();
  const { t } = useLanguage();

  const [inventory, setInventory] = useState<InventoryItem[] | null>(null);
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput, 300);
  const [statusFilter, setStatusFilter] = useState<InventoryStatus | "ALL">("ALL");

  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [historyItem, setHistoryItem] = useState<InventoryItem | null>(null);

  const fetchInventory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await inventoryApi.listInventory();
      setInventory(result);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("inventory.failedToLoad"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  const summary = useMemo(() => {
    const items = inventory ?? [];
    return {
      total: items.length,
      inStock: items.filter((i) => i.status === "IN_STOCK").length,
      lowStock: items.filter((i) => i.status === "LOW_STOCK").length,
      outOfStock: items.filter((i) => i.status === "OUT_OF_STOCK").length,
    };
  }, [inventory]);

  const filteredItems = useMemo(() => {
    const items = inventory ?? [];
    const term = debouncedSearch.trim().toLowerCase();
    return items.filter((item) => {
      const matchesStatus = statusFilter === "ALL" || item.status === statusFilter;
      const matchesSearch =
        !term || item.sku.toLowerCase().includes(term) || item.productName.toLowerCase().includes(term);
      return matchesStatus && matchesSearch;
    });
  }, [inventory, debouncedSearch, statusFilter]);

  async function handleUpdateStock(values: inventoryApi.UpdateStockInput) {
    if (!editingItem) return;
    await inventoryApi.updateStock(editingItem.productId, values);
    setEditingItem(null);
    showSuccess(t("inventory.updatedToast", { name: editingItem.productName, quantity: values.stockQuantity }));
    await fetchInventory();
  }

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-slate-900">{t("inventory.title")}</h2>
        <p className="mt-1 text-sm text-slate-500">{t("inventory.subtitle")}</p>
      </div>

      {isLoading && <LoadingState label={t("inventory.loading")} />}

      {!isLoading && error && <ErrorState message={error} onRetry={fetchInventory} />}

      {!isLoading && !error && inventory && (
        <>
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard label={t("inventory.kpi.totalProducts")} value={summary.total.toLocaleString()} icon={ProductsIcon} tone="indigo" />
            <KpiCard label={t("inventory.kpi.inStock")} value={summary.inStock.toLocaleString()} icon={InventoryIcon} tone="emerald" />
            <KpiCard label={t("inventory.kpi.lowStock")} value={summary.lowStock.toLocaleString()} icon={AlertTriangleIcon} tone="amber" />
            <KpiCard label={t("inventory.kpi.outOfStock")} value={summary.outOfStock.toLocaleString()} icon={AlertTriangleIcon} tone="red" />
          </div>

          <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full max-w-sm">
              <label htmlFor="inventory-search" className="sr-only">
                {t("inventory.searchLabel")}
              </label>
              <SearchIcon className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                id="inventory-search"
                type="search"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder={t("inventory.searchPlaceholder")}
                className="block w-full rounded-md border border-slate-300 py-2 ps-9 pe-3 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex flex-wrap gap-2" role="group" aria-label={t("products.filterByStockStatusAriaLabel")}>
              {STATUS_FILTERS.map((filter) => (
                <button
                  key={filter.value}
                  type="button"
                  onClick={() => setStatusFilter(filter.value)}
                  aria-pressed={statusFilter === filter.value}
                  className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                    statusFilter === filter.value
                      ? "bg-indigo-600 text-white"
                      : "bg-white text-slate-600 ring-1 ring-inset ring-slate-300 hover:bg-slate-50"
                  }`}
                >
                  {t(`stockStatus.${filter.key}`)}
                </button>
              ))}
            </div>
          </div>

          <Card>
            {filteredItems.length === 0 ? (
              <EmptyState
                title={debouncedSearch || statusFilter !== "ALL" ? t("inventory.emptyFilteredTitle") : t("inventory.emptyTitle")}
                description={t("inventory.emptyFilteredDescription")}
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                  <thead>
                    <tr className="text-start text-xs font-medium uppercase tracking-wide text-slate-500">
                      <th scope="col" className="px-5 py-3">{t("inventory.columns.sku")}</th>
                      <th scope="col" className="px-5 py-3">{t("inventory.columns.productName")}</th>
                      <th scope="col" className="px-5 py-3 text-right">{t("inventory.columns.stockQuantity")}</th>
                      <th scope="col" className="px-5 py-3 text-right">{t("inventory.columns.minimumStock")}</th>
                      <th scope="col" className="px-5 py-3">{t("inventory.columns.status")}</th>
                      <th scope="col" className="sticky end-0 bg-white px-5 py-3 text-end shadow-[0_0_8px_-2px_rgba(0,0,0,0.08)]">
                        {t("common.actions")}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredItems.map((item) => (
                      <tr key={item.productId} className="group hover:bg-slate-50">
                        <td className="whitespace-nowrap px-5 py-3 font-medium text-slate-900">{item.sku}</td>
                        <td className="whitespace-nowrap px-5 py-3 text-slate-700">{item.productName}</td>
                        <td className="whitespace-nowrap px-5 py-3 text-right text-slate-900">{item.stockQuantity}</td>
                        <td className="whitespace-nowrap px-5 py-3 text-right text-slate-600">{item.minimumStock}</td>
                        <td className="whitespace-nowrap px-5 py-3">
                          <InventoryStatusBadge status={item.status} />
                        </td>
                        <td className="sticky end-0 whitespace-nowrap bg-white px-5 py-3 shadow-[0_0_8px_-2px_rgba(0,0,0,0.08)] group-hover:bg-slate-50">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setHistoryItem(item)}
                              aria-label={t("inventory.historyAriaLabel", { name: item.productName })}
                              className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-indigo-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                            >
                              <ClockIcon className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingItem(item)}
                              aria-label={t("inventory.updateAriaLabel", { name: item.productName })}
                              className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-indigo-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                            >
                              <EditIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      )}

      <Modal title={t("inventory.updateStockTitle")} isOpen={editingItem !== null} onClose={() => setEditingItem(null)}>
        {editingItem && <UpdateStockForm item={editingItem} onSubmit={handleUpdateStock} onCancel={() => setEditingItem(null)} />}
      </Modal>

      <Modal
        title={historyItem ? t("inventory.history.titleWithProduct", { name: historyItem.productName }) : t("inventory.history.title")}
        isOpen={historyItem !== null}
        onClose={() => setHistoryItem(null)}
        widthClassName="max-w-2xl"
      >
        {historyItem && <MovementHistory productId={historyItem.productId} />}
      </Modal>
    </div>
  );
}
