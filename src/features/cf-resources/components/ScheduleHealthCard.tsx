"use client";

import { FileWarning } from "lucide-react";
import type { ScheduleHealthResult } from "@/features/critical-flow/types";

interface Props {
  data?: ScheduleHealthResult;
  isLoading: boolean;
}

/**
 * Where the schedule workbook and the content disagree. Every flag here is
 * something a manager can fix in a sheet, and each one makes the board more
 * trustworthy when fixed.
 */
export default function ScheduleHealthCard({ data, isLoading }: Props) {
  if (isLoading || !data) {
    return <div className="h-40 animate-pulse rounded-2xl border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-800/50" />;
  }

  const empty = data.sheetConfigured && data.people === 0;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-baseline justify-between">
        <h2 className="flex items-center gap-1.5 text-sm font-semibold text-gray-900 dark:text-white">
          <FileWarning size={14} className="text-amber-500" />
          Team Structure Health
        </h2>
        <span className="text-[11px] text-gray-400">
          {data.sheetConfigured
            ? [`${data.people} people`, data.leaves && `${data.leaves} leave records`, data.quotas && `${data.quotas} quota rows`]
                .filter(Boolean)
                .join(" · ")
            : "resources sheet not configured"}
        </span>
      </div>

      {!data.sheetConfigured && (
        <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
          Neither <code>RESOURCES_SHEET_ID</code> nor <code>CF_SHEET_ID</code> is set, so there is no People / Leaves / Quotas tab to read — the board can only list people found in the content.
        </p>
      )}
      {empty && (
        <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
          No people synced yet. The n8n Critical Flow workflow fills the People tab from Team Structure — check its Resources Log tab.
        </p>
      )}
      {data.syncError && (
        <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:bg-rose-500/10 dark:text-rose-400">
          Last sync failed: {data.syncError}
          {data.lastSyncTime ? " — showing the data from the previous good sync." : ""}
        </p>
      )}

      <div className="mt-3 space-y-2">
        {data.flags.map((f) => (
          <div key={f.issue} className="rounded-xl border border-gray-100 bg-gray-50/60 p-3 dark:border-gray-800 dark:bg-gray-800/30">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-medium text-gray-900 dark:text-white">{f.issue}</p>
                <p className="mt-0.5 text-[11px] text-gray-400 dark:text-gray-500">{f.detail}</p>
                {f.items.length > 0 && (
                  <p className="mt-1 truncate text-[11px] text-gray-600 dark:text-gray-300" title={f.items.join(", ")}>
                    {f.items.join(" · ")}
                  </p>
                )}
              </div>
              <span className="shrink-0 rounded-lg bg-amber-50 px-2 py-1 text-xs font-semibold tabular-nums text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
                {f.count}
              </span>
            </div>
          </div>
        ))}
        {data.flags.length === 0 && data.sheetConfigured && !empty && (
          <p className="py-4 text-center text-xs text-gray-400">The schedule sheet and the content agree</p>
        )}
      </div>
    </div>
  );
}
