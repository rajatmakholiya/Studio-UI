"use client";

import { useCallback } from "react";
import { ExternalLink } from "lucide-react";
import { fmtDay, fmtInt } from "@/features/critical-flow/format";
import { useTableSort, SortableTh } from "@/components/ui/SortableTable";
import ExportCsvButton from "@/components/ui/ExportCsvButton";
import type { CsvColumn } from "@/lib/csv";
import {
  MEASURES,
  type RoundupCounts,
  type RoundupDay,
  type RoundupSheet,
  type RoundupSheetCounts,
  type SheetRoundup,
} from "../types";
import { nonYahooSource, yahooSource, type SourceSheet } from "../sources";

const card = "rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900";

const SHEET_COLUMNS: { key: keyof RoundupSheetCounts; label: string }[] = [
  ...MEASURES,
  { key: "pendingEditor", label: "Pending editor" },
];

function MeasureCard({ label, hint, data, measure }: { label: string; hint: string; data: SheetRoundup; measure: keyof RoundupCounts }) {
  const yahoo = data.yahoo.totals[measure];
  const nonYahoo = data.nonYahoo.totals[measure];
  const total = data.total[measure];
  const share = total > 0 ? (yahoo / total) * 100 : 0;
  return (
    <div className={card}>
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{label}</p>
      <p className="mt-1 text-3xl font-bold tabular-nums text-gray-900 dark:text-white">{fmtInt(total)}</p>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
        <div className="h-full rounded-full bg-indigo-500" style={{ width: `${share}%` }} />
      </div>
      <div className="mt-2 flex justify-between text-[11px] tabular-nums">
        <span className="text-indigo-600 dark:text-indigo-400">Yahoo {fmtInt(yahoo)}</span>
        <span className="text-gray-500 dark:text-gray-400">Non-Yahoo {fmtInt(nonYahoo)}</span>
      </div>
      <p className="mt-2 text-[10px] text-gray-400 dark:text-gray-500">{hint}</p>
    </div>
  );
}

