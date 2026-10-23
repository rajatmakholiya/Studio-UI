"use client";

import { Loader2 } from "lucide-react";
import { CustomRange } from "@/features/critical-flow/components/CfHeader";
import { PERIOD_PRESETS, periodLabel, type PeriodKey } from "../periods";

interface Props {
  period: PeriodKey;
  startDate: string;
  endDate: string;
  loading: boolean;
  onPreset: (key: Exclude<PeriodKey, "custom">) => void;
  onCustom: (startDate: string, endDate: string) => void;
}

export default function RoundupHeader({ period, startDate, endDate, loading, onPreset, onCustom }: Props) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-center gap-2 px-1">
        <p className="text-sm font-semibold text-gray-900 dark:text-white">{periodLabel(startDate, endDate)}</p>
        {loading && <Loader2 size={14} className="animate-spin text-gray-400" />}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap items-center gap-0.5 rounded-lg border border-gray-200 p-0.5 dark:border-gray-700" role="group" aria-label="Period">
          {PERIOD_PRESETS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => onPreset(key)}
              aria-pressed={period === key}
              className={`rounded-md px-2 py-1 text-[11px] font-medium transition-colors ${
                period === key
                  ? "bg-indigo-600 text-white"
                  : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <CustomRange active={period === "custom"} start={startDate} end={endDate} onApply={onCustom} />
      </div>
    </div>
  );
}
