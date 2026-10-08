"use client";

import type { StableEventStats } from "../types";
import { fmtInt } from "@/features/critical-flow/format";
import ExportCsvButton from "@/components/ui/ExportCsvButton";
import type { CsvColumn } from "@/lib/csv";
import { FALLBACK_EVENT_COLOR } from "../palette";
import { EventDot, LoadingBlock, Panel } from "./Bits";

/** Which writers carried each event, from the per-event writer counts. */
export default function EventWriterMatrix({
  data,
  isLoading,
  colors,
}: {
  data?: StableEventStats[];
  isLoading: boolean;
  colors: Map<string, string>;
}) {
  if (isLoading) return <LoadingBlock />;
  const events = data ?? [];
  const totals = new Map<string, number>();
  for (const e of events) for (const w of e.writers) totals.set(w.name, (totals.get(w.name) ?? 0) + w.count);
  const writers = [...totals.entries()].sort((a, b) => b[1] - a[1]).map(([n]) => n);
  const cell = (e: StableEventStats, w: string) => e.writers.find((x) => x.name === w)?.count ?? 0;
  const max = Math.max(1, ...events.flatMap((e) => e.writers.map((w) => w.count)));

  const columns: CsvColumn<StableEventStats>[] = [
    { header: "Event", value: (r) => r.event },
    { header: "Sport", value: (r) => r.sport },
    ...writers.map((w) => ({ header: w, value: (r: StableEventStats) => cell(r, w) })),
    { header: "Allotted", value: (r) => r.allotted },
  ];

  return (
    <Panel
      title="Writers by Event"
      subtitle="Pieces each writer was allotted in each event"
      actions={<ExportCsvButton rows={events} columns={columns} filename="stable-writers-by-event" />}
    >
      {writers.length === 0 ? (
        <p className="py-6 text-center text-xs text-gray-400">No writers in these events</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs" style={{ minWidth: 240 + writers.length * 84 }}>
            <thead className="text-gray-400 dark:text-gray-500">
              <tr className="border-b border-gray-100 dark:border-gray-800">
                <th className="px-3 py-2 text-left font-medium">Event</th>
                {writers.map((w) => (
                  <th key={w} className="px-2 py-2 text-right font-medium">{w}</th>
                ))}
                <th className="px-3 py-2 text-right font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {events.map((e) => {
                const color = colors.get(e.event) ?? FALLBACK_EVENT_COLOR;
                return (
                  <tr key={e.event} className="border-b border-gray-50 last:border-0 dark:border-gray-800/50">
                    <td className="px-3 py-1.5">
                      <span className="flex items-center gap-2 font-medium text-gray-900 dark:text-white">
                        <EventDot color={color} />
                        <span className="truncate">{e.event}</span>
                      </span>
                    </td>
                    {writers.map((w) => {
                      const v = cell(e, w);
                      const alpha = v ? 0.12 + 0.6 * (v / max) : 0;
                      return (
                        <td key={w} className="px-1 py-1 text-right">
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
                      {fmtInt(e.allotted)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );
}
