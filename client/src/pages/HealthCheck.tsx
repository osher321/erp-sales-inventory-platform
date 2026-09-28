import { useEffect, useState } from "react";
import { apiFetch } from "../api/client";

type HealthResponse = { status: string };

export default function HealthCheck() {
  const [status, setStatus] = useState<"loading" | "online" | "offline">("loading");

  useEffect(() => {
    apiFetch<HealthResponse>("/api/health")
      .then((res) => setStatus(res.status === "ok" ? "online" : "offline"))
      .catch(() => setStatus("offline"));
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-medium text-indigo-600">ERP Sales &amp; Inventory Integration Platform</p>
        <h1 className="mt-1 text-2xl font-semibold text-slate-900">Project scaffold ready</h1>
        <p className="mt-2 text-sm text-slate-500">
          Frontend (React + Vite + Tailwind) and backend (Express + TypeScript) are wired together.
        </p>

        <div className="mt-6 flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
          <span
            className={
              "h-2.5 w-2.5 rounded-full " +
              (status === "online"
                ? "bg-emerald-500"
                : status === "offline"
                  ? "bg-red-500"
                  : "bg-amber-400 animate-pulse")
            }
          />
          <span className="text-sm text-slate-700">
            API status:{" "}
            <span className="font-medium">
              {status === "loading" ? "Checking..." : status === "online" ? "Connected" : "Unreachable"}
            </span>
          </span>
        </div>

        <p className="mt-4 text-xs text-slate-400">
          Data above is fetched live from <code className="text-slate-500">GET /api/health</code> — not hard-coded.
        </p>
      </div>
    </div>
  );
}
