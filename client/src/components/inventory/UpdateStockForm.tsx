import { useState } from "react";
import type { FormEvent } from "react";
import { ApiError } from "../../api/httpClient";
import type { UpdateStockInput } from "../../api/inventory.api";
import type { InventoryItem } from "../../types/api";
import { useLanguage } from "../../i18n/LanguageContext";

interface UpdateStockFormProps {
  item: InventoryItem;
  onSubmit: (values: UpdateStockInput) => Promise<void>;
  onCancel: () => void;
}

export function UpdateStockForm({ item, onSubmit, onCancel }: UpdateStockFormProps) {
  const { t } = useLanguage();
  const [stockQuantity, setStockQuantity] = useState(String(item.stockQuantity));
  const [reason, setReason] = useState("");
  const [quantityError, setQuantityError] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setSubmitting] = useState(false);

  function validate(): boolean {
    if (!stockQuantity.trim()) {
      setQuantityError(t("inventory.form.quantityRequired"));
      return false;
    }
    const value = Number(stockQuantity);
    if (!Number.isInteger(value) || value < 0) {
      setQuantityError(t("inventory.form.quantityNegative"));
      return false;
    }
    setQuantityError(null);
    return true;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setServerError(null);
    if (!validate()) return;

    setSubmitting(true);
    try {
      await onSubmit({
        stockQuantity: Number(stockQuantity),
        reason: reason.trim() || undefined,
      });
    } catch (err) {
      setServerError(err instanceof ApiError ? err.message : t("inventory.form.genericError"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {serverError && (
        <div role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {serverError}
        </div>
      )}

      <div className="rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-600">
        <p className="font-medium text-slate-900">{item.productName}</p>
        <p className="text-xs text-slate-500">
          {t("inventory.columns.sku")}: {item.sku} · {t("inventory.form.minimumStockLabel")}: {item.minimumStock}
        </p>
      </div>

      <div>
        <label htmlFor="stock-quantity" className="mb-1.5 block text-sm font-medium text-slate-700">
          {t("inventory.form.newStockQuantity")}
        </label>
        <input
          id="stock-quantity"
          type="number"
          step="1"
          min="0"
          value={stockQuantity}
          onChange={(e) => setStockQuantity(e.target.value)}
          aria-invalid={Boolean(quantityError)}
          aria-describedby={quantityError ? "stock-quantity-error" : undefined}
          className={`block w-full rounded-md border px-3 py-2 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
            quantityError ? "border-red-300" : "border-slate-300"
          }`}
        />
        {quantityError && (
          <p id="stock-quantity-error" className="mt-1 text-xs text-red-600">
            {quantityError}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="stock-reason" className="mb-1.5 block text-sm font-medium text-slate-700">
          {t("inventory.form.reason")} <span className="font-normal text-slate-400">({t("common.optional")})</span>
        </label>
        <input
          id="stock-reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder={t("inventory.form.reasonPlaceholder")}
          className="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-slate-300 px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        >
          {t("common.cancel")}
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex items-center gap-2 rounded-md bg-indigo-600 px-3.5 py-2 text-sm font-semibold text-white hover:bg-indigo-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting && <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
          {isSubmitting ? t("common.saving") : t("inventory.form.submit")}
        </button>
      </div>
    </form>
  );
}
