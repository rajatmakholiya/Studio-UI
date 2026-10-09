"use client";

import { useCallback } from "react";
import type { DivisionStats } from "../types";
import { csvNum, fmtInt, fmtPct, rateTone, AGE_TONE_CLASS } from "../format";
import { useTableSort, SortableTh } from "@/components/ui/SortableTable";
import ExportCsvButton from "@/components/ui/ExportCsvButton";
import type { CsvColumn } from "@/lib/csv";

interface Props {
  data?: DivisionStats[];
  isLoading: boolean;
  /**
   * Whether this pipeline has a send-back loop. Yahoo runs one editorial pass
   * and never sends work back, so those columns would read zero on every row.
   */
  showSendBacks?: boolean;
  csvPrefix?: string;
}

const CSV_COLUMNS: (CsvColumn<DivisionStats> & { sendBack?: boolean })[] = [
  { header: "Division", value: (r) => r.division },
  { header: "Allotted", value: (r) => r.allotted },
  { header: "Published", value: (r) => r.published },
  { header: "Publish Rate (%)", value: (r) => csvNum(r.publishRate) },
  { header: "Sent Back", value: (r) => r.sentBack, sendBack: true },
  { header: "In Queue", value: (r) => r.pending },
  // Temporarily hidden:
  // { header: "Median TAT (h)", value: (r) => csvHours(r.medianTatHours) },
  // { header: "Avg TAT (h)", value: (r) => csvHours(r.avgTatHours) },
  { header: "Writers", value: (r) => r.writers },
  { header: "Editors", value: (r) => r.editors },
];

export default function DivisionTable({
  data,
  isLoading,
  showSendBacks = true,
  csvPrefix = "critical-flow",
}: Props) {
  const rows = data ?? [];
  const getValue = useCallback(
    (r: DivisionStats, key: string) => r[key as keyof DivisionStats] as string | number,
    [],
  );
  const { sorted, sortKey, sortDir, handleSort } = useTableSort(rows, getValue);

  if (isLoading) {
    return (
      <div className="h-72 animate-pulse rounded-2xl border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-800/50" />
    );
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
            By Division
          </h2>
          <p className="text-[11px] text-gray-400 dark:text-gray-500">
            Volume, throughput and quality for each source workbook
          </p>
        </div>
        <ExportCsvButton
          rows={sorted}
          columns={showSendBacks ? CSV_COLUMNS : CSV_COLUMNS.filter((c) => !c.sendBack)}
          filename={`${csvPrefix}-divisions`}
        />
      </div>

      <div className="overflow-x-auto">
        <table className={`w-full ${showSendBacks ? "min-w-[720px]" : "min-w-[650px]"} text-xs`}>
          <thead className="text-gray-400 dark:text-gray-500">
            <tr className="border-b border-gray-100 dark:border-gray-800">
              <SortableTh label="Division" colKey="division" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
              <SortableTh label="Allotted" colKey="allotted" align="right" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
              <SortableTh label="Published" colKey="published" align="right" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
              <SortableTh label="Rate" colKey="publishRate" align="right" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
              {showSendBacks && (
                <SortableTh label="Sent Back" colKey="sentBack" align="right" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
              )}
              <SortableTh label="In Queue" colKey="pending" align="right" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
              {/* Temporarily hidden:
              <SortableTh label="Med TAT" colKey="medianTatHours" align="right" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
              <SortableTh label="Avg TAT" colKey="avgTatHours" align="right" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
              */}
              <SortableTh label="People" colKey="writers" align="right" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
            </tr>
          </thead>
          <tbody>
            {sorted.map((r) => {
              const sbRate = r.allotted > 0 ? (r.sentBack / r.allotted) * 100 : 0;
              return (
                <tr
                  key={r.division}
                  className="border-b border-gray-50 last:border-0 dark:border-gray-800/50"
                >
                  <td className="px-3 py-2 font-medium text-gray-900 dark:text-white">
                    {r.division}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums text-gray-700 dark:text-gray-300">
                    {fmtInt(r.allotted)}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums text-gray-700 dark:text-gray-300">
                    {fmtInt(r.published)}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums text-gray-700 dark:text-gray-300">
                    {fmtPct(r.publishRate)}
                  </td>
                  {showSendBacks && (
                    <td className="px-3 py-2 text-right">
                      <span
                        className={`rounded px-1.5 py-0.5 tabular-nums ${AGE_TONE_CLASS[rateTone(sbRate)]}`}
                      >
                        {fmtInt(r.sentBack)}
                      </span>
                    </td>
                  )}
                  <td className="px-3 py-2 text-right tabular-nums text-gray-700 dark:text-gray-300">
                    {fmtInt(r.pending)}
                  </td>
                  {/* Temporarily hidden:
                  <td className="px-3 py-2 text-right tabular-nums text-gray-700 dark:text-gray-300">
                    {fmtHours(r.medianTatHours)}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums text-gray-700 dark:text-gray-300">
                    {fmtHours(r.avgTatHours)}
                  </td>
                  */}
                  <td className="px-3 py-2 text-right tabular-nums text-gray-500 dark:text-gray-400">
                    {r.writers}w / {r.editors}e
                  </td>
                </tr>
              );
            })}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={showSendBacks ? 7 : 6} className="px-3 py-8 text-center text-gray-400">
                  No pieces in this period
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
