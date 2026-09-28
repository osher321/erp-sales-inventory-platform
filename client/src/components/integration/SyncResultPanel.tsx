import { IntegrationEntityBadge, IntegrationSyncStatusBadge } from "../ui/Badge";
import { useLanguage } from "../../i18n/LanguageContext";
import type { IntegrationSync, IntegrationSyncAllResult } from "../../types/api";

export type SyncResult = { kind: "single"; data: IntegrationSync } | { kind: "all"; data: IntegrationSyncAllResult };

function RecordCounts({ processed, succeeded, failed }: { processed: number; succeeded: number; failed: number }) {
  const { t } = useLanguage();
  return (
    <div className="grid grid-cols-3 gap-3 text-center">
      <div>
        <p className="text-lg font-semibold text-slate-900">{processed}</p>
        <p className="text-xs text-slate-500">{t("priority.result.processed")}</p>
      </div>
      <div>
        <p className="text-lg font-semibold text-emerald-600">{succeeded}</p>
        <p className="text-xs text-slate-500">{t("priority.result.successful")}</p>
      </div>
      <div>
        <p className="text-lg font-semibold text-red-600">{failed}</p>
        <p className="text-xs text-slate-500">{t("priority.result.failed")}</p>
      </div>
    </div>
  );
}

export function SyncResultPanel({ result }: { result: SyncResult }) {
  const { t } = useLanguage();

  if (result.kind === "single") {
    const sync = result.data;
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <IntegrationEntityBadge entity={sync.entity} />
            <IntegrationSyncStatusBadge status={sync.status} />
          </div>
          <span className="text-xs text-slate-500">{t("common.milliseconds", { value: sync.durationMs })}</span>
        </div>
        <RecordCounts processed={sync.recordsProcessed} succeeded={sync.recordsSucceeded} failed={sync.recordsFailed} />
        {sync.errorMessage && (
          <div role="alert" className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            {sync.errorMessage}
          </div>
        )}
      </div>
    );
  }

  const all = result.data;
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-700">{t("priority.result.allEntities")}</span>
        <IntegrationSyncStatusBadge status={all.status} />
      </div>
      <RecordCounts processed={all.recordsProcessed} succeeded={all.recordsSucceeded} failed={all.recordsFailed} />
      <div className="space-y-2 border-t border-slate-200 pt-3">
        {all.results.map((sync) => (
          <div key={sync.id} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <IntegrationEntityBadge entity={sync.entity} />
              <IntegrationSyncStatusBadge status={sync.status} />
            </div>
            <span className="text-slate-500">
              {t("priority.result.succeeded", { succeeded: sync.recordsSucceeded, processed: sync.recordsProcessed })}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
