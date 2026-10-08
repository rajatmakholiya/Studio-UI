"use client";

import { useState, type ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { fmtDec } from "@/features/critical-flow/format";
import type { GroupKey, ReportGroup, WeeklyReport } from "../types";
import { groupNote, sheetWeekLabel } from "../format";

// The cell looks of the desk's own Week on Week sheet, so the page reads the same.
const CELL =
  "border border-gray-300 px-2 py-1.5 text-center font-semibold text-gray-900 dark:border-gray-700 dark:text-gray-100";
const GREEN = "bg-[#d9ead3] dark:bg-emerald-500/15";
const GREY = "bg-[#efefef] dark:bg-gray-800";
const SUB =
  "border border-gray-200 bg-gray-50 px-2 py-1 dark:border-gray-700 dark:bg-gray-800/40";
const SIDE = "px-2 text-center font-semibold whitespace-nowrap text-gray-900 dark:text-gray-100";

const MEASURE: Record<ReportGroup["measure"], string> = {
  submitted: "Pieces submitted per writer per day worked",
  published: "Pieces published per editor per day worked",
  "by role": "Submitted by writers and published by editors, per day worked",
  written: "Pieces they wrote themselves, averaged over the 7-day week",
};

interface BlockProps {
  group: ReportGroup;
  label: string;
  rows: [string, string];
  current: number;
  grey?: boolean;
  /** The sheet fills every week of the pod block, not only the current one. */
  allGreen?: boolean;
}

function Block({ group, label, rows, current, grey, allGreen }: BlockProps) {
  const [open, setOpen] = useState(false);
  const note = groupNote(group);
  const fill = (i: number) => (allGreen || i === current ? GREEN : "");
  const labelCell = `${CELL} ${grey ? GREY : ""}`;

  return (
    <>
      <tr>
        <td rowSpan={2} className={labelCell}>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            disabled={!group.members.length}
            aria-expanded={open}
            title={group.members.length ? "Show each person" : undefined}
            className="mx-auto flex items-center gap-1 disabled:cursor-default"
          >
            <ChevronRight
              size={13}
              className={`shrink-0 text-gray-400 transition-transform ${open ? "rotate-90" : ""} ${
                group.members.length ? "" : "invisible"
              }`}
            />
            <span>{label}</span>
          </button>
          {note && <span className="mt-0.5 block text-[10px] font-normal text-amber-600 dark:text-amber-400">{note}</span>}
        </td>
        <td className={`${labelCell} whitespace-nowrap`} title={MEASURE[group.measure]}>
          {rows[0]}
        </td>
        {group.weeks.map((t, i) => (
          <td key={i} className={`${CELL} tabular-nums ${fill(i)}`}>
            {(t.perDay ?? 0).toFixed(2)}
          </td>
        ))}
        <td className={SIDE}>{group.target != null ? `Ideal efficiency is ${fmtDec(group.target, 2)}` : ""}</td>
      </tr>
      <tr>
        <td className={`${labelCell} whitespace-nowrap`} title="People with any output that week">
          {rows[1]}
        </td>
        {group.weeks.map((t, i) => (
          <td key={i} className={`${CELL} tabular-nums ${fill(i)}`}>
            {t.active}
          </td>
        ))}
        <td />
      </tr>
      {open &&
        group.members.map((m) => (
          <tr key={`${m.division}|${m.name}`} className="text-[11px]">
            <td className={`${SUB} pl-7 text-left text-gray-700 dark:text-gray-200`}>
              {m.name}
            </td>
            <td className={`${SUB} text-center text-gray-500 dark:text-gray-400`}>
              {m.division}
            </td>
            {m.weeks.map((t, i) => (
              <td key={i} className={`${SUB} text-center tabular-nums text-gray-700 dark:text-gray-200`}>
                {t.output ? (
                  <>
                    {fmtDec(t.perDay, 2)}
                    <span className="ml-1 text-gray-400">
                      ({t.output} in {t.daysWorked}d)
                    </span>
                  </>
                ) : (
                  <span className="text-gray-300 dark:text-gray-600">–</span>
                )}
              </td>
            ))}
            <td />
          </tr>
        ))}
    </>
  );
}

const Title = ({ children }: { children: ReactNode }) => (
  <tr>
    <td colSpan={6} className={`${CELL} border-gray-400 text-[13px] font-bold dark:border-gray-600`}>
      {children}
    </td>
    <td />
  </tr>
);

const Gap = () => (
  <tr aria-hidden>
    <td colSpan={7} className="h-5" />
  </tr>
);

export default function WeeklySheet({ report }: { report: WeeklyReport }) {
  const { weeks } = report;
  const current = weeks.length - 1;
  const byKey = new Map(report.groups.map((g) => [g.key, g]));
  const g = (key: GroupKey) => byKey.get(key)!;
  const rostered = (...keys: GroupKey[]) => keys.reduce((n, k) => n + g(k).rostered, 0);
  const writersAway = ["stables", "part-time", "msn", "tenured"].reduce((n, k) => n + g(k as GroupKey).onLeave, 0);
  const stableEditors = g("stables-editors").rostered;

  const weekRow = (grey = false) => (
    <tr>
      <td colSpan={2} className={`${CELL} ${grey ? GREY : ""}`} />
      {weeks.map((w, i) => (
        <td key={w.start} className={`${CELL} whitespace-nowrap px-1 text-[11px] ${i === current ? "" : "font-normal"}`}>
          {sheetWeekLabel(w)}
        </td>
      ))}
      <td />
    </tr>
  );
  const block = (key: GroupKey, label: string, rows: [string, string], extra?: Partial<BlockProps>) => (
    <Block group={g(key)} label={label} rows={rows} current={current} {...extra} />
  );
  const sabbaticalHint = "On leave for the whole of the latest week";

  return (
    <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
      <table className="w-full min-w-[1100px] table-fixed border-collapse text-xs">
        <colgroup>
          <col className="w-[200px]" />
          <col className="w-[110px]" />
          {weeks.map((w) => (
            <col key={w.start} className="w-[165px]" />
          ))}
          <col className="w-[130px]" />
        </colgroup>
        <tbody>
          <Title>Week on Week Report - Critical Flow</Title>
          <tr>
            <td colSpan={2} className={CELL}>
              Full Time Writers - {rostered("stables", "msn", "tenured")} (including stables)
            </td>
            <td className={CELL}>Stables Writers - {g("stables").rostered}</td>
            <td className={CELL}>Part Time Writers - {g("part-time").rostered}</td>
            <td className={CELL} title={sabbaticalHint}>
              On Sabbatical - {writersAway}
            </td>
            <td className={CELL}>Current</td>
            <td className={SIDE}>Target Efficiency</td>
          </tr>
          {weekRow()}
          {block("stables", "Stables Writers", ["Avg per writer", "Total"])}
          <Gap />
          {block("part-time", "Part time writers", ["Avg per writer", "Total"])}
          <Gap />
          {block("msn", "Writers moved from MSN", ["Avg per writer", "Total"])}
          <Gap />
          {block("tenured", "Tenured writers", ["Avg per writer", "Total"])}

          <Title>Week on Week Report - Editors (Non Pod Divisions)</Title>
          <tr>
            <td colSpan={6} className={CELL}>
              Total - {g("editors").rostered} (including associates)
            </td>
            <td />
          </tr>
          {block("editors", "Editors", ["Avg per editor", "Total"])}
          <Gap />

          <Title>Week on Week Report - Producers</Title>
          <tr>
            <td colSpan={2} className={CELL}>
              Total - {g("producers").rostered} ({g("producers").divisions.join(", ")})
            </td>
            <td className={CELL} />
            <td className={CELL} />
            <td className={CELL} title={sabbaticalHint}>
              On Sabbatical - {g("producers").onLeave}
            </td>
            <td className={CELL}>Current</td>
            <td />
          </tr>
          {block("producers", "Producers", ["Avg per Producer", "Total"])}

          <Title>Week on Week Report - Editors (Pod/Non-Pod)</Title>
          <tr>
            <td colSpan={2} className={`${CELL} ${GREY}`}>
              Editors Total - {rostered("pod", "non-pod", "associates", "stables-editors")} (including {stableEditors}{" "}
              stables editor{stableEditors === 1 ? "" : "s"})
            </td>
            <td className={CELL}>Associate Editors - {g("associates").rostered}</td>
            <td className={CELL} />
            <td className={CELL} />
            <td className={CELL}>Current</td>
            <td />
          </tr>
          {weekRow(true)}
          {block("pod", "POD", ["Avg per Editor", "Total"], { grey: true, allGreen: true })}
          <Gap />
          {block("non-pod", "NON-POD", ["Avg per Editor", "Total"], { grey: true, allGreen: true })}
          <Gap />
          {block("associates", "ASSOCIATES", ["Avg per Editor", "Total"], { grey: true, allGreen: true })}
          <Gap />
          {block("stables-editors", "STABLES", ["Avg per Editor", "Total"], { grey: true, allGreen: true })}
          <Gap />

          {(["Avg / day", "# of writers"] as const).map((label, r) => (
            <tr key={label}>
              {r === 0 && (
                <td rowSpan={2} className={CELL}>
                  Long form NL writers
                  <span className="mt-0.5 block text-[10px] font-normal text-amber-600 dark:text-amber-400">
                    Newsletter long-form is not tracked in Critical Flow or Yahoo
                  </span>
                </td>
              )}
              <td className={CELL}>{label}</td>
              {weeks.map((w) => (
                <td key={w.start} className={`${CELL} text-gray-400`}>
                  -
                </td>
              ))}
              <td />
            </tr>
          ))}
          <Gap />

          <Title>Not in the sheet - Writers missing from the Dynamic Schedule</Title>
          {weekRow()}
          {block("unlisted", "Not on the schedule", ["Avg per writer", "Total"])}
        </tbody>
      </table>
    </div>
  );
}
