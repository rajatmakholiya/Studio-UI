"use client";

import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { AGE_TONE_CLASS, fmtDec } from "@/features/critical-flow/format";
import type { ReportSection } from "../types";
import { targetTone } from "../format";

const BAR_CLASS = { ok: "bg-emerald-500", warn: "bg-amber-500", bad: "bg-rose-500" } as const;

/** Every group with a target and anyone in it, at a glance: the latest week against it. */
export default function TargetTiles({ sections }: { sections: ReportSection[] }) {
  const tiles = sections.flatMap((section) =>
    section.groups
      .filter((g) => g.target != null && (g.rostered > 0 || g.members.length > 0))
      .map((g) => ({
        section: section.title,
        group: g,
        latest: g.weeks[g.weeks.length - 1],
        previous: g.weeks[g.weeks.length - 2],
        target: g.target as number,
      })),
  );
  if (!tiles.length) return null;

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
      {tiles.map(({ section, group, latest, previous, target }) => {
        const tone = targetTone(latest.perDay, target);
        const share = latest.perDay != null ? latest.perDay / target : 0;
        const delta =
          latest.perDay != null && previous?.perDay != null ? latest.perDay - previous.perDay : null;
        return (
          <div
            key={`${section}|${group.name}`}
            className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900"
          >
            <p className="truncate text-[11px] text-gray-400" title={section}>
              {section}
            </p>
            <p className="truncate text-xs font-semibold text-gray-900 dark:text-white" title={group.name}>
              {group.name}
            </p>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span
                className={`rounded px-1.5 text-xl font-bold tabular-nums ${tone ? AGE_TONE_CLASS[tone] : "text-gray-400"}`}
              >
                {fmtDec(latest.perDay, 2)}
              </span>
              <span className="text-[11px] text-gray-400">/ {fmtDec(target, 2)}</span>
              {delta != null && Math.abs(delta) >= 0.005 && (
                <span
                  className={`ml-auto inline-flex items-center text-[11px] font-medium tabular-nums ${
                    delta > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                  }`}
                  title="Against the week before"
                >
                  {delta > 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                  {fmtDec(Math.abs(delta), 2)}
                </span>
              )}
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
              <div
                className={`h-full rounded-full ${tone ? BAR_CLASS[tone] : "bg-gray-300 dark:bg-gray-700"}`}
                style={{ width: `${Math.min(1, share) * 100}%` }}
              />
            </div>
            <p className="mt-1.5 text-[11px] text-gray-400">
              {latest.perDay == null
                ? "No output this week"
                : `${Math.round(share * 100)}% of target · ${latest.active} of ${group.rostered} worked`}
            </p>
          </div>
        );
      })}
    </div>
  );
}
