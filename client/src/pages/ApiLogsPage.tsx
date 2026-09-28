import { useCallback, useEffect, useState } from "react";
import * as logsApi from "../api/logs.api";
import { ApiError } from "../api/httpClient";
import { ApiOutcomeBadge, HttpMethodBadge } from "../components/ui/Badge";
import { Modal } from "../components/ui/Modal";
import { Pagination } from "../components/ui/Pagination";
import { Card, EmptyState, ErrorState, LoadingState } from "../components/ui/StateViews";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { SearchIcon } from "../components/icons";
import { formatDateTime } from "../lib/format";
import { useLanguage } from "../i18n/LanguageContext";
import type { ApiLog, ApiLogListResult, HttpMethod } from "../types/api";

const PAGE_SIZE = 20;

const METHOD_FILTERS: { key: string; value: HttpMethod | "ALL" }[] = [
  { key: "allMethods", value: "ALL" },
  { key: "GET", value: "GET" },
  { key: "POST", value: "POST" },
  { key: "PUT", value: "PUT" },
  { key: "PATCH", value: "PATCH" },
  { key: "DELETE", value: "DELETE" },
];

const OUTCOME_FILTERS: { key: string; value: "ALL" | "true" | "false" }[] = [
  { key: "outcomeAll", value: "ALL" },
  { key: "outcomeSuccess", value: "true" },
  { key: "outcomeError", value: "false" },
];

