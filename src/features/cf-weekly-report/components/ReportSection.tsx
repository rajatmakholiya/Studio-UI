"use client";

import { Fragment, useState } from "react";
import { ChevronRight } from "lucide-react";
import { AGE_TONE_CLASS, fmtDec } from "@/features/critical-flow/format";
import ExportCsvButton from "@/components/ui/ExportCsvButton";
import type { CsvColumn } from "@/lib/csv";
import type { ReportGroup, ReportSection as Section, ReportWeek, WeekTally } from "../types";
import { groupNote, targetTone, weekLabel } from "../format";

const MEASURE: Record<ReportGroup["measure"], string> = {
  submitted: "pieces submitted",
  published: "pieces published",
  "by role": "submitted by writers, published by editors",
};

interface CsvRow {
  group: string;
  person: string;
  division: string;
  weeks: WeekTally[];
  target: number | null;
}

function Change({ latest, previous }: { latest?: WeekTally; previous?: WeekTally }) {
  if (latest?.perDay == null || previous?.perDay == null || Math.abs(latest.perDay - previous.perDay) < 0.005) {
    return <span className="text-gray-300 dark:text-gray-600">—</span>;
  }
  const up = latest.perDay > previous.perDay;
  return (
    <span className={`tabular-nums ${up ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
      {up ? "▲" : "▼"} {fmtDec(Math.abs(latest.perDay - previous.perDay), 2)}
    </span>
  );
}

/** A week's rate, toned against the target, over what it is made of. */
function Cell({ t, target, current, sub }: { t: WeekTally; target: number | null; current: boolean; sub: string }) {
  const tone = targetTone(t.perDay, target);
  return (
    <td className={`px-3 py-1.5 text-right align-top ${current ? "bg-indigo-50/60 dark:bg-indigo-500/5" : ""}`}>
      <span
        className={`rounded px-1.5 py-0.5 tabular-nums ${tone ? AGE_TONE_CLASS[tone] : "text-gray-700 dark:text-gray-300"} ${
          current ? "font-semibold" : ""
        }`}
      >
        {fmtDec(t.perDay, 2)}
      </span>
      <div className="mt-0.5 text-[10px] tabular-nums text-gray-400">{sub}</div>
    </td>
  );
}

export default function ReportSection({ section, weeks }: { section: Section; weeks: ReportWeek[] }) {
  const [open, setOpen] = useState<Set<string>>(new Set());
  const cur = weeks.length - 1;
  const toggle = (name: string) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });

  const csvRows: CsvRow[] = section.groups.flatMap((g) => [
    { group: g.name, person: "", division: "", weeks: g.weeks, target: g.target },
    ...g.members.map((m) => ({ group: g.name, person: m.name, division: m.division, weeks: m.weeks, target: g.target })),
  ]);
  const csvColumns: CsvColumn<CsvRow>[] = [
    { header: "Group", value: (r) => r.group },
    { header: "Person", value: (r) => r.person },
    { header: "Division", value: (r) => r.division },
    ...weeks.flatMap((w, i) => [
      { header: `${w.start} to ${w.end} per day`, value: (r: CsvRow) => r.weeks[i].perDay },
      { header: `${w.start} to ${w.end} pieces`, value: (r: CsvRow) => r.weeks[i].output },
      { header: `${w.start} to ${w.end} days worked`, value: (r: CsvRow) => r.weeks[i].daysWorked },
    ]),
    { header: "Target per day", value: (r) => r.target },
  ];

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">{section.title}</h2>
          <p className="text-[11px] text-gray-400 dark:text-gray-500">
            Per person per day worked · open a group to see each person
          </p>
        </div>
        <ExportCsvButton
          rows={csvRows}
          columns={csvColumns}
          filename={`cf-weekly-${section.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-xs">
          <thead className="text-gray-400 dark:text-gray-500">
            <tr className="border-b border-gray-100 dark:border-gray-800">
              <th className="px-3 py-2 text-left font-medium">Group</th>
              {weeks.map((w, i) => (
                <th
                  key={w.start}
                  className={`whitespace-nowrap px-3 py-2 text-right font-medium ${
                    i === cur ? "rounded-t-lg bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400" : ""
                  }`}
                >
                  {weekLabel(w)}
                </th>
              ))}
              <th className="px-3 py-2 text-right font-medium" title="Latest week against the week before">
                Change
              </th>
              <th className="px-3 py-2 text-right font-medium">Target</th>
            </tr>
          </thead>
          <tbody>
            {section.groups.map((g) => {
              const expanded = open.has(g.name);
              const note = groupNote(g.name, g.rostered);
              return (
                <Fragment key={g.name}>
                  <tr className="border-b border-gray-100 dark:border-gray-800">
                    <td className="px-3 py-1.5 align-top">
                      <button
                        type="button"
                        onClick={() => toggle(g.name)}
                        disabled={!g.members.length}
                        aria-expanded={expanded}
                        className="flex items-start gap-1 text-left disabled:cursor-default"
                      >
                        <ChevronRight
                          size={14}
                          className={`mt-0.5 shrink-0 text-gray-400 transition-transform ${expanded ? "rotate-90" : ""} ${
                            g.members.length ? "" : "invisible"
                          }`}
                        />
                        <span>
                          <span className="font-medium text-gray-900 dark:text-white">{g.name}</span>
                          <span className="block text-[10px] text-gray-400">
                            {g.target != null ? `${g.rostered} on the schedule · ` : ""}
                            {MEASURE[g.measure]}
                          </span>
                          {note && <span className="block text-[10px] text-amber-600 dark:text-amber-400">{note}</span>}
                        </span>
                      </button>
                    </td>
                    {g.weeks.map((t, i) => (
                      <Cell
                        key={i}
                        t={t}
                        target={g.target}
                        current={i === cur}
                        sub={`${t.output} pcs · ${t.active} ${t.active === 1 ? "person" : "people"}`}
                      />
                    ))}
                    <td className="px-3 py-1.5 text-right align-top">
                      <Change latest={g.weeks[cur]} previous={g.weeks[cur - 1]} />
                    </td>
                    <td className="px-3 py-1.5 text-right align-top tabular-nums text-gray-500 dark:text-gray-400">
                      {g.target != null ? fmtDec(g.target, 2) : "—"}
                    </td>
                  </tr>
                  {expanded &&
                    g.members.map((m) => (
                      <tr
                        key={`${m.division}|${m.name}`}
                        className="border-b border-gray-50 bg-gray-50/50 last:border-0 dark:border-gray-800/50 dark:bg-gray-800/20"
                      >
                        <td className="py-1.5 pl-9 pr-3 align-top">
                          <span className="text-gray-700 dark:text-gray-200">{m.name}</span>
                          <span className="block text-[10px] text-gray-400">
                            {[m.division, m.role].filter(Boolean).join(" · ")}
                          </span>
                        </td>
                        {m.weeks.map((t, i) => (
                          <Cell
                            key={i}
                            t={t}
                            target={g.target}
                            current={i === cur}
                            sub={t.output ? `${t.output} in ${t.daysWorked}d` : "none"}
                          />
                        ))}
                        <td className="px-3 py-1.5 text-right align-top">
                          <Change latest={m.weeks[cur]} previous={m.weeks[cur - 1]} />
                        </td>
                        <td />
                      </tr>
                    ))}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
