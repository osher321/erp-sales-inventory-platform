import { useMemo, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { formatCurrency, formatDate } from "../../lib/format";
import { useLanguage } from "../../i18n/LanguageContext";
import type { DailyRevenuePoint } from "../../services/dashboard.service";

const SERIES_COLOR = "#4f46e5"; // indigo-600, the app's primary brand hue
const WIDTH = 600;
const HEIGHT = 220;
const PADDING = { top: 16, right: 16, bottom: 28, left: 60 };
const INNER_WIDTH = WIDTH - PADDING.left - PADDING.right;
const INNER_HEIGHT = HEIGHT - PADDING.top - PADDING.bottom;

function niceCeiling(value: number): number {
  if (value <= 0) return 100;
  const exponent = Math.floor(Math.log10(value));
  const magnitude = 10 ** exponent;
  const residual = value / magnitude;
  const niceResidual = residual <= 1 ? 1 : residual <= 2 ? 2 : residual <= 5 ? 5 : 10;
  return niceResidual * magnitude;
}

interface SalesOverviewChartProps {
  data: DailyRevenuePoint[];
}

export function SalesOverviewChart({ data }: SalesOverviewChartProps) {
  const { t } = useLanguage();
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const { points, maxValue, xTickIndices, yTicks } = useMemo(() => {
    const n = data.length;
    const maxRevenue = Math.max(...data.map((d) => d.revenue), 0);
    const max = niceCeiling(maxRevenue || 1);

    const pts = data.map((d, i) => ({
      x: PADDING.left + (n > 1 ? (i / (n - 1)) * INNER_WIDTH : INNER_WIDTH / 2),
      y: PADDING.top + INNER_HEIGHT - (d.revenue / max) * INNER_HEIGHT,
      ...d,
    }));

    const tickCount = Math.min(6, n);
    const step = tickCount > 1 ? Math.floor((n - 1) / (tickCount - 1)) : 0;
    const xTicks = tickCount <= 1 ? [0] : Array.from({ length: tickCount }, (_, i) => Math.min(i * step, n - 1));

    const yTickValues = [0, max * 0.25, max * 0.5, max * 0.75, max];

    return { points: pts, maxValue: max, xTickIndices: Array.from(new Set(xTicks)), yTicks: yTickValues };
  }, [data]);

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (!containerRef.current || points.length === 0) return;
    const rect = containerRef.current.getBoundingClientRect();
    const relativeX = ((event.clientX - rect.left) / rect.width) * WIDTH;
    let nearest = 0;
    let nearestDist = Infinity;
    points.forEach((p, i) => {
      const dist = Math.abs(p.x - relativeX);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = i;
      }
    });
    setHoverIndex(nearest);
  }

  if (points.length === 0) return null;

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${PADDING.top + INNER_HEIGHT} L ${points[0].x} ${PADDING.top + INNER_HEIGHT} Z`;
  const last = points[points.length - 1];
  const hovered = hoverIndex !== null ? points[hoverIndex] : null;

  return (
    <div
      ref={containerRef}
      dir="ltr"
      className="relative"
      onPointerMove={handlePointerMove}
      onPointerLeave={() => setHoverIndex(null)}
    >
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full" role="img" aria-label={t("dashboard.salesOverview.chartAriaLabel")}>
        {yTicks.map((tick) => {
          const y = PADDING.top + INNER_HEIGHT - (tick / maxValue) * INNER_HEIGHT;
          return (
            <g key={tick}>
              <line x1={PADDING.left} x2={WIDTH - PADDING.right} y1={y} y2={y} stroke="#e2e8f0" strokeWidth={1} />
              <text x={PADDING.left - 8} y={y} textAnchor="end" dominantBaseline="middle" className="fill-slate-400 text-[9px]">
                {formatCurrency(tick).replace(/\.00$/, "")}
              </text>
            </g>
          );
        })}

        {xTickIndices.map((i) => (
          <text
            key={i}
            x={points[i].x}
            y={HEIGHT - 8}
            textAnchor="middle"
            className="fill-slate-400 text-[9px]"
          >
            {formatDate(points[i].date).replace(/, \d{4}$/, "")}
          </text>
        ))}

        <path d={areaPath} fill={SERIES_COLOR} fillOpacity={0.1} stroke="none" />
        <path d={linePath} fill="none" stroke={SERIES_COLOR} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />

        <circle cx={last.x} cy={last.y} r={6} fill="white" />
        <circle cx={last.x} cy={last.y} r={4} fill={SERIES_COLOR} />
        <text x={last.x} y={last.y - 12} textAnchor="end" className="fill-slate-700 text-[10px] font-semibold">
          {formatCurrency(last.revenue)}
        </text>

        {hovered && (
          <>
            <line
              x1={hovered.x}
              x2={hovered.x}
              y1={PADDING.top}
              y2={PADDING.top + INNER_HEIGHT}
              stroke="#94a3b8"
              strokeWidth={1}
            />
            <circle cx={hovered.x} cy={hovered.y} r={6} fill="white" />
            <circle cx={hovered.x} cy={hovered.y} r={4} fill={SERIES_COLOR} />
          </>
        )}
      </svg>

      {hovered && (
        <div
          className="pointer-events-none absolute rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs shadow-md"
          style={{
            left: `${(hovered.x / WIDTH) * 100}%`,
            top: `${(hovered.y / HEIGHT) * 100}%`,
            transform: "translate(-50%, -130%)",
          }}
        >
          <p className="font-semibold text-slate-900">{formatCurrency(hovered.revenue)}</p>
          <p className="text-slate-500">{formatDate(hovered.date)}</p>
        </div>
      )}
    </div>
  );
}
