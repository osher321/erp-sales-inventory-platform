import { useCallback, useEffect, useState } from "react";
import * as customersApi from "../api/customers.api";
import { ApiError } from "../api/httpClient";
import { CustomerForm } from "../components/customers/CustomerForm";
import type { CustomerFormValues } from "../components/customers/CustomerForm";
import { EditIcon, PlusIcon, SearchIcon, TrashIcon } from "../components/icons";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { Modal } from "../components/ui/Modal";
import { Pagination } from "../components/ui/Pagination";
import { Card, EmptyState, ErrorState, LoadingState } from "../components/ui/StateViews";
import { useToast } from "../components/ui/Toast";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { useOpenCreateFromNavigation } from "../hooks/useOpenCreateFromNavigation";
import { formatDate } from "../lib/format";
import { useLanguage } from "../i18n/LanguageContext";
import type { Customer, CustomerListResult } from "../types/api";

const PAGE_SIZE = 10;

export default function CustomersPage() {
  const { showSuccess, showError } = useToast();
  const { t } = useLanguage();

  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput, 350);

  const [data, setData] = useState<CustomerListResult | null>(null);
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isAddOpen, setAddOpen] = useState(false);
  useOpenCreateFromNavigation(() => setAddOpen(true));
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [deletingCustomer, setDeletingCustomer] = useState<Customer | null>(null);
  const [isDeleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await customersApi.listCustomers({
        page,
        limit: PAGE_SIZE,
        search: debouncedSearch.trim() || undefined,
      });
      setData(result);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("customers.failedToLoad"));
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, t]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // Reset to page 1 whenever the search term changes so results aren't
  // scoped to a page number that may no longer exist for the new query.
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  async function handleCreate(values: CustomerFormValues) {
    await customersApi.createCustomer(values);
    setAddOpen(false);
    showSuccess(t("customers.createdToast", { name: `${values.firstName} ${values.lastName}` }));
    await fetchCustomers();
  }

  async function handleUpdate(values: CustomerFormValues) {
    if (!editingCustomer) return;
    await customersApi.updateCustomer(editingCustomer.id, values);
    setEditingCustomer(null);
    showSuccess(t("customers.updatedToast", { name: `${values.firstName} ${values.lastName}` }));
    await fetchCustomers();
  }

  async function handleDeleteConfirm() {
    if (!deletingCustomer) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await customersApi.deleteCustomer(deletingCustomer.id);
      showSuccess(
        t("customers.deletedToast", { name: `${deletingCustomer.firstName} ${deletingCustomer.lastName}` }),
      );
      setDeletingCustomer(null);
      const isLastRowOnPage = data?.customers.length === 1 && page > 1;
      if (isLastRowOnPage) setPage((p) => p - 1);
      else await fetchCustomers();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : t("customers.deleteFailed");
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
          <h2 className="text-xl font-semibold text-slate-900">{t("customers.title")}</h2>
          <p className="mt-1 text-sm text-slate-500">{t("customers.subtitle")}</p>
        </div>
        <button
          type="button"
          onClick={() => setAddOpen(true)}
          className="flex items-center justify-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
        >
          <PlusIcon className="h-4 w-4" />
          {t("customers.addCustomer")}
        </button>
      </div>

      <div className="mb-4">
        <label htmlFor="customer-search" className="sr-only">
          {t("customers.searchLabel")}
        </label>
        <div className="relative max-w-sm">
          <SearchIcon className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            id="customer-search"
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder={t("customers.searchPlaceholder")}
            className="block w-full rounded-md border border-slate-300 py-2 ps-9 pe-3 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      <Card>
        {isLoading && <LoadingState label={t("customers.loading")} />}

        {!isLoading && error && (
          <div className="p-2">
            <ErrorState message={error} onRetry={fetchCustomers} />
          </div>
        )}

        {!isLoading && !error && data && data.customers.length === 0 && (
          <EmptyState
            title={debouncedSearch ? t("customers.emptySearchTitle") : t("customers.emptyTitle")}
            description={debouncedSearch ? t("customers.emptySearchDescription") : t("customers.emptyDescription")}
          />
        )}

        {!isLoading && !error && data && data.customers.length > 0 && (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead>
                  <tr className="text-start text-xs font-medium uppercase tracking-wide text-slate-500">
                    <th scope="col" className="px-5 py-3">{t("customers.columns.customerNumber")}</th>
                    <th scope="col" className="px-5 py-3">{t("customers.columns.name")}</th>
                    <th scope="col" className="px-5 py-3">{t("customers.columns.email")}</th>
                    <th scope="col" className="px-5 py-3">{t("customers.columns.phone")}</th>
                    <th scope="col" className="px-5 py-3">{t("customers.columns.address")}</th>
                    <th scope="col" className="px-5 py-3">{t("customers.columns.createdAt")}</th>
                    <th scope="col" className="sticky end-0 bg-white px-5 py-3 text-end shadow-[0_0_8px_-2px_rgba(0,0,0,0.08)]">
                      {t("common.actions")}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.customers.map((customer) => (
                    <tr key={customer.id} className="group hover:bg-slate-50">
                      <td className="whitespace-nowrap px-5 py-3 font-medium text-slate-900">{customer.customerNumber}</td>
                      <td className="whitespace-nowrap px-5 py-3 text-slate-700">
                        {customer.firstName} {customer.lastName}
                      </td>
                      <td className="whitespace-nowrap px-5 py-3 text-slate-600">{customer.email}</td>
                      <td className="whitespace-nowrap px-5 py-3 text-slate-600">{customer.phone}</td>
                      <td className="max-w-xs truncate px-5 py-3 text-slate-600">
                        {customer.address}, {customer.city}
                      </td>
                      <td className="whitespace-nowrap px-5 py-3 text-slate-500">{formatDate(customer.createdAt)}</td>
                      <td className="sticky end-0 whitespace-nowrap bg-white px-5 py-3 shadow-[0_0_8px_-2px_rgba(0,0,0,0.08)] group-hover:bg-slate-50">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setEditingCustomer(customer)}
                            aria-label={t("customers.editAriaLabel", { name: `${customer.firstName} ${customer.lastName}` })}
                            className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-indigo-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                          >
                            <EditIcon className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setDeletingCustomer(customer);
                              setDeleteError(null);
                            }}
                            aria-label={t("customers.deleteAriaLabel", { name: `${customer.firstName} ${customer.lastName}` })}
                            className="rounded-md p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
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

      <Modal title={t("customers.addCustomer")} isOpen={isAddOpen} onClose={() => setAddOpen(false)}>
        <CustomerForm submitLabel={t("customers.form.createSubmit")} onSubmit={handleCreate} onCancel={() => setAddOpen(false)} />
      </Modal>

      <Modal title={t("customers.editCustomer")} isOpen={editingCustomer !== null} onClose={() => setEditingCustomer(null)}>
        {editingCustomer && (
          <CustomerForm
            initialValues={{
              customerNumber: editingCustomer.customerNumber,
              firstName: editingCustomer.firstName,
              lastName: editingCustomer.lastName,
              email: editingCustomer.email,
              phone: editingCustomer.phone,
              address: editingCustomer.address,
              city: editingCustomer.city,
            }}
            submitLabel={t("customers.form.saveSubmit")}
            onSubmit={handleUpdate}
            onCancel={() => setEditingCustomer(null)}
          />
        )}
      </Modal>

      <ConfirmDialog
        isOpen={deletingCustomer !== null}
        title={t("customers.deleteDialog.title")}
        message={
          deletingCustomer
            ? t("customers.deleteDialog.message", { name: `${deletingCustomer.firstName} ${deletingCustomer.lastName}` })
            : ""
        }
        isLoading={isDeleting}
        errorMessage={deleteError}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeletingCustomer(null)}
      />
    </div>
  );
}
