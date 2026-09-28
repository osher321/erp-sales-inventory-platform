import { ORDER_STATUSES } from "../../lib/orderStatus";
import { useLanguage } from "../../i18n/LanguageContext";
import type { OrderStatus } from "../../types/api";

// Validated categorical palette (node scripts/validate_palette.js) — passes
// lightness band, chroma floor, CVD separation (adjacent pairs), normal-vision
// floor, and contrast, in both light and dark surfaces. Every bar also always
// carries its status name + count as a direct text label, so identity never
// depends on color alone even where the CVD floor is tight.
const STATUS_COLORS: Record<OrderStatus, string> = {
  DRAFT: "#0d9488",
  PENDING: "#d97706",
  CONFIRMED: "#2563eb",
  SHIPPED: "#a21caf",
  COMPLETED: "#059669",
  CANCELLED: "#dc2626",
};

interface OrdersStatusChartProps {
  counts: Record<OrderStatus, number>;
}

export function OrdersStatusChart({ counts }: OrdersStatusChartProps) {
  const { t } = useLanguage();
  const maxCount = Math.max(1, ...ORDER_STATUSES.map((status) => counts[status]));

  return (
    <div className="space-y-3 px-5 py-4">
      {ORDER_STATUSES.map((status) => {
        const count = counts[status];
        const widthPct = (count / maxCount) * 100;
        return (
          <div key={status} tabIndex={0} className="group flex items-center gap-3 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">
            <span className="w-20 shrink-0 text-xs font-medium text-slate-600">{t(`orderStatus.${status}`)}</span>
            <div className="h-6 flex-1 overflow-hidden rounded bg-slate-100">
              <div
                className="h-full rounded transition-[width]"
                style={{ width: `${Math.max(widthPct, count > 0 ? 3 : 0)}%`, backgroundColor: STATUS_COLORS[status] }}
              />
            </div>
            <span className="w-8 shrink-0 text-end text-sm font-semibold tabular-nums text-slate-900">{count}</span>
          </div>
        );
      })}
    </div>
  );
}
