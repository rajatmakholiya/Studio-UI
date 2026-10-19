"use client";

import { useState, type ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { fmtDec } from "@/features/critical-flow/format";
import type { GroupKey, ReportGroup, ReportWeek, WeekTally, WeeklyReport } from "../types";
import { groupNote, sheetWeekLabel } from "../format";

// The cell looks of the desk's own Week on Week sheet, so the page reads the same.
const CELL =
  "border border-gray-300 px-2 py-1.5 text-center font-semibold text-gray-900 dark:border-gray-700 dark:text-gray-100";
const GREEN = "bg-[#d9ead3] dark:bg-emerald-500/15";
const GREY = "bg-[#efefef] dark:bg-gray-800";
const SUB =
  "border border-gray-200 bg-gray-50 px-2 py-1 dark:border-gray-700 dark:bg-gray-800/40";
const SIDE = "px-2 text-center font-semibold whitespace-nowrap text-gray-900 dark:text-gray-100";
const BELOW = "text-rose-600 dark:text-rose-400";

const MEASURE: Record<ReportGroup["measure"], string> = {
  submitted: "Pieces each person submitted per day they worked, averaged over the people who worked",
  published: "Pieces each editor published per day they worked, averaged over the editors who worked",
  written: "Pieces each editor wrote themselves per day they wrote, averaged over the editors who wrote",
};

const below = (t: WeekTally, target: number | null) => target != null && t.perDay != null && t.perDay < target;

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
            <span>
              {label}
              {group.key !== "unlisted" && ` - ${group.rostered}`}
            </span>
          </button>
          {note && <span className="mt-0.5 block text-[10px] font-normal text-amber-600 dark:text-amber-400">{note}</span>}
        </td>
        <td className={`${labelCell} whitespace-nowrap`} title={MEASURE[group.measure]}>
          {rows[0]}
        </td>
        {group.weeks.map((t, i) => (
          <td key={i} className={`${CELL} tabular-nums ${fill(i)} ${below(t, group.target) ? BELOW : ""}`}>
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
              {!m.rostered && group.key !== "unlisted" && (
                <span className="ml-1 text-[10px] text-gray-400" title="Their Team Structure vertical is outside Critical Flow and Yahoo">
                  · off-desk
                </span>
              )}
            </td>
            <td className={`${SUB} text-center text-gray-500 dark:text-gray-400`}>
              {m.division}
            </td>
            {m.weeks.map((t, i) => (
              <td
                key={i}
                className={`${SUB} text-center tabular-nums ${below(t, group.target) ? BELOW : "text-gray-700 dark:text-gray-200"}`}
              >
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

const Title = ({ span, children }: { span: number; children: ReactNode }) => (
  <tr>
    <td colSpan={span} className={`${CELL} border-gray-400 text-[13px] font-bold dark:border-gray-600`}>
      {children}
    </td>
    <td />
  </tr>
);

const Summary = ({ span, grey = false, children }: { span: number; grey?: boolean; children: ReactNode }) => (
  <tr>
    <td colSpan={span} className={`${CELL} ${grey ? GREY : ""} font-normal`}>
      {children}
    </td>
    <td />
  </tr>
);

const Gap = ({ span }: { span: number }) => (
  <tr aria-hidden>
    <td colSpan={span + 1} className="h-5" />
  </tr>
);

export default function WeeklySheet({ report }: { report: WeeklyReport }) {
  const { weeks } = report;
  const current = weeks.length - 1;
  const span = 2 + weeks.length;
  const byKey = new Map(report.groups.map((g) => [g.key, g]));
  const g = (key: GroupKey) => byKey.get(key)!;
  const rostered = (...keys: GroupKey[]) => keys.reduce((n, k) => n + g(k).rostered, 0);

  const weekLabel = (w: ReportWeek, i: number) =>
    weeks.length === 1 ? (w.partial ? "This week" : "Week") : i === current ? "Current" : `Week -${current - i}`;
  const weekRows = (grey = false) => (
    <>
      <tr>
        <td colSpan={2} className={`${CELL} ${grey ? GREY : ""}`} />
        {weeks.map((w, i) => (
          <td key={w.start} className={`${CELL} whitespace-nowrap px-1 text-[11px]`}>
            {weekLabel(w, i)}
          </td>
        ))}
        <td className={SIDE}>Target Efficiency</td>
      </tr>
      <tr>
        <td colSpan={2} className={`${CELL} ${grey ? GREY : ""}`} />
        {weeks.map((w, i) => (
          <td key={w.start} className={`${CELL} whitespace-nowrap px-1 text-[11px] ${i === current ? "" : "font-normal"}`}>
            {sheetWeekLabel(w)}
          </td>
        ))}
        <td />
      </tr>
    </>
  );
  const block = (key: GroupKey, label: string, rows: [string, string], extra?: Partial<BlockProps>) => (
    <Block group={g(key)} label={label} rows={rows} current={current} {...extra} />
  );

  return (
    <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
      <table className="w-full table-fixed border-collapse text-xs" style={{ minWidth: 440 + weeks.length * 175 }}>
        <colgroup>
          <col className="w-[200px]" />
          <col className="w-[110px]" />
          {weeks.map((w) => (
            <col key={w.start} className="w-[175px]" />
          ))}
          <col className="w-[130px]" />
        </colgroup>
        <tbody>
          <Title span={span}>Week on Week Report - Critical Flow</Title>
          <Summary span={span}>
            Writers - {rostered("stables", "part-time", "tenured")} · Full time {rostered("stables", "tenured")} (including
            stables) · Part time {g("part-time").rostered}
          </Summary>
          {weekRows()}
          {block("stables", "Stables Writers", ["Avg per writer", "Total"])}
          <Gap span={span} />
          {block("part-time", "Part time writers", ["Avg per writer", "Total"])}
          <Gap span={span} />
          {block("tenured", "Tenured writers", ["Avg per writer", "Total"])}
          <Gap span={span} />

          <Title span={span}>Week on Week Report - Editors (Non Pod Divisions)</Title>
          <Summary span={span}>
            Total - {rostered("editors", "associate-editors", "newsroom")} (editors {g("editors").rostered} · associates{" "}
            {g("associate-editors").rostered} · newsroom {g("newsroom").rostered})
          </Summary>
          {weekRows()}
          {block("editors", "Editors", ["Avg per editor", "Total"])}
          <Gap span={span} />
          {block("associate-editors", "Associate Editors", ["Avg per editor", "Total"])}
          <Gap span={span} />
          {block("newsroom", "Newsroom Editors", ["Avg per editor", "Total"])}
          <Gap span={span} />

          <Title span={span}>Week on Week Report - Producers</Title>
          <Summary span={span}>
            Total - {g("producers").rostered} ({g("producers").divisions.join(", ")})
          </Summary>
          {weekRows()}
          {block("producers", "Producers", ["Avg per Producer", "Total"])}
          <Gap span={span} />

          <Title span={span}>Week on Week Report - Editors (Pod/Non-Pod)</Title>
          <Summary span={span} grey>
            Editors Total - {rostered("associates", "pod", "non-pod")} · what they wrote themselves
          </Summary>
          {weekRows(true)}
          {block("associates", "ASSOCIATES", ["Avg per Editor", "Total"], { grey: true, allGreen: true })}
          <Gap span={span} />
          {block("pod", "POD", ["Avg per Editor", "Total"], { grey: true, allGreen: true })}
          <Gap span={span} />
          {block("non-pod", "NON-POD", ["Avg per Editor", "Total"], { grey: true, allGreen: true })}
          <Gap span={span} />

          <Title span={span}>Not in the sheet - Writers missing from Team Structure</Title>
          {weekRows()}
          {block("unlisted", "Not on Team Structure", ["Avg per writer", "Total"])}
        </tbody>
      </table>
    </div>
  );
}
