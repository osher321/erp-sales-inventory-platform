import { useCallback, useEffect, useState } from "react";
import * as integrationApi from "../api/integration.api";
import { ApiError } from "../api/httpClient";
import { IntegrationEntityBadge, IntegrationSyncStatusBadge } from "../components/ui/Badge";
import { Card, EmptyState, ErrorState, LoadingState } from "../components/ui/StateViews";
import { KpiCard } from "../components/ui/KpiCard";
import { Modal } from "../components/ui/Modal";
import { Pagination } from "../components/ui/Pagination";
import { useToast } from "../components/ui/Toast";
import { SyncResultPanel } from "../components/integration/SyncResultPanel";
import type { SyncResult } from "../components/integration/SyncResultPanel";
import { CustomersIcon, InventoryIcon, OrdersIcon, PriorityIcon, ProductsIcon } from "../components/icons";
import { formatDateTime } from "../lib/format";
import { useLanguage } from "../i18n/LanguageContext";
import type { IntegrationEntityType, IntegrationHistoryResult, IntegrationStatus, IntegrationSync, IntegrationSyncStatus } from "../types/api";

const PAGE_SIZE = 10;

type SyncKey = "CUSTOMER" | "PRODUCT" | "INVENTORY" | "ORDER" | "ALL";

const SYNC_ACTIONS: { key: SyncKey; labelKey: string; icon: typeof CustomersIcon }[] = [
  { key: "CUSTOMER", labelKey: "priority.actions.syncCustomers", icon: CustomersIcon },
  { key: "PRODUCT", labelKey: "priority.actions.syncProducts", icon: ProductsIcon },
  { key: "INVENTORY", labelKey: "priority.actions.syncInventory", icon: InventoryIcon },
  { key: "ORDER", labelKey: "priority.actions.syncOrders", icon: OrdersIcon },
  { key: "ALL", labelKey: "priority.actions.syncAll", icon: PriorityIcon },
];

const ENTITY_FILTERS: { key: string; value: IntegrationEntityType | "ALL" }[] = [
  { key: "ALL", value: "ALL" },
  { key: "CUSTOMER", value: "CUSTOMER" },
  { key: "PRODUCT", value: "PRODUCT" },
  { key: "INVENTORY", value: "INVENTORY" },
  { key: "ORDER", value: "ORDER" },
];

const STATUS_FILTERS: { key: string; value: IntegrationSyncStatus | "ALL" }[] = [
  { key: "ALL", value: "ALL" },
  { key: "SUCCESS", value: "SUCCESS" },
  { key: "PARTIAL", value: "PARTIAL" },
  { key: "FAILED", value: "FAILED" },
];