export default function ApiLogsPage() {
  const { t } = useLanguage();
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput, 350);
  const [methodFilter, setMethodFilter] = useState<HttpMethod | "ALL">("ALL");
  const [outcomeFilter, setOutcomeFilter] = useState<"ALL" | "true" | "false">("ALL");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const [data, setData] = useState<ApiLogListResult | null>(null);
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedLog, setSelectedLog] = useState<ApiLog | null>(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await logsApi.listLogs({
        page,
        limit: PAGE_SIZE,
        search: debouncedSearch.trim() || undefined,
        method: methodFilter === "ALL" ? undefined : methodFilter,
        success: outcomeFilter === "ALL" ? undefined : outcomeFilter === "true",
        sortOrder,
      });
      setData(result);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("apiLogs.failedToLoad"));
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, methodFilter, outcomeFilter, sortOrder, t]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, methodFilter, outcomeFilter, sortOrder]);

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-slate-900">{t("apiLogs.title")}</h2>
        <p className="mt-1 text-sm text-slate-500">{t("apiLogs.subtitle")}</p>
      </div>

      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full max-w-sm">
          <label htmlFor="log-search" className="sr-only">
            {t("apiLogs.searchLabel")}
          </label>
          <SearchIcon className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            id="log-search"
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder={t("apiLogs.searchPlaceholder")}
            className="block w-full rounded-md border border-slate-300 py-2 ps-9 pe-3 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div>
            <label htmlFor="log-method-filter" className="sr-only">
              {t("apiLogs.filterByMethodAriaLabel")}
            </label>
            <select
              id="log-method-filter"
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value as HttpMethod | "ALL")}
              className="rounded-md border border-slate-300 py-2 ps-3 pe-8 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {METHOD_FILTERS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.key === "allMethods" ? t("apiLogs.allMethods") : option.key}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2" role="group" aria-label={t("apiLogs.filterByOutcomeAriaLabel")}>
            {OUTCOME_FILTERS.map((filter) => (
              <button
                key={filter.value}
                type="button"
                onClick={() => setOutcomeFilter(filter.value)}
                aria-pressed={outcomeFilter === filter.value}
                className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                  outcomeFilter === filter.value
                    ? "bg-indigo-600 text-white"
                    : "bg-white text-slate-600 ring-1 ring-inset ring-slate-300 hover:bg-slate-50"
                }`}
              >
                {t(`apiLogs.${filter.key}`)}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))}
            aria-label={t("apiLogs.sortOrderAriaLabel", {
              order: sortOrder === "asc" ? t("apiLogs.oldestFirst") : t("apiLogs.newestFirst"),
            })}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 shadow-sm hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            {sortOrder === "desc" ? t("apiLogs.newestFirst") : t("apiLogs.oldestFirst")}
          </button>
        </div>
      </div>

      <Card>
        {isLoading && <LoadingState label={t("apiLogs.loading")} />}

        {!isLoading && error && (
          <div className="p-2">
            <ErrorState message={error} onRetry={fetchLogs} />
          </div>
        )}

        {!isLoading && !error && data && data.logs.length === 0 && (
          <EmptyState
            title={debouncedSearch || methodFilter !== "ALL" || outcomeFilter !== "ALL" ? t("apiLogs.emptyFilteredTitle") : t("apiLogs.emptyTitle")}
            description={t("apiLogs.emptyDescription")}
          />
        )}

        {!isLoading && !error && data && data.logs.length > 0 && (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead>
                  <tr className="text-start text-xs font-medium uppercase tracking-wide text-slate-500">
                    <th scope="col" className="px-5 py-3">{t("apiLogs.columns.method")}</th>
                    <th scope="col" className="px-5 py-3">{t("apiLogs.columns.endpoint")}</th>
                    <th scope="col" className="px-5 py-3">{t("apiLogs.columns.status")}</th>
                    <th scope="col" className="px-5 py-3 text-right">{t("apiLogs.columns.responseTime")}</th>
                    <th scope="col" className="px-5 py-3">{t("apiLogs.columns.user")}</th>
                    <th scope="col" className="px-5 py-3">{t("apiLogs.columns.timestamp")}</th>
                    <th scope="col" className="sticky end-0 bg-white px-5 py-3 text-end shadow-[0_0_8px_-2px_rgba(0,0,0,0.08)]">
                      {t("common.actions")}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.logs.map((log) => (
                    <tr key={log.id} className="group hover:bg-slate-50">
                      <td className="whitespace-nowrap px-5 py-3">
                        <HttpMethodBadge method={log.method} />
                      </td>
                      <td className="whitespace-nowrap px-5 py-3 font-mono text-xs text-slate-700">{log.endpoint}</td>
                      <td className="whitespace-nowrap px-5 py-3">
                        <ApiOutcomeBadge statusCode={log.statusCode} />
                      </td>
                      <td className="whitespace-nowrap px-5 py-3 text-right text-slate-600">
                        {t("apiLogs.responseTimeMs", { value: log.responseTime })}
                      </td>
                      <td className="whitespace-nowrap px-5 py-3 text-slate-600">{log.userEmail ?? t("common.emDash")}</td>
                      <td className="whitespace-nowrap px-5 py-3 text-slate-500">{formatDateTime(log.timestamp)}</td>
                      <td className="sticky end-0 whitespace-nowrap bg-white px-5 py-3 text-end shadow-[0_0_8px_-2px_rgba(0,0,0,0.08)] group-hover:bg-slate-50">
                        <button
                          type="button"
                          onClick={() => setSelectedLog(log)}
                          className="rounded-md border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                        >
                          {t("apiLogs.view")}
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

      <Modal title={t("apiLogs.detailsTitle")} isOpen={selectedLog !== null} onClose={() => setSelectedLog(null)} widthClassName="max-w-lg">
        {selectedLog && (
          <dl className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <dt className="font-medium text-slate-500">{t("apiLogs.details.method")}</dt>
              <dd>
                <HttpMethodBadge method={selectedLog.method} />
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="font-medium text-slate-500">{t("apiLogs.details.endpoint")}</dt>
              <dd className="font-mono text-xs text-slate-900">{selectedLog.endpoint}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="font-medium text-slate-500">{t("apiLogs.details.statusCode")}</dt>
              <dd>
                <ApiOutcomeBadge statusCode={selectedLog.statusCode} />
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="font-medium text-slate-500">{t("apiLogs.details.responseTime")}</dt>
              <dd className="text-slate-900">{t("apiLogs.responseTimeMs", { value: selectedLog.responseTime })}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="font-medium text-slate-500">{t("apiLogs.details.user")}</dt>
              <dd className="text-slate-900">{selectedLog.userEmail ?? t("apiLogs.unauthenticated")}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="font-medium text-slate-500">{t("apiLogs.details.timestamp")}</dt>
              <dd className="text-slate-900">{formatDateTime(selectedLog.timestamp)}</dd>
            </div>
            {selectedLog.errorMessage && (
              <div>
                <dt className="mb-1 font-medium text-slate-500">{t("apiLogs.details.errorMessage")}</dt>
                <dd className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-red-700">{selectedLog.errorMessage}</dd>
              </div>
            )}
          </dl>
        )}
      </Modal>
    </div>
  );
}
