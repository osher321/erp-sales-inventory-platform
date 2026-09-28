import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import * as customersApi from "../../api/customers.api";
import * as productsApi from "../../api/products.api";
import { ApiError } from "../../api/httpClient";
import type { CreateOrderInput } from "../../api/orders.api";
import { PlusIcon, TrashIcon } from "../icons";
import { LoadingState } from "../ui/StateViews";
import { formatCurrency } from "../../lib/format";
import { useLanguage } from "../../i18n/LanguageContext";
import type { Customer, Product } from "../../types/api";

const VAT_RATE_DISPLAY_ONLY = 0.18;

interface LineItem {
  key: number;
  productId: string;
  quantity: string;
}

let lineItemKeySeq = 0;
function newLineItem(): LineItem {
  return { key: lineItemKeySeq++, productId: "", quantity: "1" };
}

interface CreateOrderFormProps {
  onSubmit: (input: CreateOrderInput) => Promise<void>;
  onCancel: () => void;
}

export function CreateOrderForm({ onSubmit, onCancel }: CreateOrderFormProps) {
  const { t } = useLanguage();
  const [isLoadingOptions, setLoadingOptions] = useState(true);
  const [optionsError, setOptionsError] = useState<string | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const [customerId, setCustomerId] = useState("");
  const [items, setItems] = useState<LineItem[]>([newLineItem()]);

  const [customerError, setCustomerError] = useState<string | null>(null);
  const [itemErrors, setItemErrors] = useState<Record<number, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setSubmitting] = useState(false);

  useEffect(() => {
    // The customer/product pickers use a plain <select> populated once from a
    // single page of results (max 100, the API's page-size ceiling). Fine for
    // this catalog's size; a much larger catalog would need a live search-as-
    // you-type combobox against the existing `search` query param instead.
    setLoadingOptions(true);
    setOptionsError(null);
    Promise.all([customersApi.listCustomers({ limit: 100 }), productsApi.listProducts({ limit: 100 })])
      .then(([customerResult, productResult]) => {
        setCustomers(customerResult.customers);
        setProducts(productResult.products);
      })
      .catch((err) => {
        setOptionsError(err instanceof ApiError ? err.message : t("orders.form.failedToLoadOptions"));
      })
      .finally(() => setLoadingOptions(false));
  }, [t]);

  function productById(id: string): Product | undefined {
    return products.find((p) => p.id === id);
  }

  function updateItem(key: number, patch: Partial<LineItem>) {
    setItems((prev) => prev.map((item) => (item.key === key ? { ...item, ...patch } : item)));
  }

  function addItem() {
    setItems((prev) => [...prev, newLineItem()]);
  }

  function removeItem(key: number) {
    setItems((prev) => (prev.length > 1 ? prev.filter((item) => item.key !== key) : prev));
  }

  function validate(): boolean {
    let valid = true;

    if (!customerId) {
      setCustomerError(t("orders.form.customerRequired"));
      valid = false;
    } else {
      setCustomerError(null);
    }

    const errors: Record<number, string> = {};
    for (const item of items) {
      if (!item.productId) {
        errors[item.key] = t("orders.form.productRequired");
        valid = false;
      } else {
        const quantity = Number(item.quantity);
        if (!item.quantity.trim() || !Number.isInteger(quantity) || quantity < 1) {
          errors[item.key] = t("orders.form.quantityInvalid");
          valid = false;
        }
      }
    }
    setItemErrors(errors);

    return valid;
  }

  const estimatedSubtotal = items.reduce((sum, item) => {
    const product = productById(item.productId);
    const quantity = Number(item.quantity);
    if (!product || !Number.isInteger(quantity) || quantity < 1) return sum;
    return sum + Number(product.price) * quantity;
  }, 0);
  const estimatedVat = estimatedSubtotal * VAT_RATE_DISPLAY_ONLY;
  const estimatedTotal = estimatedSubtotal + estimatedVat;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setServerError(null);
    if (!validate()) return;

    setSubmitting(true);
    try {
      await onSubmit({
        customerId,
        items: items.map((item) => ({ productId: item.productId, quantity: Number(item.quantity) })),
      });
    } catch (err) {
      setServerError(err instanceof ApiError ? err.message : t("orders.form.genericError"));
    } finally {
      setSubmitting(false);
    }
  }

  if (isLoadingOptions) return <LoadingState label={t("orders.form.loadingOptions")} />;
  if (optionsError) {
    return (
      <div role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
        {optionsError}
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

      <div>
        <label htmlFor="order-customer" className="mb-1.5 block text-sm font-medium text-slate-700">
          {t("orders.form.customerLabel")}
        </label>
        <select
          id="order-customer"
          value={customerId}
          onChange={(e) => setCustomerId(e.target.value)}
          aria-invalid={Boolean(customerError)}
          aria-describedby={customerError ? "order-customer-error" : undefined}
          className={`block w-full rounded-md border px-3 py-2 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
            customerError ? "border-red-300" : "border-slate-300"
          }`}
        >
          <option value="">{t("orders.form.customerPlaceholder")}</option>
          {customers.map((customer) => (
            <option key={customer.id} value={customer.id}>
              {t("orders.form.customerOptionLabel", {
                firstName: customer.firstName,
                lastName: customer.lastName,
                customerNumber: customer.customerNumber,
              })}
            </option>
          ))}
        </select>
        {customerError && (
          <p id="order-customer-error" className="mt-1 text-xs text-red-600">
            {customerError}
          </p>
        )}
      </div>

      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <span className="block text-sm font-medium text-slate-700">{t("orders.form.productsLabel")}</span>
          <button
            type="button"
            onClick={addItem}
            className="flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-500"
          >
            <PlusIcon className="h-4 w-4" />
            {t("orders.form.addProduct")}
          </button>
        </div>

        <div className="space-y-3">
          {items.map((item) => {
            const product = productById(item.productId);
            return (
              <div key={item.key} className="rounded-md border border-slate-200 p-3">
                <div className="flex items-start gap-2">
                  <div className="flex-1">
                    <label htmlFor={`order-item-product-${item.key}`} className="sr-only">
                      {t("orders.form.productSrLabel")}
                    </label>
                    <select
                      id={`order-item-product-${item.key}`}
                      value={item.productId}
                      onChange={(e) => updateItem(item.key, { productId: e.target.value })}
                      className={`block w-full rounded-md border px-3 py-2 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                        itemErrors[item.key] ? "border-red-300" : "border-slate-300"
                      }`}
                    >
                      <option value="">{t("orders.form.productPlaceholder")}</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {t("orders.form.productOptionLabel", {
                            name: p.name,
                            sku: p.sku,
                            price: formatCurrency(p.price),
                            stock: p.stockQuantity,
                          })}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="w-24">
                    <label htmlFor={`order-item-quantity-${item.key}`} className="sr-only">
                      {t("orders.form.quantitySrLabel")}
                    </label>
                    <input
                      id={`order-item-quantity-${item.key}`}
                      type="number"
                      min="1"
                      step="1"
                      value={item.quantity}
                      onChange={(e) => updateItem(item.key, { quantity: e.target.value })}
                      className={`block w-full rounded-md border px-3 py-2 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                        itemErrors[item.key] ? "border-red-300" : "border-slate-300"
                      }`}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => removeItem(item.key)}
                    disabled={items.length === 1}
                    aria-label={t("orders.form.removeLine")}
                    className="mt-1 rounded-md p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
                {itemErrors[item.key] && <p className="mt-1.5 text-xs text-red-600">{itemErrors[item.key]}</p>}
                {product && (
                  <p className="mt-1.5 text-xs text-slate-500">
                    {t("orders.form.lineSubtotal", {
                      amount: formatCurrency(Number(product.price) * (Number(item.quantity) || 0)),
                    })}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-md bg-slate-50 px-4 py-3 text-sm">
        <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-400">
          {t("orders.form.estimatedTotalTitle")}
        </p>
        <div className="flex justify-between text-slate-600">
          <span>{t("orders.form.subtotal")}</span>
          <span>{formatCurrency(estimatedSubtotal)}</span>
        </div>
        <div className="flex justify-between text-slate-600">
          <span>{t("orders.form.vat")}</span>
          <span>{formatCurrency(estimatedVat)}</span>
        </div>
        <div className="mt-1 flex justify-between border-t border-slate-200 pt-1 font-semibold text-slate-900">
          <span>{t("orders.form.total")}</span>
          <span>{formatCurrency(estimatedTotal)}</span>
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
          {isSubmitting ? t("orders.form.creating") : t("orders.form.submit")}
        </button>
      </div>
    </form>
  );
}
