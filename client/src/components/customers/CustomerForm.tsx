import { useState } from "react";
import type { FormEvent } from "react";
import { ApiError } from "../../api/httpClient";
import type { CustomerInput } from "../../api/customers.api";
import { useLanguage } from "../../i18n/LanguageContext";

export type CustomerFormValues = CustomerInput;

interface CustomerFormProps {
  initialValues?: CustomerFormValues;
  submitLabel: string;
  onSubmit: (values: CustomerFormValues) => Promise<void>;
  onCancel: () => void;
}

const EMPTY_VALUES: CustomerFormValues = {
  customerNumber: "",
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  address: "",
  city: "",
};

type FieldErrors = Partial<Record<keyof CustomerFormValues, string>>;

const FIELD_LABEL_KEYS: Record<keyof CustomerFormValues, string> = {
  customerNumber: "customers.form.customerNumber",
  firstName: "customers.form.firstName",
  lastName: "customers.form.lastName",
  email: "customers.form.email",
  phone: "customers.form.phone",
  address: "customers.form.address",
  city: "customers.form.city",
};

function validate(values: CustomerFormValues, t: (key: string, params?: Record<string, string | number>) => string): FieldErrors {
  const errors: FieldErrors = {};
  for (const key of Object.keys(EMPTY_VALUES) as (keyof CustomerFormValues)[]) {
    if (!values[key].trim()) {
      errors[key] = t("customers.form.required", { field: t(FIELD_LABEL_KEYS[key]) });
    }
  }
  if (values.email.trim() && !/^\S+@\S+\.\S+$/.test(values.email)) {
    errors.email = t("customers.form.emailInvalid");
  }
  return errors;
}

export function CustomerForm({ initialValues, submitLabel, onSubmit, onCancel }: CustomerFormProps) {
  const { t } = useLanguage();
  const [values, setValues] = useState<CustomerFormValues>(initialValues ?? EMPTY_VALUES);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setSubmitting] = useState(false);

  function updateField(field: keyof CustomerFormValues, value: string) {
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
      await onSubmit(values);
    } catch (err) {
      setServerError(err instanceof ApiError ? err.message : t("customers.form.genericError"));
    } finally {
      setSubmitting(false);
    }
  }

  function renderField(field: keyof CustomerFormValues, type = "text") {
    const inputId = `customer-${field}`;
    const errorId = `${inputId}-error`;
    return (
      <div>
        <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-slate-700">
          {t(FIELD_LABEL_KEYS[field])}
        </label>
        <input
          id={inputId}
          name={field}
          type={type}
          value={values[field]}
          onChange={(e) => updateField(field, e.target.value)}
          aria-invalid={Boolean(fieldErrors[field])}
          aria-describedby={fieldErrors[field] ? errorId : undefined}
          className={`block w-full rounded-md border px-3 py-2 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
            fieldErrors[field] ? "border-red-300" : "border-slate-300"
          }`}
        />
        {fieldErrors[field] && (
          <p id={errorId} className="mt-1 text-xs text-red-600">
            {fieldErrors[field]}
          </p>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {serverError && (
        <div role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {serverError}
        </div>
      )}

      {renderField("customerNumber")}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {renderField("firstName")}
        {renderField("lastName")}
      </div>

      {renderField("email", "email")}
      {renderField("phone", "tel")}
      {renderField("address")}
      {renderField("city")}

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
