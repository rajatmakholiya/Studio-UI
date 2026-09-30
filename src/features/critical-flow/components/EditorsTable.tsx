"use client";

import { useCallback } from "react";
import type { EditorStats } from "../types";
import { csvHours, csvNum, fmtDec, fmtHours, fmtInt, fmtPct, rateTone, AGE_TONE_CLASS } from "../format";
import { useTableSort, SortableTh } from "@/components/ui/SortableTable";
import ExportCsvButton from "@/components/ui/ExportCsvButton";
import type { CsvColumn } from "@/lib/csv";

interface Props {
  data?: EditorStats[];
  isLoading: boolean;
  /**
   * Whether this pipeline has a send-back loop. Yahoo runs one editorial pass
   * and never sends work back, so those columns would read zero on every row.
   */
  showSendBacks?: boolean;
  csvPrefix?: string;
}

const CSV_COLUMNS: (CsvColumn<EditorStats> & { sendBack?: boolean })[] = [
  { header: "Editor", value: (r) => r.editor },
  { header: "Division", value: (r) => r.division },
  { header: "Reviewed", value: (r) => r.handled },
  { header: "Verified", value: (r) => r.verified },
  { header: "Sent Back", value: (r) => r.sentBack, sendBack: true },
  { header: "Send-Back Rate (%)", value: (r) => csvNum(r.sendBackRate), sendBack: true },
  { header: "2nd Pass", value: (r) => r.secondPass, sendBack: true },
  { header: "Median Review (h)", value: (r) => csvHours(r.medianReviewHours) },
  { header: "Avg Review (h)", value: (r) => csvHours(r.avgReviewHours) },
  { header: "Days Worked", value: (r) => r.activeDays },
  { header: "Avg Reviewed per Day Worked", value: (r) => csvNum(r.perActiveDay, 2) },
];

export default function EditorsTable({
  data,
  isLoading,
  showSendBacks = true,
  csvPrefix = "critical-flow",
}: Props) {
  const rows = data ?? [];
  const getValue = useCallback(
    (r: EditorStats, key: string) => r[key as keyof EditorStats] as string | number | null,
    [],
  );
  const { sorted, sortKey, sortDir, handleSort } = useTableSort(rows, getValue);

  if (isLoading) {
    return (
      <div className="h-96 animate-pulse rounded-2xl border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-800/50" />
    );
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Editors</h2>
          <p className="text-[11px] text-gray-400 dark:text-gray-500">
            Review latency is submission → first editorial pass; second pass counts post-send-back rechecks.
            Days Worked is the number of days in the range they actually reviewed on; Avg / Day divides by it.
          </p>
        </div>
        <ExportCsvButton
          rows={sorted}
          columns={showSendBacks ? CSV_COLUMNS : CSV_COLUMNS.filter((c) => !c.sendBack)}
          filename={`${csvPrefix}-editors`}
        />
      </div>

      <div className="overflow-x-auto">
        <table className={`w-full ${showSendBacks ? "min-w-[1080px]" : "min-w-[900px]"} text-xs`}>
          <thead className="text-gray-400 dark:text-gray-500">
            <tr className="border-b border-gray-100 dark:border-gray-800">
              <SortableTh label="Editor" colKey="editor" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
              <SortableTh label="Division" colKey="division" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
              <SortableTh label="Reviewed" colKey="handled" align="right" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
              <SortableTh label="Verified" colKey="verified" align="right" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
              {showSendBacks && (
                <>
                  <SortableTh label="Sent Back" colKey="sentBack" align="right" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                  <SortableTh label="SB Rate" colKey="sendBackRate" align="right" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                  <SortableTh label="2nd Pass" colKey="secondPass" align="right" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                </>
              )}
              <SortableTh label="Med Review" colKey="medianReviewHours" align="right" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
              <SortableTh label="Avg Review" colKey="avgReviewHours" align="right" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
              <SortableTh label="Days Worked" colKey="activeDays" align="right" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
              <SortableTh label="Avg / Day" colKey="perActiveDay" align="right" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
            </tr>
          </thead>
          <tbody>
            {sorted.map((r) => (
              <tr key={`${r.division}-${r.editor}`} className="border-b border-gray-50 last:border-0 dark:border-gray-800/50">
                <td className="px-3 py-2 font-medium text-gray-900 dark:text-white">{r.editor}</td>
                <td className="px-3 py-2 text-gray-500 dark:text-gray-400">{r.division}</td>
                <td className="px-3 py-2 text-right tabular-nums text-gray-700 dark:text-gray-300">{fmtInt(r.handled)}</td>
                <td className="px-3 py-2 text-right tabular-nums text-gray-700 dark:text-gray-300">{fmtInt(r.verified)}</td>
                {showSendBacks && (
                  <>
                    <td className="px-3 py-2 text-right tabular-nums text-gray-700 dark:text-gray-300">{fmtInt(r.sentBack)}</td>
                    <td className="px-3 py-2 text-right">
                      <span
                        className={`rounded px-1.5 py-0.5 tabular-nums ${
                          r.handled < 5 ? "text-gray-400" : AGE_TONE_CLASS[rateTone(r.sendBackRate)]
                        }`}
                      >
                        {fmtPct(r.sendBackRate)}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-gray-500 dark:text-gray-400">{fmtInt(r.secondPass)}</td>
                  </>
                )}
                <td className="px-3 py-2 text-right tabular-nums text-gray-700 dark:text-gray-300">
                  {r.medianReviewHours == null ? "—" : fmtHours(r.medianReviewHours)}
                </td>
                <td className="px-3 py-2 text-right tabular-nums text-gray-700 dark:text-gray-300">
                  {r.avgReviewHours == null ? "—" : fmtHours(r.avgReviewHours)}
                </td>
                <td className="px-3 py-2 text-right tabular-nums text-gray-700 dark:text-gray-300">{fmtInt(r.activeDays)}</td>
                <td className="px-3 py-2 text-right tabular-nums font-medium text-gray-900 dark:text-white">{fmtDec(r.perActiveDay, 2)}</td>
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={showSendBacks ? 11 : 8} className="px-3 py-8 text-center text-gray-400">
                  No editorial activity in this period
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
