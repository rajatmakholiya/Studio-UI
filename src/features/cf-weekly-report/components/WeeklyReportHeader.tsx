"use client";

import { CalendarRange, ChevronLeft, ChevronRight } from "lucide-react";
import ExportCsvButton from "@/components/ui/ExportCsvButton";
import type { CsvColumn } from "@/lib/csv";
import type { ReportWeek, WeekTally, WeeklyReport } from "../types";
import { shortDate } from "../format";

export type ReportView = "this" | "last" | "four";

interface Props {
  report?: WeeklyReport;
  loading: boolean;
  /** Move the window by this many weeks. */
  onShift: (weeks: number) => void;
  onPick: (view: ReportView) => void;
}

interface CsvRow {
  group: string;
  person: string;
  division: string;
  weeks: WeekTally[];
  target: number | null;
}

const csvColumns = (weeks: ReportWeek[]): CsvColumn<CsvRow>[] => [
  { header: "Group", value: (r) => r.group },
  { header: "Person", value: (r) => r.person },
  { header: "Division", value: (r) => r.division },
  ...weeks.flatMap((w, i) => {
    const label = `${w.start} to ${w.through}`;
    return [
      { header: `${label} per day`, value: (r: CsvRow) => r.weeks[i].perDay },
      { header: `${label} pieces`, value: (r: CsvRow) => r.weeks[i].output },
      { header: `${label} people`, value: (r: CsvRow) => r.weeks[i].active },
      { header: `${label} days`, value: (r: CsvRow) => r.weeks[i].daysWorked },
    ];
  }),
  { header: "Target per day", value: (r) => r.target },
];

const VIEWS: { key: ReportView; label: string }[] = [
  { key: "this", label: "This week" },
  { key: "last", label: "Last week" },
  { key: "four", label: "Last 4 weeks" },
];

/** Which quick view the window matches, if any — after paging it may match none. */
function currentView(report?: WeeklyReport): ReportView | null {
  const weeks = report?.weeks ?? [];
  const last = weeks.at(-1);
  if (!report || !last) return null;
  if (weeks.length === 1 && last.end === report.latestEnd) return "this";
  if (weeks.length === 1 && last.end === report.lastCompleteEnd) return "last";
  if (weeks.length === 4 && last.end === report.lastCompleteEnd) return "four";
  return null;
}

export default function WeeklyReportHeader({ report, loading, onShift, onPick }: Props) {
  const weeks = report?.weeks ?? [];
  const first = weeks[0];
  const last = weeks.at(-1);
  const atLatest = !!last && last.end >= (report?.latestEnd ?? "");
  const view = currentView(report);
  const csvRows: CsvRow[] = (report?.groups ?? []).flatMap((g) => [
    { group: g.name, person: "", division: "", weeks: g.weeks, target: g.target },
    ...g.members.map((m) => ({ group: g.name, person: m.name, division: m.division, weeks: m.weeks, target: g.target })),
  ]);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex rounded-lg border border-gray-200 p-0.5 dark:border-gray-700" role="group" aria-label="Weeks shown">
          {VIEWS.map((v) => (
            <button
              key={v.key}
              onClick={() => onPick(v.key)}
              aria-pressed={view === v.key}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                view === v.key
                  ? "bg-indigo-600 text-white"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white"
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>
        <div className="flex items-center rounded-lg border border-gray-200 dark:border-gray-700">
          <button
            onClick={() => onShift(-1)}
            disabled={!first}
            title="One week earlier"
            className="rounded-l-lg px-2 py-1.5 text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-900 disabled:opacity-40 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
          >
            <ChevronLeft size={14} />
          </button>
          <span
            className={`inline-flex items-center gap-1.5 border-x border-gray-200 px-3 py-1.5 text-xs font-medium text-indigo-700 dark:border-gray-700 dark:text-indigo-400 ${
              loading ? "opacity-60" : ""
            }`}
          >
            <CalendarRange size={14} />
            {first && last ? `${shortDate(first.start)} – ${shortDate(last.through)}${last.partial ? " (so far)" : ""}` : "…"}
          </span>
          <button
            onClick={() => onShift(1)}
            disabled={!last || atLatest}
            title={atLatest ? "Already at the week in progress" : "One week later"}
            className="rounded-r-lg px-2 py-1.5 text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-900 disabled:opacity-40 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-[11px] text-gray-400">
          Weeks run Monday to Sunday · people from Team Structure · computed from Critical Flow and Yahoo production ·
          open a group to see each person
        </span>
        <ExportCsvButton rows={csvRows} columns={csvColumns(weeks)} filename="cf-weekly-report" />
      </div>
    </div>
  );
}
