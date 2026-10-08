"use client";

import type { StableTypeMatrix } from "../types";
import { fmtInt } from "@/features/critical-flow/format";
import ExportCsvButton from "@/components/ui/ExportCsvButton";
import type { CsvColumn } from "@/lib/csv";
import { FALLBACK_EVENT_COLOR } from "../palette";
import { EventDot, LoadingBlock, Panel } from "./Bits";

type Row = StableTypeMatrix["rows"][number];

/** How many pieces of each stable type every event produced. */
export default function TypeMatrix({
  data,
  isLoading,
  colors,
}: {
  data?: StableTypeMatrix;
  isLoading: boolean;
  colors: Map<string, string>;
}) {
  if (isLoading || !data) return <LoadingBlock />;
  // The long tail of one-off types would make the grid unreadable.
  const types = data.types.filter((t) => t !== "Unspecified" && t !== "Other").slice(0, 8);
  const max = Math.max(1, ...data.rows.flatMap((r) => types.map((t) => r.cells[t] ?? 0)));

  const columns: CsvColumn<Row>[] = [
    { header: "Event", value: (r) => r.event },
    { header: "Sport", value: (r) => r.sport },
    { header: "Total", value: (r) => r.total },
    ...data.types.map((t) => ({ header: t, value: (r: Row) => r.cells[t] ?? 0 })),
  ];

  return (
    <Panel
      title="Stable Types by Event"
      subtitle="Darker cells are bigger shares of the busiest event"
      actions={<ExportCsvButton rows={data.rows} columns={columns} filename="stable-types-by-event" />}
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-xs">
          <thead className="text-gray-400 dark:text-gray-500">
            <tr className="border-b border-gray-100 dark:border-gray-800">
              <th className="px-3 py-2 text-left font-medium">Event</th>
              {types.map((t) => (
                <th key={t} className="px-2 py-2 text-right font-medium">{t}</th>
              ))}
              <th className="px-3 py-2 text-right font-medium">Total</th>
            </tr>
          </thead>
          <tbody>
            {data.rows.map((r) => {
              const color = colors.get(r.event) ?? FALLBACK_EVENT_COLOR;
              return (
                <tr key={r.event} className="border-b border-gray-50 last:border-0 dark:border-gray-800/50">
                  <td className="px-3 py-1.5">
                    <span className="flex items-center gap-2 font-medium text-gray-900 dark:text-white">
                      <EventDot color={color} />
                      <span className="truncate">{r.event}</span>
                    </span>
                  </td>
                  {types.map((t) => {
                    const v = r.cells[t] ?? 0;
                    const alpha = v ? 0.12 + 0.6 * (v / max) : 0;
                    return (
                      <td key={t} className="px-1 py-1 text-right">
                        <span
                          className="block rounded px-1.5 py-1 tabular-nums text-gray-800 dark:text-gray-100"
                          style={{
                            backgroundColor: v
                              ? `${color}${Math.round(alpha * 255).toString(16).padStart(2, "0")}`
                              : undefined,
                          }}
                        >
                          {v ? fmtInt(v) : <span className="text-gray-300 dark:text-gray-700">·</span>}
                        </span>
                      </td>
                    );
                  })}
                  <td className="px-3 py-1.5 text-right font-semibold tabular-nums text-gray-700 dark:text-gray-300">
                    {fmtInt(r.total)}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t border-gray-200 text-gray-500 dark:border-gray-700 dark:text-gray-400">
              <td className="px-3 py-2 font-medium">All events</td>
              {types.map((t) => (
                <td key={t} className="px-2 py-2 text-right tabular-nums">
                  {fmtInt(data.totals.find((x) => x.stableType === t)?.count ?? 0)}
                </td>
              ))}
              <td className="px-3 py-2 text-right font-semibold tabular-nums">
                {fmtInt(data.rows.reduce((s, r) => s + r.total, 0))}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </Panel>
  );
}
