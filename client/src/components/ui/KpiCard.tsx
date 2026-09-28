import type { ComponentType, SVGProps } from "react";

type Tone = "indigo" | "emerald" | "amber" | "red" | "slate";

const TONE_STYLES: Record<Tone, string> = {
  indigo: "bg-indigo-50 text-indigo-600",
  emerald: "bg-emerald-50 text-emerald-600",
  amber: "bg-amber-50 text-amber-600",
  red: "bg-red-50 text-red-600",
  slate: "bg-slate-100 text-slate-600",
};

interface KpiCardProps {
  label: string;
  value: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  tone?: Tone;
}

export function KpiCard({ label, value, icon: Icon, tone = "indigo" }: KpiCardProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">{value}</p>
        </div>
        <span className={`rounded-lg p-2.5 ${TONE_STYLES[tone]}`}>
          <Icon className="h-5 w-5" />
        </span>
      </div>
    </div>
  );
}
