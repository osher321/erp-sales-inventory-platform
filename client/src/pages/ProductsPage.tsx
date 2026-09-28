import { useCallback, useEffect, useMemo, useState } from "react";
import * as productsApi from "../api/products.api";
import type { ProductSortField } from "../api/products.api";
import { ApiError } from "../api/httpClient";
import { ProductForm } from "../components/products/ProductForm";
import type { ProductFormValues } from "../components/products/ProductForm";
import { EditIcon, PlusIcon, SearchIcon, TrashIcon } from "../components/icons";
import { InventoryStatusBadge } from "../components/ui/Badge";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { Modal } from "../components/ui/Modal";
import { Pagination } from "../components/ui/Pagination";
import { Card, EmptyState, ErrorState, LoadingState } from "../components/ui/StateViews";
import { useToast } from "../components/ui/Toast";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { useOpenCreateFromNavigation } from "../hooks/useOpenCreateFromNavigation";
import { formatCurrency, formatDate } from "../lib/format";
import { getStockStatus } from "../lib/stock";
import { useLanguage } from "../i18n/LanguageContext";
import type { InventoryStatus, Product, ProductListResult } from "../types/api";

const PAGE_SIZE = 10;

const STOCK_STATUS_FILTERS: { key: string; value: InventoryStatus | "ALL" }[] = [
  { key: "ALL", value: "ALL" },
  { key: "IN_STOCK", value: "IN_STOCK" },
  { key: "LOW_STOCK", value: "LOW_STOCK" },
  { key: "OUT_OF_STOCK", value: "OUT_OF_STOCK" },
];

const SORT_OPTIONS: { key: string; value: ProductSortField }[] = [
  { key: "sortCreatedAt", value: "createdAt" },
  { key: "sortName", value: "name" },
  { key: "sortPrice", value: "price" },
  { key: "sortStockQuantity", value: "stockQuantity" },
];

function toFormValues(product: Product): ProductFormValues {
  return {
    sku: product.sku,
    name: product.name,
    description: product.description ?? "",
    category: product.category,
    price: product.price,
    stockQuantity: String(product.stockQuantity),
    minimumStock: String(product.minimumStock),
  };
}

