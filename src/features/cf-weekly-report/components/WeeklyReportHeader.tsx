"use client";

import { CalendarRange, ChevronLeft, ChevronRight } from "lucide-react";
import type { WeeklyReport } from "../types";
import { shortDate } from "../format";

interface Props {
  report?: WeeklyReport;
  /** Move the four-week window by this many weeks. */
  onShift: (weeks: number) => void;
}

export default function WeeklyReportHeader({ report, onShift }: Props) {
  const weeks = report?.weeks ?? [];
  const first = weeks[0];
  const last = weeks.at(-1);
  const atLatest = !!last && last.end >= (report?.latestEnd ?? "");

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center rounded-lg border border-gray-200 dark:border-gray-700">
          <button
            onClick={() => onShift(-1)}
            disabled={!first}
            title="One week earlier"
            className="rounded-l-lg px-2 py-1.5 text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-900 disabled:opacity-40 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
          >
            <ChevronLeft size={14} />
          </button>
          <span className="inline-flex items-center gap-1.5 border-x border-gray-200 px-3 py-1.5 text-xs font-medium text-indigo-700 dark:border-gray-700 dark:text-indigo-400">
            <CalendarRange size={14} />
            {first && last ? `${shortDate(first.start)} – ${shortDate(last.end)}` : "…"}
          </span>
          <button
            onClick={() => onShift(1)}
            disabled={!last || atLatest}
            title={atLatest ? "Already at the latest complete week" : "One week later"}
            className="rounded-r-lg px-2 py-1.5 text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-900 disabled:opacity-40 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
          >
            <ChevronRight size={14} />
          </button>
        </div>
        {last && !atLatest && (
          <button
            onClick={() => onShift(Math.round((Date.parse(report!.latestEnd) - Date.parse(last.end)) / (7 * 86400000)))}
            className="text-[11px] font-medium text-indigo-600 hover:underline dark:text-indigo-400"
          >
            Latest week
          </button>
        )}
      </div>
      <span className="text-[11px] text-gray-400">
        Weeks run Monday to Sunday · computed from Critical Flow and Yahoo production · per person per day
        worked
      </span>
    </div>
  );
}
