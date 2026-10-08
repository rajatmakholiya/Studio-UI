"use client";

import { useCallback } from "react";
import type { StableEventStats } from "../types";
import { csvNum, fmtInt, fmtPct } from "@/features/critical-flow/format";
import { useTableSort, SortableTh } from "@/components/ui/SortableTable";
import ExportCsvButton from "@/components/ui/ExportCsvButton";
import type { CsvColumn } from "@/lib/csv";
import { FALLBACK_EVENT_COLOR, stageSegments } from "../palette";
import { EventDot, LoadingBlock, Panel, SegmentBar, SportTag, stageBarSegments } from "./Bits";

const CSV_COLUMNS: CsvColumn<StableEventStats>[] = [
  { header: "Event", value: (r) => r.event },
  { header: "Sport", value: (r) => r.sport },
  { header: "Allotted", value: (r) => r.allotted },
  { header: "New", value: (r) => r.newCount },
  { header: "Update", value: (r) => r.updateCount },
  { header: "Submitted", value: (r) => r.submitted },
  { header: "To Write", value: (r) => r.awaitingSubmission },
  { header: "To Edit", value: (r) => r.awaitingEditorial },
  { header: "Editing", value: (r) => r.inEditorial },
  { header: "Sent Back", value: (r) => r.sentBack },
  { header: "Verified", value: (r) => r.verified },
  { header: "Scheduled / Live", value: (r) => r.published },
  { header: "On Hold", value: (r) => r.onHold },
  { header: "Trashed", value: (r) => r.trashed },
  { header: "Open", value: (r) => r.open },
  { header: "Complete (%)", value: (r) => csvNum(r.completionRate) },
  { header: "Writers", value: (r) => r.writers.map((w) => `${w.name} (${w.count})`).join("; ") },
  { header: "Editors", value: (r) => r.editors.map((w) => `${w.name} (${w.count})`).join("; ") },
];

const num = "px-3 py-2 text-right tabular-nums text-gray-700 dark:text-gray-300";

export default function EventTable({
  data,
  isLoading,
  colors,
  onSelect,
}: {
  data?: StableEventStats[];
  isLoading: boolean;
  colors: Map<string, string>;
  onSelect: (event: string) => void;
}) {
  const rows = data ?? [];
  const getValue = useCallback(
    (r: StableEventStats, key: string) => r[key as keyof StableEventStats] as string | number,
    [],
  );
  const { sorted, sortKey, sortDir, handleSort } = useTableSort(rows, getValue);
  if (isLoading) return <LoadingBlock />;

  const th = (label: string, key: string, align: "left" | "right" = "right") => (
    <SortableTh label={label} colKey={key} align={align} sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
  );

  return (
    <Panel
      title="Event Breakdown"
      subtitle="Every stage for every event — click an event name to focus on it"
      actions={<ExportCsvButton rows={sorted} columns={CSV_COLUMNS} filename="stable-events" />}
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1080px] text-xs">
          <thead className="text-gray-400 dark:text-gray-500">
            <tr className="border-b border-gray-100 dark:border-gray-800">
              {th("Event", "event", "left")}
              {th("Sport", "sport", "left")}
              {th("Allotted", "allotted")}
              {th("To Write", "awaitingSubmission")}
              {th("To Edit", "awaitingEditorial")}
              {th("Editing", "inEditorial")}
              {th("Sent Back", "sentBack")}
              {th("Verified", "verified")}
              {th("Sched.", "published")}
              {th("Open", "open")}
              {th("Complete", "completionRate")}
              <th className="w-40 px-3 py-2 text-left font-medium">Stages</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((r) => {
              const color = colors.get(r.event) ?? FALLBACK_EVENT_COLOR;
              return (
                <tr key={r.event} className="border-b border-gray-50 last:border-0 dark:border-gray-800/50">
                  <td className="px-3 py-2">
                    <button
                      onClick={() => onSelect(r.event)}
                      className="flex items-center gap-2 whitespace-nowrap text-left font-medium text-gray-900 hover:underline dark:text-white"
                    >
                      <EventDot color={color} size={9} />
                      {r.event}
                    </button>
                  </td>
                  <td className="px-3 py-2">
                    <SportTag sport={r.sport} />
                  </td>
                  <td className={num}>
                    {fmtInt(r.allotted)}
                    <span className="ml-1 text-[10px] text-gray-400">
                      {r.newCount}N/{r.updateCount}U
                    </span>
                  </td>
                  <td className={num}>{fmtInt(r.awaitingSubmission)}</td>
                  <td className={num}>{fmtInt(r.awaitingEditorial)}</td>
                  <td className={num}>{fmtInt(r.inEditorial)}</td>
                  <td className={num}>{fmtInt(r.sentBack)}</td>
                  <td className={num}>{fmtInt(r.verified)}</td>
                  <td className={num}>{fmtInt(r.published)}</td>
                  <td className="px-3 py-2 text-right">
                    {r.open > 0 ? (
                      <span className="rounded bg-amber-50 px-1.5 py-0.5 tabular-nums text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
                        {fmtInt(r.open)}
                      </span>
                    ) : (
                      <span className="text-emerald-600 dark:text-emerald-400">0</span>
                    )}
                  </td>
                  <td className={num}>{fmtPct(r.completionRate)}</td>
                  <td className="px-3 py-2">
                    <SegmentBar segments={stageBarSegments(stageSegments(r))} height={7} />
                  </td>
                </tr>
              );
            })}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={12} className="px-3 py-8 text-center text-gray-400">
                  No events match these filters
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}