export default function PriorityIntegrationPage() {
  const { showError } = useToast();
  const { t } = useLanguage();

  const [status, setStatus] = useState<IntegrationStatus | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [isStatusLoading, setStatusLoading] = useState(true);

  const [syncingKey, setSyncingKey] = useState<SyncKey | null>(null);
  const [lastResult, setLastResult] = useState<SyncResult | null>(null);

  const [page, setPage] = useState(1);
  const [entityFilter, setEntityFilter] = useState<IntegrationEntityType | "ALL">("ALL");
  const [statusFilter, setStatusFilter] = useState<IntegrationSyncStatus | "ALL">("ALL");
  const [history, setHistory] = useState<IntegrationHistoryResult | null>(null);
  const [isHistoryLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState<string | null>(null);

  const [selectedSync, setSelectedSync] = useState<IntegrationSync | null>(null);

  const fetchStatus = useCallback(async () => {
    setStatusLoading(true);
    setStatusError(null);
    try {
      setStatus(await integrationApi.getStatus());
    } catch (err) {
      setStatusError(err instanceof ApiError ? err.message : t("priority.failedToLoadStatus"));
    } finally {
      setStatusLoading(false);
    }
  }, [t]);

  const fetchHistory = useCallback(async () => {
    setHistoryLoading(true);
    setHistoryError(null);
    try {
      const result = await integrationApi.getHistory({
        page,
        limit: PAGE_SIZE,
        entity: entityFilter === "ALL" ? undefined : entityFilter,
        status: statusFilter === "ALL" ? undefined : statusFilter,
      });
      setHistory(result);
    } catch (err) {
      setHistoryError(err instanceof ApiError ? err.message : t("priority.history.failedToLoad"));
    } finally {
      setHistoryLoading(false);
    }
  }, [page, entityFilter, statusFilter, t]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  useEffect(() => {
    setPage(1);
  }, [entityFilter, statusFilter]);

  async function handleSync(key: SyncKey) {
    setSyncingKey(key);
    try {
      if (key === "ALL") {
        const result = await integrationApi.syncAll();
        setLastResult({ kind: "all", data: result });
      } else {
        const syncFn = {
          CUSTOMER: integrationApi.syncCustomers,
          PRODUCT: integrationApi.syncProducts,
          INVENTORY: integrationApi.syncInventory,
          ORDER: integrationApi.syncOrders,
        }[key];
        const result = await syncFn();
        setLastResult({ kind: "single", data: result });
      }
      await Promise.all([fetchStatus(), fetchHistory()]);
    } catch (err) {
      showError(err instanceof ApiError ? err.message : t("priority.syncFailed"));
    } finally {
      setSyncingKey(null);
    }
  }

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-slate-900">{t("priority.title")}</h2>
        <p className="mt-1 text-sm text-slate-500">{t("priority.subtitle")}</p>
      </div>

      <Card className="mb-6 flex items-center gap-3 px-5 py-4">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
          <PriorityIcon className="h-5 w-5" />
        </span>
        <div>
          <p className="text-sm font-semibold text-slate-900">{t("priority.bannerTitle")}</p>
          <p className="text-xs text-slate-500">{t("priority.bannerSubtitle")}</p>
        </div>
        <span className="ms-auto inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          {t("priority.simulatorActive")}
        </span>
      </Card>

      {isStatusLoading && <LoadingState label={t("priority.loading")} />}
      {!isStatusLoading && statusError && <ErrorState message={statusError} onRetry={fetchStatus} />}

      {!isStatusLoading && !statusError && status && (
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <KpiCard
            label={t("priority.kpi.lastSync")}
            value={status.lastSyncAt ? formatDateTime(status.lastSyncAt) : t("priority.kpi.lastSyncNever")}
            icon={PriorityIcon}
            tone="indigo"
          />
          <KpiCard label={t("priority.kpi.totalSyncs")} value={status.totalSyncs.toLocaleString()} icon={PriorityIcon} tone="indigo" />
          <KpiCard label={t("priority.kpi.successful")} value={status.successfulSyncs.toLocaleString()} icon={PriorityIcon} tone="emerald" />
          <KpiCard label={t("priority.kpi.partial")} value={status.partialSyncs.toLocaleString()} icon={PriorityIcon} tone="amber" />
          <KpiCard label={t("priority.kpi.failed")} value={status.failedSyncs.toLocaleString()} icon={PriorityIcon} tone="red" />
        </div>
      )}

      <div className="mb-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <div className="border-b border-slate-200 px-5 py-4">
            <h3 className="text-sm font-semibold text-slate-900">{t("priority.actions.title")}</h3>
            <p className="text-xs text-slate-500">{t("priority.actions.subtitle")}</p>
          </div>
          <div className="grid grid-cols-1 gap-3 p-5 sm:grid-cols-2 lg:grid-cols-3">
            {SYNC_ACTIONS.map((action) => {
              const isSyncing = syncingKey === action.key;
              const isDisabled = syncingKey !== null;
              return (
                <button
                  key={action.key}
                  type="button"
                  onClick={() => handleSync(action.key)}
                  disabled={isDisabled}
                  className="flex items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:border-indigo-300 hover:bg-indigo-50/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSyncing ? (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-indigo-600" />
                  ) : (
                    <action.icon className="h-4 w-4 text-indigo-600" />
                  )}
                  {isSyncing ? t("priority.actions.syncing") : t(action.labelKey)}
                </button>
              );
            })}
          </div>
        </Card>

        <Card>
          <div className="border-b border-slate-200 px-5 py-4">
            <h3 className="text-sm font-semibold text-slate-900">{t("priority.result.title")}</h3>
          </div>
          <div className="p-5">
            {syncingKey && (
              <LoadingState
                label={
                  syncingKey === "ALL"
                    ? t("priority.actions.syncingAll")
                    : t("priority.actions.syncingEntity", { entity: t(`integrationEntity.${syncingKey}`) })
                }
              />
            )}
            {!syncingKey && !lastResult && (
              <EmptyState title={t("priority.result.empty")} description={t("priority.result.emptyDescription")} />
            )}
            {!syncingKey && lastResult && <SyncResultPanel result={lastResult} />}
          </div>
        </Card>
      </div>

      <Card>
        <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">{t("priority.history.title")}</h3>
            <p className="text-xs text-slate-500">{t("priority.history.subtitle")}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <select
              value={entityFilter}
              onChange={(e) => setEntityFilter(e.target.value as IntegrationEntityType | "ALL")}
              className="rounded-md border border-slate-300 py-2 ps-3 pe-8 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {ENTITY_FILTERS.map((option) => (
                <option key={option.value} value={option.value}>
                  {t(`integrationEntity.${option.key}`)}
                </option>
              ))}
            </select>
            <div className="flex gap-2" role="group" aria-label={t("priority.history.filterAriaLabel")}>
              {STATUS_FILTERS.map((filter) => (
                <button
                  key={filter.value}
                  type="button"
                  onClick={() => setStatusFilter(filter.value)}
                  aria-pressed={statusFilter === filter.value}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                    statusFilter === filter.value
                      ? "bg-indigo-600 text-white"
                      : "bg-white text-slate-600 ring-1 ring-inset ring-slate-300 hover:bg-slate-50"
                  }`}
                >
                  {t(`integrationStatus.${filter.key}`)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {isHistoryLoading && <LoadingState label={t("priority.history.loading")} />}
        {!isHistoryLoading && historyError && (
          <div className="p-2">
            <ErrorState message={historyError} onRetry={fetchHistory} />
          </div>
        )}
        {!isHistoryLoading && !historyError && history && history.syncs.length === 0 && (
          <EmptyState
            title={entityFilter !== "ALL" || statusFilter !== "ALL" ? t("priority.history.emptyFilteredTitle") : t("priority.history.emptyTitle")}
            description={t("priority.history.emptyDescription")}
          />
        )}
        {!isHistoryLoading && !historyError && history && history.syncs.length > 0 && (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead>
                  <tr className="text-start text-xs font-medium uppercase tracking-wide text-slate-500">
                    <th scope="col" className="px-5 py-3">{t("priority.history.columns.entity")}</th>
                    <th scope="col" className="px-5 py-3">{t("priority.history.columns.status")}</th>
                    <th scope="col" className="px-5 py-3">{t("priority.history.columns.records")}</th>
                    <th scope="col" className="px-5 py-3 text-right">{t("priority.history.columns.duration")}</th>
                    <th scope="col" className="px-5 py-3">{t("priority.history.columns.date")}</th>
                    <th scope="col" className="sticky end-0 bg-white px-5 py-3 text-end shadow-[0_0_8px_-2px_rgba(0,0,0,0.08)]">
                      {t("priority.history.columns.details")}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {history.syncs.map((sync) => (
                    <tr key={sync.id} className="group hover:bg-slate-50">
                      <td className="whitespace-nowrap px-5 py-3">
                        <IntegrationEntityBadge entity={sync.entity} />
                      </td>
                      <td className="whitespace-nowrap px-5 py-3">
                        <IntegrationSyncStatusBadge status={sync.status} />
                      </td>
                      <td className="whitespace-nowrap px-5 py-3 text-slate-600">
                        {sync.recordsSucceeded}/{sync.recordsProcessed}
                        {sync.recordsFailed > 0 && (
                          <span className="ms-1 text-red-500">
                            {t("priority.history.recordsFailedSuffix", { count: sync.recordsFailed })}
                          </span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-5 py-3 text-right text-slate-600">{t("common.milliseconds", { value: sync.durationMs })}</td>
                      <td className="whitespace-nowrap px-5 py-3 text-slate-500">{formatDateTime(sync.createdAt)}</td>
                      <td className="sticky end-0 whitespace-nowrap bg-white px-5 py-3 text-end shadow-[0_0_8px_-2px_rgba(0,0,0,0.08)] group-hover:bg-slate-50">
                        <button
                          type="button"
                          onClick={() => setSelectedSync(sync)}
                          className="rounded-md border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                        >
                          {t("priority.history.view")}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Pagination
              page={history.pagination.page}
              totalPages={history.pagination.totalPages}
              total={history.pagination.total}
              limit={history.pagination.limit}
              onPageChange={setPage}
            />
          </>
        )}
      </Card>

      <Modal title={t("priority.details.title")} isOpen={selectedSync !== null} onClose={() => setSelectedSync(null)} widthClassName="max-w-xl">
        {selectedSync && (
          <dl className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <dt className="font-medium text-slate-500">{t("priority.details.syncId")}</dt>
              <dd className="font-mono text-xs text-slate-900">{selectedSync.id}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="font-medium text-slate-500">{t("priority.details.entity")}</dt>
              <dd>
                <IntegrationEntityBadge entity={selectedSync.entity} />
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="font-medium text-slate-500">{t("priority.details.status")}</dt>
              <dd>
                <IntegrationSyncStatusBadge status={selectedSync.status} />
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="font-medium text-slate-500">{t("priority.details.startTime")}</dt>
              <dd className="text-slate-900">{formatDateTime(selectedSync.startedAt)}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="font-medium text-slate-500">{t("priority.details.endTime")}</dt>
              <dd className="text-slate-900">{formatDateTime(selectedSync.completedAt)}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="font-medium text-slate-500">{t("priority.details.duration")}</dt>
              <dd className="text-slate-900">{t("common.milliseconds", { value: selectedSync.durationMs })}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="font-medium text-slate-500">{t("priority.details.records")}</dt>
              <dd className="text-slate-900">
                {t("priority.details.recordsSummary", {
                  processed: selectedSync.recordsProcessed,
                  succeeded: selectedSync.recordsSucceeded,
                  failed: selectedSync.recordsFailed,
                })}
              </dd>
            </div>
            {selectedSync.errorMessage && (
              <div>
                <dt className="mb-1 font-medium text-slate-500">{t("priority.details.errorMessage")}</dt>
                <dd className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-red-700">{selectedSync.errorMessage}</dd>
              </div>
            )}
            {selectedSync.payloadSummary && (
              <div>
                <dt className="mb-1 font-medium text-slate-500">{t("priority.details.payloadSummary")}</dt>
                <dd>
                  <pre className="max-h-64 overflow-auto rounded-md bg-slate-900 p-3 text-xs text-slate-100" dir="ltr">
                    {selectedSync.payloadSummary}
                  </pre>
                </dd>
              </div>
            )}
          </dl>
        )}
      </Modal>
    </div>
  );
}