export default function ProductsPage() {
  const { showSuccess, showError } = useToast();
  const { t } = useLanguage();

  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput, 350);
  const [category, setCategory] = useState("");
  const [stockStatus, setStockStatus] = useState<InventoryStatus | "ALL">("ALL");
  const [sortBy, setSortBy] = useState<ProductSortField>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const [categoryOptions, setCategoryOptions] = useState<string[]>([]);

  const [data, setData] = useState<ProductListResult | null>(null);
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isAddOpen, setAddOpen] = useState(false);
  useOpenCreateFromNavigation(() => setAddOpen(true));
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [isDeleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await productsApi.listProducts({
        page,
        limit: PAGE_SIZE,
        search: debouncedSearch.trim() || undefined,
        category: category || undefined,
        stockStatus: stockStatus === "ALL" ? undefined : stockStatus,
        sortBy,
        sortOrder,
      });
      setData(result);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("products.failedToLoad"));
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, category, stockStatus, sortBy, sortOrder, t]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Reset to page 1 whenever a filter/search/sort changes so results aren't
  // scoped to a page number that may no longer exist for the new query.
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, category, stockStatus, sortBy, sortOrder]);

  // The API has no dedicated "list categories" endpoint, so the filter's
  // options are derived from the current catalog (up to the API's max page
  // size of 100). Fine for this dataset; a catalog beyond 100 products would
  // need a real distinct-categories endpoint to enumerate every category.
  useEffect(() => {
    productsApi
      .listProducts({ limit: 100 })
      .then((result) => {
        const categories = Array.from(new Set(result.products.map((p) => p.category))).sort();
        setCategoryOptions(categories);
      })
      .catch(() => {
        // Non-critical: the category dropdown simply stays empty.
      });
  }, []);

  const emptyStateCopy = useMemo(() => {
    if (debouncedSearch || category || stockStatus !== "ALL") {
      return { title: t("products.emptyFilteredTitle"), description: t("products.emptyFilteredDescription") };
    }
    return { title: t("products.emptyTitle"), description: t("products.emptyDescription") };
  }, [debouncedSearch, category, stockStatus, t]);

  async function handleCreate(values: productsApi.ProductInput) {
    await productsApi.createProduct(values);
    setAddOpen(false);
    showSuccess(t("products.createdToast", { name: values.name }));
    await fetchProducts();
  }

  async function handleUpdate(values: productsApi.ProductInput) {
    if (!editingProduct) return;
    await productsApi.updateProduct(editingProduct.id, values);
    setEditingProduct(null);
    showSuccess(t("products.updatedToast", { name: values.name }));
    await fetchProducts();
  }

  async function handleDeleteConfirm() {
    if (!deletingProduct) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await productsApi.deleteProduct(deletingProduct.id);
      showSuccess(t("products.deletedToast", { name: deletingProduct.name }));
      setDeletingProduct(null);
      const isLastRowOnPage = data?.products.length === 1 && page > 1;
      if (isLastRowOnPage) setPage((p) => p - 1);
      else await fetchProducts();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : t("products.deleteFailed");
      setDeleteError(message);
      showError(message);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">{t("products.title")}</h2>
          <p className="mt-1 text-sm text-slate-500">{t("products.subtitle")}</p>
        </div>
        <button
          type="button"
          onClick={() => setAddOpen(true)}
          className="flex items-center justify-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
        >
          <PlusIcon className="h-4 w-4" />
          {t("products.addProduct")}
        </button>
      </div>

      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full max-w-sm">
          <label htmlFor="product-search" className="sr-only">
            {t("products.searchLabel")}
          </label>
          <SearchIcon className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            id="product-search"
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder={t("products.searchPlaceholder")}
            className="block w-full rounded-md border border-slate-300 py-2 ps-9 pe-3 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div>
            <label htmlFor="product-category-filter" className="sr-only">
              {t("products.sortLabel")}
            </label>
            <select
              id="product-category-filter"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="rounded-md border border-slate-300 py-2 ps-3 pe-8 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">{t("products.allCategories")}</option>
              {categoryOptions.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="product-sort-by" className="sr-only">
              {t("products.sortByLabel")}
            </label>
            <select
              id="product-sort-by"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as ProductSortField)}
              className="rounded-md border border-slate-300 py-2 ps-3 pe-8 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {t("products.sortPrefix")} {t(`products.${option.key}`)}
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
            {sortOrder === "asc" ? `↑ ${t("products.sortAsc")}` : `↓ ${t("products.sortDesc")}`}
          </button>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label={t("products.filterByStockStatusAriaLabel")}>
        {STOCK_STATUS_FILTERS.map((filter) => (
          <button
            key={filter.value}
            type="button"
            onClick={() => setStockStatus(filter.value)}
            aria-pressed={stockStatus === filter.value}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
              stockStatus === filter.value
                ? "bg-indigo-600 text-white"
                : "bg-white text-slate-600 ring-1 ring-inset ring-slate-300 hover:bg-slate-50"
            }`}
          >
            {t(`stockStatus.${filter.key}`)}
          </button>
        ))}
      </div>

      <Card>
        {isLoading && <LoadingState label={t("products.loading")} />}

        {!isLoading && error && (
          <div className="p-2">
            <ErrorState message={error} onRetry={fetchProducts} />
          </div>
        )}

        {!isLoading && !error && data && data.products.length === 0 && (
          <EmptyState title={emptyStateCopy.title} description={emptyStateCopy.description} />
        )}

        {!isLoading && !error && data && data.products.length > 0 && (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead>
                  <tr className="text-start text-xs font-medium uppercase tracking-wide text-slate-500">
                    <th scope="col" className="px-5 py-3">{t("products.columns.sku")}</th>
                    <th scope="col" className="px-5 py-3">{t("products.columns.name")}</th>
                    <th scope="col" className="px-5 py-3">{t("products.columns.category")}</th>
                    <th scope="col" className="px-5 py-3 text-right">{t("products.columns.price")}</th>
                    <th scope="col" className="px-5 py-3 text-right">{t("products.columns.stock")}</th>
                    <th scope="col" className="px-5 py-3 text-right">{t("products.columns.minimumStock")}</th>
                    <th scope="col" className="px-5 py-3">{t("products.columns.stockStatus")}</th>
                    <th scope="col" className="px-5 py-3">{t("products.columns.createdAt")}</th>
                    <th scope="col" className="sticky end-0 bg-white px-5 py-3 text-end shadow-[0_0_8px_-2px_rgba(0,0,0,0.08)]">
                      {t("common.actions")}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.products.map((product) => {
                    const status = getStockStatus(product.stockQuantity, product.minimumStock);
                    return (
                      <tr key={product.id} className="group hover:bg-slate-50">
                        <td className="whitespace-nowrap px-5 py-3 font-medium text-slate-900">{product.sku}</td>
                        <td className="whitespace-nowrap px-5 py-3 text-slate-700">{product.name}</td>
                        <td className="whitespace-nowrap px-5 py-3 text-slate-600">{product.category}</td>
                        <td className="whitespace-nowrap px-5 py-3 text-right text-slate-900">{formatCurrency(product.price)}</td>
                        <td className="whitespace-nowrap px-5 py-3 text-right text-slate-600">{product.stockQuantity}</td>
                        <td className="whitespace-nowrap px-5 py-3 text-right text-slate-600">{product.minimumStock}</td>
                        <td className="whitespace-nowrap px-5 py-3">
                          <InventoryStatusBadge status={status} />
                        </td>
                        <td className="whitespace-nowrap px-5 py-3 text-slate-500">{formatDate(product.createdAt)}</td>
                        <td className="sticky end-0 whitespace-nowrap bg-white px-5 py-3 shadow-[0_0_8px_-2px_rgba(0,0,0,0.08)] group-hover:bg-slate-50">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setEditingProduct(product)}
                              aria-label={t("products.editAriaLabel", { name: product.name })}
                              className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-indigo-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                            >
                              <EditIcon className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setDeletingProduct(product);
                                setDeleteError(null);
                              }}
                              aria-label={t("products.deleteAriaLabel", { name: product.name })}
                              className="rounded-md p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
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

      <Modal title={t("products.addProduct")} isOpen={isAddOpen} onClose={() => setAddOpen(false)}>
        <ProductForm submitLabel={t("products.form.createSubmit")} onSubmit={handleCreate} onCancel={() => setAddOpen(false)} />
      </Modal>

      <Modal title={t("products.editProduct")} isOpen={editingProduct !== null} onClose={() => setEditingProduct(null)}>
        {editingProduct && (
          <ProductForm
            initialValues={toFormValues(editingProduct)}
            submitLabel={t("products.form.saveSubmit")}
            onSubmit={handleUpdate}
            onCancel={() => setEditingProduct(null)}
          />
        )}
      </Modal>

      <ConfirmDialog
        isOpen={deletingProduct !== null}
        title={t("products.deleteDialog.title")}
        message={
          deletingProduct
            ? t("products.deleteDialog.message", { name: deletingProduct.name, sku: deletingProduct.sku })
            : ""
        }
        isLoading={isDeleting}
        errorMessage={deleteError}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeletingProduct(null)}
      />
    </div>
  );
}
