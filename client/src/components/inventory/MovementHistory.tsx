import { useEffect, useState } from "react";
import * as inventoryApi from "../../api/inventory.api";
import { ApiError } from "../../api/httpClient";
import { EmptyState, ErrorState, LoadingState } from "../ui/StateViews";
import { formatDateTime } from "../../lib/format";
import { useLanguage } from "../../i18n/LanguageContext";
import type { InventoryMovement, InventoryMovementType } from "../../types/api";

const MOVEMENT_TYPE_STYLES: Record<InventoryMovementType, string> = {
  STOCK_IN: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  STOCK_OUT: "bg-amber-50 text-amber-700 ring-amber-600/20",
  ADJUSTMENT: "bg-blue-50 text-blue-700 ring-blue-600/20",
  SALE: "bg-violet-50 text-violet-700 ring-violet-600/20",
  RETURN: "bg-slate-100 text-slate-600 ring-slate-500/10",
};

function MovementTypeBadge({ type }: { type: InventoryMovementType }) {
  const { t } = useLanguage();
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${MOVEMENT_TYPE_STYLES[type]}`}>
      {t(`inventory.history.types.${type}`)}
    </span>
  );
}

export function MovementHistory({ productId }: { productId: string }) {
  const { t } = useLanguage();
  const [movements, setMovements] = useState<InventoryMovement[] | null>(null);
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    inventoryApi
      .getMovements(productId)
      .then((result) => {
        if (!cancelled) setMovements(result);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof ApiError ? err.message : t("inventory.history.failedToLoad"));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [productId, t]);

  if (isLoading) return <LoadingState label={t("inventory.history.loading")} />;
  if (error) return <ErrorState message={error} />;
  if (!movements || movements.length === 0) {
    return <EmptyState title={t("inventory.history.emptyTitle")} description={t("inventory.history.emptyDescription")} />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead>
          <tr className="text-start text-xs font-medium uppercase tracking-wide text-slate-500">
            <th scope="col" className="py-2 pe-4">{t("inventory.history.columns.type")}</th>
            <th scope="col" className="py-2 pe-4 text-right">{t("inventory.history.columns.quantity")}</th>
            <th scope="col" className="py-2 pe-4 text-right">{t("inventory.history.columns.previous")}</th>
            <th scope="col" className="py-2 pe-4 text-right">{t("inventory.history.columns.new")}</th>
            <th scope="col" className="py-2 pe-4">{t("inventory.history.columns.reason")}</th>
            <th scope="col" className="py-2 pe-4">{t("inventory.history.columns.createdAt")}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {movements.map((movement) => (
            <tr key={movement.id}>
              <td className="whitespace-nowrap py-2.5 pe-4">
                <MovementTypeBadge type={movement.type} />
              </td>
              <td className="whitespace-nowrap py-2.5 pe-4 text-right text-slate-700">{movement.quantity}</td>
              <td className="whitespace-nowrap py-2.5 pe-4 text-right text-slate-500">{movement.previousQuantity}</td>
              <td className="whitespace-nowrap py-2.5 pe-4 text-right text-slate-900">{movement.newQuantity}</td>
              <td className="py-2.5 pe-4 text-slate-600">{movement.reason ?? t("inventory.history.noReason")}</td>
              <td className="whitespace-nowrap py-2.5 pe-4 text-slate-500">{formatDateTime(movement.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
