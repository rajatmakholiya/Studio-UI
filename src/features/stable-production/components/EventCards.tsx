"use client";

import { useState } from "react";
import type { StableEventStats } from "../types";
import { fmtInt, fmtPct } from "@/features/critical-flow/format";
import { FALLBACK_EVENT_COLOR, stageSegments } from "../palette";
import { LoadingBlock, Panel, SegmentBar, SportTag, stageBarSegments } from "./Bits";

type View = "all" | "open" | "done";

/**
 * One card per event tab, in the workbook's own order (the desk keeps the
 * newest event leftmost). Clicking a card narrows the whole page to it.
 */
export default function EventCards({
  data,
  isLoading,
  colors,
  selected,
  onToggle,
}: {
  data?: StableEventStats[];
  isLoading: boolean;
  colors: Map<string, string>;
  selected: string[];
  onToggle: (event: string) => void;
}) {
  const [view, setView] = useState<View>("all");
  if (isLoading) return <LoadingBlock height="h-96" />;
  const all = data ?? [];
  const rows = all.filter((e) => (view === "open" ? e.open > 0 : view === "done" ? e.open === 0 : true));
  const openCount = all.filter((e) => e.open > 0).length;

  return (
    <Panel
      title="Events"
      subtitle="Each tab in the Stable sheet, newest first — click cards to focus the page on those events"
      actions={
        <div className="flex items-center gap-0.5 rounded-lg border border-gray-200 p-0.5 dark:border-gray-700">
          {(
            [
              ["all", `All ${all.length}`],
              ["open", `Open work ${openCount}`],
              ["done", `Complete ${all.length - openCount}`],
            ] as [View, string][]
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setView(key)}
              className={`rounded-md px-2 py-1 text-[11px] font-medium transition-colors ${
                view === key
                  ? "bg-indigo-600 text-white"
                  : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      }
    >
      {rows.length === 0 ? (
        <p className="py-8 text-center text-xs text-gray-400">No events match</p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {rows.map((e) => {
            const color = colors.get(e.event) ?? FALLBACK_EVENT_COLOR;
            const active = selected.includes(e.event);
            const dimmed = selected.length > 0 && !active;
            const segments = stageBarSegments(stageSegments(e));
            const topTypes = e.stableTypes.slice(0, 3);
            return (
              <button
                key={e.event}
                onClick={() => onToggle(e.event)}
                className={`relative overflow-hidden rounded-xl border bg-white p-3 pl-4 text-left transition hover:shadow-md hover:opacity-100 dark:bg-gray-900 ${
                  active
                    ? "border-indigo-400 ring-2 ring-indigo-400/30 dark:border-indigo-500"
                    : "border-gray-200 dark:border-gray-800"
                } ${dimmed ? "opacity-50" : ""}`}
              >
                <span className="absolute inset-y-0 left-0 w-1.5" style={{ backgroundColor: color }} />
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-gray-900 dark:text-white" title={e.event}>
                      {e.event}
                    </p>
                    <div className="mt-1 flex items-center gap-1.5">
                      <SportTag sport={e.sport} />
                      {e.open > 0 ? (
                        <span className="rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
                          {fmtInt(e.open)} open
                        </span>
                      ) : (
                        <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                          Complete
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold tabular-nums leading-none" style={{ color }}>
                      {fmtPct(e.completionRate)}
                    </p>
                    <p className="mt-0.5 text-[10px] text-gray-400">verified</p>
                  </div>
                </div>

                <div className="mt-3">
                  <SegmentBar segments={segments} height={7} />
                </div>

                <div className="mt-2 grid grid-cols-4 gap-1 text-center">
                  {[
                    ["Allotted", e.allotted],
                    ["Submitted", e.submitted],
                    ["Verified", e.verified],
                    ["Sched.", e.published],
                  ].map(([label, v]) => (
                    <div key={label as string}>
                      <p className="text-xs font-semibold tabular-nums text-gray-800 dark:text-gray-200">
                        {fmtInt(v as number)}
                      </p>
                      <p className="text-[10px] text-gray-400">{label}</p>
                    </div>
                  ))}
                </div>

                <p className="mt-2 truncate text-[10px] text-gray-400" title={e.stableTypes.map((t) => `${t.name} ${t.count}`).join(" · ")}>
                  {topTypes.map((t) => `${t.name} ${t.count}`).join(" · ")}
                  {e.writers.length > 0 && ` · ${e.writers.length} writer${e.writers.length > 1 ? "s" : ""}`}
                </p>
              </button>
            );
          })}
        </div>
      )}
    </Panel>
  );
}