function SheetTable({
  title,
  subtitle,
  sheetLabel,
  csv,
  rows,
  totals,
  source,
}: {
  title: string;
  subtitle: string;
  sheetLabel: string;
  csv: string;
  rows: RoundupSheet[];
  totals: RoundupSheetCounts;
  /** The source workbook a row's pieces sit on, so its pending count can open it. */
  source: (sheet: string) => SourceSheet | null;
}) {
  const getValue = useCallback((r: RoundupSheet, key: string) => (key === "sheet" ? r.sheet : r[key as keyof RoundupSheetCounts]), []);
  const { sorted, sortKey, sortDir, handleSort } = useTableSort(rows, getValue);
  const columns: CsvColumn<RoundupSheet>[] = [
    { header: sheetLabel, value: (r) => r.sheet },
    ...SHEET_COLUMNS.map((c) => ({ header: c.label, value: (r: RoundupSheet) => r[c.key] })),
  ];

  return (
    <div className={card}>
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">{title}</h2>
          <p className="text-[11px] text-gray-400 dark:text-gray-500">{subtitle}</p>
        </div>
        <ExportCsvButton rows={sorted} columns={columns} filename={`sheet-roundup-${csv}`} />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="text-gray-400 dark:text-gray-500">
            <tr className="border-b border-gray-100 dark:border-gray-800">
              <SortableTh label={sheetLabel} colKey="sheet" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
              {SHEET_COLUMNS.map((c) => (
                <SortableTh key={c.key} label={c.label} colKey={c.key} align="right" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((r) => (
              <tr key={r.sheet} className="border-b border-gray-50 last:border-0 dark:border-gray-800/50">
                <td className="px-3 py-1.5 font-medium text-gray-900 dark:text-white">{r.sheet}</td>
                {SHEET_COLUMNS.map((c) => {
                  const src = c.key === "pendingEditor" && r[c.key] ? source(r.sheet) : null;
                  return (
                    <td
                      key={c.key}
                      className={`px-3 py-1.5 text-right tabular-nums ${
                        !r[c.key]
                          ? "text-gray-300 dark:text-gray-600"
                          : c.key === "pendingEditor"
                            ? "font-medium text-amber-600 dark:text-amber-400"
                            : "text-gray-700 dark:text-gray-300"
                      }`}
                    >
                      {src ? (
                        <a
                          href={src.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group inline-flex items-center gap-1 hover:underline"
                          title={`Open the ${src.name} source sheet`}
                        >
                          <ExternalLink size={11} className="opacity-50 group-hover:opacity-100" />
                          {fmtInt(r[c.key])}
                        </a>
                      ) : (
                        fmtInt(r[c.key])
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={SHEET_COLUMNS.length + 1} className="px-3 py-8 text-center text-gray-400">No sheets synced yet</td>
              </tr>
            )}
          </tbody>
          {sorted.length > 0 && (
            <tfoot>
              <tr className="border-t border-gray-200 font-semibold text-gray-900 dark:border-gray-700 dark:text-white">
                <td className="px-3 py-1.5">Total</td>
                {SHEET_COLUMNS.map((c) => (
                  <td key={c.key} className="px-3 py-1.5 text-right tabular-nums">{fmtInt(totals[c.key])}</td>
                ))}
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}

const SIDES = [
  { key: "yahoo", label: "Yahoo" },
  { key: "nonYahoo", label: "Non-Yahoo" },
  { key: "total", label: "Total" },
] as const;

const dayValue = (d: RoundupDay, side: (typeof SIDES)[number]["key"], m: keyof RoundupCounts) =>
  side === "total" ? d.yahoo[m] + d.nonYahoo[m] : d[side][m];

function DayTable({ days }: { days: RoundupDay[] }) {
  const getValue = useCallback((d: RoundupDay, key: string) => {
    if (key === "date") return d.date;
    const [side, m] = key.split(".") as [(typeof SIDES)[number]["key"], keyof RoundupCounts];
    return dayValue(d, side, m);
  }, []);
  const { sorted, sortKey, sortDir, handleSort } = useTableSort(days, getValue);
  const columns: CsvColumn<RoundupDay>[] = [
    { header: "Date", value: (d) => d.date },
    ...SIDES.flatMap((s) => MEASURES.map((m) => ({ header: `${s.label} ${m.label}`, value: (d: RoundupDay) => dayValue(d, s.key, m.key) }))),
  ];
  const sum = (side: (typeof SIDES)[number]["key"], m: keyof RoundupCounts) => days.reduce((n, d) => n + dayValue(d, side, m), 0);

  return (
    <div className={card}>
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Day by day</h2>
          <p className="text-[11px] text-gray-400 dark:text-gray-500">Every day of the period, all sheets together</p>
        </div>
        <ExportCsvButton rows={sorted} columns={columns} filename="sheet-roundup-days" />
      </div>
      <div className="max-h-[520px] overflow-auto">
        <table className="w-full min-w-[720px] text-xs">
          <thead className="sticky top-0 bg-white text-gray-400 dark:bg-gray-900 dark:text-gray-500">
            <tr>
              <th />
              {SIDES.map((s) => (
                <th key={s.key} colSpan={3} className="border-b border-gray-100 px-3 pt-1 text-center font-medium dark:border-gray-800">
                  {s.label}
                </th>
              ))}
            </tr>
            <tr className="border-b border-gray-100 dark:border-gray-800">
              <SortableTh label="Date" colKey="date" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
              {SIDES.flatMap((s) =>
                MEASURES.map((m) => (
                  <SortableTh
                    key={`${s.key}.${m.key}`}
                    label={m.label}
                    colKey={`${s.key}.${m.key}`}
                    align="right"
                    sortKey={sortKey}
                    sortDir={sortDir}
                    onSort={handleSort}
                  />
                )),
              )}
            </tr>
          </thead>
          <tbody>
            {sorted.map((d) => (
              <tr key={d.date} className="border-b border-gray-50 last:border-0 dark:border-gray-800/50">
                <td className="whitespace-nowrap px-3 py-1.5 text-gray-700 dark:text-gray-300">{fmtDay(d.date)}</td>
                {SIDES.flatMap((s) =>
                  MEASURES.map((m) => (
                    <td
                      key={`${s.key}.${m.key}`}
                      className={`px-3 py-1.5 text-right tabular-nums ${
                        s.key === "total" ? "font-semibold text-gray-900 dark:text-white" : "text-gray-600 dark:text-gray-400"
                      }`}
                    >
                      {fmtInt(dayValue(d, s.key, m.key))}
                    </td>
                  )),
                )}
              </tr>
            ))}
          </tbody>
          <tfoot className="sticky bottom-0 bg-white dark:bg-gray-900">
            <tr className="border-t border-gray-200 font-semibold text-gray-900 dark:border-gray-700 dark:text-white">
              <td className="px-3 py-1.5">Total</td>
              {SIDES.flatMap((s) =>
                MEASURES.map((m) => (
                  <td key={`${s.key}.${m.key}`} className="px-3 py-1.5 text-right tabular-nums">{fmtInt(sum(s.key, m.key))}</td>
                )),
              )}
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

export default function SheetRoundupView({ data }: { data: SheetRoundup }) {
  const bbNews = data.notes.bbNews;
  return (
    <div className="space-y-4">
      <p className="rounded-xl border border-indigo-100 bg-indigo-50/60 px-4 py-2.5 text-[11px] leading-relaxed text-indigo-900 dark:border-indigo-500/20 dark:bg-indigo-500/10 dark:text-indigo-200">
        <strong>Yahoo</strong> is every article on the Yahoo sheet and the BB News sheet; <strong>Non-Yahoo</strong> is the rest of the Critical Flow sheets.
        {data.notes.sharedWithYahoo > 0 && (
          <> {fmtInt(data.notes.sharedWithYahoo)} articles in this period are on a Critical Flow sheet and the Yahoo sheet, and are counted once, under Yahoo.</>
        )}
        {" "}<strong>Written</strong> counts on the day it was submitted, <strong>edited</strong> on the day of its last editorial pass, and
        {" "}<strong>published</strong> on the sheet&apos;s publication date. Yahoo has one editorial pass, recorded at publishing, so its edited and published numbers run close.
        {" "}<strong>Pending editor</strong> is what was written in the period and has not been through an editor yet, as of the last sync; scrapped and on-hold pieces are left out.
        {" "}BB News counts as published on its WordPress live date, or where the sheet has none, on the day final verification marked it Completed.
      </p>

      {bbNews?.error && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-[11px] leading-relaxed text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
          {bbNews.readAt ? (
            <>The BB News sheet could not be re-read, so its numbers are as of {new Date(bbNews.readAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}.</>
          ) : (
            <>The BB News sheet could not be read, so it is missing from the Yahoo numbers.</>
          )}{" "}
          ({bbNews.error})
        </p>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <MeasureCard label="Written" hint="Submitted by the writer" data={data} measure="written" />
        <MeasureCard label="Edited" hint="Through an editorial pass" data={data} measure="edited" />
        <MeasureCard label="Published" hint="By each sheet's publication date" data={data} measure="published" />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <SheetTable
          title="Yahoo"
          subtitle="The Yahoo sheet by the division on each row, and the BB News sheet"
          sheetLabel="Division"
          csv="yahoo"
          rows={data.yahoo.sheets}
          totals={data.yahoo.totals}
          source={yahooSource}
        />
        <SheetTable
          title="Non-Yahoo"
          subtitle="One row per Critical Flow sheet"
          sheetLabel="Sheet"
          csv="non-yahoo"
          rows={data.nonYahoo.sheets}
          totals={data.nonYahoo.totals}
          source={nonYahooSource}
        />
      </div>

      {data.days.length > 1 && <DayTable days={data.days} />}
    </div>
  );
}
