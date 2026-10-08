"use client";

import type { StableQuality } from "../types";
import { fmtInt } from "@/features/critical-flow/format";
import ExportCsvButton from "@/components/ui/ExportCsvButton";
import type { CsvColumn } from "@/lib/csv";
import { FALLBACK_EVENT_COLOR } from "../palette";
import { EventChip, LoadingBlock, Panel } from "./Bits";

type Dup = StableQuality["duplicates"][number];

const DUP_CSV: CsvColumn<Dup>[] = [
  { header: "Player", value: (r) => r.player },
  { header: "Stable Type", value: (r) => r.stableType },
  { header: "Times Allotted", value: (r) => r.count },
  { header: "Within One Event", value: (r) => (r.sameEvent ? "Yes" : "No") },
  { header: "Events", value: (r) => r.events.join("; ") },
  { header: "Writers", value: (r) => r.writers.join("; ") },
];

/** Gaps worth fixing in the sheet rather than silently absorbing. */
export default function QualityPanel({
  data,
  isLoading,
  colors,
}: {
  data?: StableQuality;
  isLoading: boolean;
  colors: Map<string, string>;
}) {
  if (isLoading || !data) return <LoadingBlock height="h-96" />;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Panel title="Sheet Gaps" subtitle="Rows the desk could tidy up in the source sheet">
          {data.issues.length === 0 ? (
            <p className="py-6 text-center text-xs text-gray-400">Nothing to flag</p>
          ) : (
            <ul className="divide-y divide-gray-100 dark:divide-gray-800">
              {data.issues.map((i) => (
                <li key={i.issue} className="flex items-start justify-between gap-3 py-2">
                  <div>
                    <p className="text-xs font-medium text-gray-900 dark:text-white">{i.issue}</p>
                    <p className="text-[11px] text-gray-400">{i.detail}</p>
                  </div>
                  <span className="shrink-0 rounded bg-amber-50 px-1.5 py-0.5 text-xs font-semibold tabular-nums text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
                    {fmtInt(i.count)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <div className="space-y-4">
          <Panel title="Merged Name Spellings" subtitle="Different spellings counted as one person — check these are right">
            {data.nameMerges.length === 0 ? (
              <p className="py-4 text-center text-xs text-gray-400">No merges</p>
            ) : (
              <ul className="space-y-1.5">
                {data.nameMerges.map((m) => (
                  <li key={m.name} className="text-xs">
                    <span className="font-medium text-gray-900 dark:text-white">{m.name}</span>
                    <span className="text-gray-400"> ← </span>
                    <span className="text-gray-500 dark:text-gray-400">
                      {m.spellings.map((s) => `"${s.spelling}" (${s.pieces})`).join(", ")}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel title="Not on the Daily Schedule" subtitle="People doing Stable work who are not listed on the desk">
            {data.unrostered.length === 0 ? (
              <p className="py-4 text-center text-xs text-gray-400">Everyone is listed</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {data.unrostered.map((u) => (
                  <span
                    key={u.name}
                    className="rounded-md border border-gray-200 px-2 py-0.5 text-[11px] text-gray-600 dark:border-gray-700 dark:text-gray-300"
                  >
                    {u.name}
                    <span className="ml-1 text-gray-400">
                      {u.role} · {u.pieces}
                    </span>
                  </span>
                ))}
              </div>
            )}
          </Panel>
        </div>
      </div>

      <Panel
        title="Repeated Allotments"
        subtitle="Same player and stable type allotted twice in one event, or written as New more than once"
        actions={<ExportCsvButton rows={data.duplicates} columns={DUP_CSV} filename="stable-repeats" />}
      >
        {data.duplicates.length === 0 ? (
          <p className="py-6 text-center text-xs text-gray-400">No repeats</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-xs">
              <thead className="text-gray-400 dark:text-gray-500">
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  <th className="px-3 py-2 text-left font-medium">Player</th>
                  <th className="px-3 py-2 text-left font-medium">Type</th>
                  <th className="px-3 py-2 text-right font-medium">Times</th>
                  <th className="px-3 py-2 text-left font-medium">Events</th>
                  <th className="px-3 py-2 text-left font-medium">Writers</th>
                </tr>
              </thead>
              <tbody>
                {data.duplicates.map((d) => (
                  <tr
                    key={`${d.player}|${d.stableType}`}
                    className="border-b border-gray-50 align-top last:border-0 dark:border-gray-800/50"
                  >
                    <td className="px-3 py-2 font-medium text-gray-900 dark:text-white">
                      {d.player}
                      {d.sameEvent && (
                        <span className="ml-1.5 rounded bg-rose-50 px-1 text-[10px] font-medium text-rose-700 dark:bg-rose-500/10 dark:text-rose-400">
                          same event
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-gray-600 dark:text-gray-300">{d.stableType}</td>
                    <td className="px-3 py-2 text-right tabular-nums text-gray-700 dark:text-gray-300">{d.count}</td>
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap gap-1">
                        {d.events.map((e) => (
                          <EventChip key={e} event={e} color={colors.get(e) ?? FALLBACK_EVENT_COLOR} />
                        ))}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-gray-500 dark:text-gray-400">{d.writers.join(", ")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}
