import { useState } from "react";
import type { FormEvent } from "react";
import { ApiError } from "../../api/httpClient";
import type { ProductInput } from "../../api/products.api";
import { useLanguage } from "../../i18n/LanguageContext";

export interface ProductFormValues {
  sku: string;
  name: string;
  description: string;
  category: string;
  price: string;
  stockQuantity: string;
  minimumStock: string;
}

interface ProductFormProps {
  initialValues?: ProductFormValues;
  submitLabel: string;
  onSubmit: (values: ProductInput) => Promise<void>;
  onCancel: () => void;
}

const EMPTY_VALUES: ProductFormValues = {
  sku: "",
  name: "",
  description: "",
  category: "",
  price: "",
  stockQuantity: "",
  minimumStock: "",
};

type FieldErrors = Partial<Record<keyof ProductFormValues, string>>;
type TFn = (key: string, params?: Record<string, string | number>) => string;

function validate(values: ProductFormValues, t: TFn): FieldErrors {
  const errors: FieldErrors = {};

  if (!values.sku.trim()) errors.sku = t("products.form.skuRequired");
  if (!values.name.trim()) errors.name = t("products.form.nameRequired");
  if (!values.category.trim()) errors.category = t("products.form.categoryRequired");

  if (!values.price.trim()) {
    errors.price = t("products.form.priceRequired");
  } else if (Number.isNaN(Number(values.price)) || Number(values.price) < 0) {
    errors.price = t("products.form.priceNegative");
  }

  if (!values.stockQuantity.trim()) {
    errors.stockQuantity = t("products.form.stockRequired");
  } else if (!Number.isInteger(Number(values.stockQuantity)) || Number(values.stockQuantity) < 0) {
    errors.stockQuantity = t("products.form.stockNegative");
  }

  if (!values.minimumStock.trim()) {
    errors.minimumStock = t("products.form.minStockRequired");
  } else if (!Number.isInteger(Number(values.minimumStock)) || Number(values.minimumStock) < 0) {
    errors.minimumStock = t("products.form.minStockNegative");
  }

  return errors;
}

export function ProductForm({ initialValues, submitLabel, onSubmit, onCancel }: ProductFormProps) {
  const { t } = useLanguage();
  const [values, setValues] = useState<ProductFormValues>(initialValues ?? EMPTY_VALUES);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setSubmitting] = useState(false);

  function updateField(field: keyof ProductFormValues, value: string) {
    setValues((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setServerError(null);

    const errors = validate(values, t);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSubmitting(true);
    try {
      await onSubmit({
        sku: values.sku.trim(),
        name: values.name.trim(),
        description: values.description.trim() || undefined,
        category: values.category.trim(),
        price: Number(values.price),
        stockQuantity: Number(values.stockQuantity),
        minimumStock: Number(values.minimumStock),
      });
    } catch (err) {
      setServerError(err instanceof ApiError ? err.message : t("products.form.genericError"));
    } finally {
      setSubmitting(false);
    }
  }

  function fieldClass(field: keyof ProductFormValues) {
    return `block w-full rounded-md border px-3 py-2 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
      fieldErrors[field] ? "border-red-300" : "border-slate-300"
    }`;
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {serverError && (
        <div role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {serverError}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="product-sku" className="mb-1.5 block text-sm font-medium text-slate-700">
            {t("products.form.sku")}
          </label>
          <input
            id="product-sku"
            value={values.sku}
            onChange={(e) => updateField("sku", e.target.value)}
            aria-invalid={Boolean(fieldErrors.sku)}
            aria-describedby={fieldErrors.sku ? "product-sku-error" : undefined}
            className={fieldClass("sku")}
          />
          {fieldErrors.sku && (
            <p id="product-sku-error" className="mt-1 text-xs text-red-600">
              {fieldErrors.sku}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="product-name" className="mb-1.5 block text-sm font-medium text-slate-700">
            {t("products.form.name")}
          </label>
          <input
            id="product-name"
            value={values.name}
            onChange={(e) => updateField("name", e.target.value)}
            aria-invalid={Boolean(fieldErrors.name)}
            aria-describedby={fieldErrors.name ? "product-name-error" : undefined}
            className={fieldClass("name")}
          />
          {fieldErrors.name && (
            <p id="product-name-error" className="mt-1 text-xs text-red-600">
              {fieldErrors.name}
            </p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="product-description" className="mb-1.5 block text-sm font-medium text-slate-700">
          {t("products.form.description")} <span className="font-normal text-slate-400">({t("common.optional")})</span>
        </label>
        <textarea
          id="product-description"
          rows={2}
          value={values.description}
          onChange={(e) => updateField("description", e.target.value)}
          className="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div>
        <label htmlFor="product-category" className="mb-1.5 block text-sm font-medium text-slate-700">
          {t("products.form.category")}
        </label>
        <input
          id="product-category"
          value={values.category}
          onChange={(e) => updateField("category", e.target.value)}
          aria-invalid={Boolean(fieldErrors.category)}
          aria-describedby={fieldErrors.category ? "product-category-error" : undefined}
          className={fieldClass("category")}
        />
        {fieldErrors.category && (
          <p id="product-category-error" className="mt-1 text-xs text-red-600">
            {fieldErrors.category}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="product-price" className="mb-1.5 block text-sm font-medium text-slate-700">
            {t("products.form.price")}
          </label>
          <input
            id="product-price"
            type="number"
            step="0.01"
            min="0"
            value={values.price}
            onChange={(e) => updateField("price", e.target.value)}
            aria-invalid={Boolean(fieldErrors.price)}
            aria-describedby={fieldErrors.price ? "product-price-error" : undefined}
            className={fieldClass("price")}
          />
          {fieldErrors.price && (
            <p id="product-price-error" className="mt-1 text-xs text-red-600">
              {fieldErrors.price}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="product-stockQuantity" className="mb-1.5 block text-sm font-medium text-slate-700">
            {t("products.form.stockQuantity")}
          </label>
          <input
            id="product-stockQuantity"
            type="number"
            step="1"
            min="0"
            value={values.stockQuantity}
            onChange={(e) => updateField("stockQuantity", e.target.value)}
            aria-invalid={Boolean(fieldErrors.stockQuantity)}
            aria-describedby={fieldErrors.stockQuantity ? "product-stockQuantity-error" : undefined}
            className={fieldClass("stockQuantity")}
          />
          {fieldErrors.stockQuantity && (
            <p id="product-stockQuantity-error" className="mt-1 text-xs text-red-600">
              {fieldErrors.stockQuantity}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="product-minimumStock" className="mb-1.5 block text-sm font-medium text-slate-700">
            {t("products.form.minimumStock")}
          </label>
          <input
            id="product-minimumStock"
            type="number"
            step="1"
            min="0"
            value={values.minimumStock}
            onChange={(e) => updateField("minimumStock", e.target.value)}
            aria-invalid={Boolean(fieldErrors.minimumStock)}
            aria-describedby={fieldErrors.minimumStock ? "product-minimumStock-error" : undefined}
            className={fieldClass("minimumStock")}
          />
          {fieldErrors.minimumStock && (
            <p id="product-minimumStock-error" className="mt-1 text-xs text-red-600">
              {fieldErrors.minimumStock}
            </p>
          )}
        </div>
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
          {isSubmitting ? t("common.saving") : submitLabel}
        </button>
      </div>
    </form>
  );
}
