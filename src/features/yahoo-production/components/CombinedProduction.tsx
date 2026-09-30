"use client";

import { useCallback, type ReactNode } from "react";
import type { CombinedProductionResult, ProductionSplit } from "../types";
import { fmtDay, fmtInt } from "@/features/critical-flow/format";
import { useTableSort, SortableTh } from "@/components/ui/SortableTable";
import ExportCsvButton from "@/components/ui/ExportCsvButton";
import type { CsvColumn } from "@/lib/csv";

interface Props {
  data?: CombinedProductionResult;
  isLoading: boolean;
}

/** One split column group: which split a column reads, and its label prefix. */
interface SplitGroup<T> {
  key: string;
  label: string;
  get: (row: T) => ProductionSplit;
}

interface TableSpec<T> {
  title: string;
  subtitle: string;
  csv: string;
  rows: T[];
  /** Leading text columns: [sort key, header, cell, csv value]. */
  lead: { key: string; label: string; cell: (r: T) => ReactNode; value: (r: T) => string | number }[];
  groups: SplitGroup<T>[];
  /** An extra trailing numeric column (writers' sent-backs). */
  extra?: { key: string; label: string; value: (r: T) => number };
  maxHeight?: string;
}

const PART_LABEL: Record<keyof ProductionSplit, string> = {
  yahoo: "Yahoo",
  nonYahoo: "Non-Yahoo",
  total: "Total",
};
const PARTS: (keyof ProductionSplit)[] = ["yahoo", "nonYahoo", "total"];

function SplitTable<T>({ spec }: { spec: TableSpec<T> }) {
  const { lead, groups, extra } = spec;
  const getValue = useCallback(
    (r: T, key: string) => {
      const l = lead.find((c) => c.key === key);
      if (l) return l.value(r);
      if (extra && key === extra.key) return extra.value(r);
      const [g, part] = key.split(".");
      const group = groups.find((x) => x.key === g);
      return group ? group.get(r)[part as keyof ProductionSplit] : null;
    },
    [lead, groups, extra],
  );
  const { sorted, sortKey, sortDir, handleSort } = useTableSort(spec.rows, getValue);

  const columns: CsvColumn<T>[] = [
    ...lead.map((c) => ({ header: c.label, value: c.value })),
    ...groups.flatMap((g) =>
      PARTS.map((part) => ({
        header: groups.length > 1 ? `${g.label} ${PART_LABEL[part]}` : PART_LABEL[part],
        value: (r: T) => g.get(r)[part],
      })),
    ),
    ...(extra ? [{ header: extra.label, value: extra.value }] : []),
  ];

  const total = (g: SplitGroup<T>, part: keyof ProductionSplit) =>
    spec.rows.reduce((s, r) => s + g.get(r)[part], 0);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">{spec.title}</h2>
          <p className="text-[11px] text-gray-400 dark:text-gray-500">{spec.subtitle}</p>
        </div>
        <ExportCsvButton rows={sorted} columns={columns} filename={`yahoo-combined-${spec.csv}`} />
      </div>
      <div className={`overflow-auto ${spec.maxHeight ?? "max-h-[520px]"}`}>
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-white text-gray-400 dark:bg-gray-900 dark:text-gray-500">
            {groups.length > 1 && (
              <tr>
                {lead.map((c) => <th key={c.key} />)}
                {groups.map((g) => (
                  <th key={g.key} colSpan={3} className="border-b border-gray-100 px-3 pt-1 text-center font-medium dark:border-gray-800">
                    {g.label}
                  </th>
                ))}
                {extra && <th />}
              </tr>
            )}
            <tr className="border-b border-gray-100 dark:border-gray-800">
              {lead.map((c) => (
                <SortableTh key={c.key} label={c.label} colKey={c.key} sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
              ))}
              {groups.flatMap((g) =>
                PARTS.map((part) => (
                  <SortableTh
                    key={`${g.key}.${part}`}
                    label={PART_LABEL[part]}
                    colKey={`${g.key}.${part}`}
                    align="right"
                    sortKey={sortKey}
                    sortDir={sortDir}
                    onSort={handleSort}
                  />
                )),
              )}
              {extra && (
                <SortableTh label={extra.label} colKey={extra.key} align="right" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
              )}
            </tr>
          </thead>
          <tbody>
            {sorted.map((r, i) => (
              <tr key={i} className="border-b border-gray-50 last:border-0 dark:border-gray-800/50">
                {lead.map((c) => (
                  <td key={c.key} className="px-3 py-1.5 text-gray-700 dark:text-gray-300">{c.cell(r)}</td>
                ))}
                {groups.flatMap((g) =>
                  PARTS.map((part) => (
                    <td
                      key={`${g.key}.${part}`}
                      className={`px-3 py-1.5 text-right tabular-nums ${
                        part === "total" ? "font-semibold text-gray-900 dark:text-white" : "text-gray-600 dark:text-gray-400"
                      }`}
                    >
                      {fmtInt(g.get(r)[part])}
                    </td>
                  )),
                )}
                {extra && (
                  <td className="px-3 py-1.5 text-right tabular-nums text-gray-600 dark:text-gray-400">{fmtInt(extra.value(r))}</td>
                )}
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={lead.length + groups.length * 3 + (extra ? 1 : 0)} className="px-3 py-8 text-center text-gray-400">
                  Nothing in this range
                </td>
              </tr>
            )}
          </tbody>
          {sorted.length > 0 && (
            <tfoot className="sticky bottom-0 bg-white dark:bg-gray-900">
              <tr className="border-t border-gray-200 font-semibold text-gray-900 dark:border-gray-700 dark:text-white">
                <td className="px-3 py-1.5" colSpan={lead.length}>Total</td>
                {groups.flatMap((g) =>
                  PARTS.map((part) => (
                    <td key={`${g.key}.${part}`} className="px-3 py-1.5 text-right tabular-nums">{fmtInt(total(g, part))}</td>
                  )),
                )}
                {extra && (
                  <td className="px-3 py-1.5 text-right tabular-nums">
                    {fmtInt(spec.rows.reduce((s, r) => s + extra.value(r), 0))}
                  </td>
                )}
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}

function SplitCard({ title, hint, split }: { title: string; hint: string; split?: ProductionSplit }) {
  const yahooShare = split && split.total > 0 ? (split.yahoo / split.total) * 100 : 0;
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{title}</p>
      <p className="mt-1 text-3xl font-bold tabular-nums text-gray-900 dark:text-white">{fmtInt(split?.total)}</p>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
        <div className="h-full rounded-full bg-indigo-500" style={{ width: `${yahooShare}%` }} />
      </div>
      <div className="mt-2 flex justify-between text-[11px] tabular-nums">
        <span className="text-indigo-600 dark:text-indigo-400">Yahoo {fmtInt(split?.yahoo)}</span>
        <span className="text-gray-500 dark:text-gray-400">Non-Yahoo {fmtInt(split?.nonYahoo)}</span>
      </div>
      <p className="mt-2 text-[10px] text-gray-400 dark:text-gray-500">{hint}</p>
    </div>
  );
}

export default function CombinedProduction({ data, isLoading }: Props) {
  if (isLoading || !data) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          {[0, 1].map((i) => (
            <div key={i} className="h-40 animate-pulse rounded-2xl border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-800/50" />
          ))}
        </div>
        <div className="h-96 animate-pulse rounded-2xl border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-800/50" />
      </div>
    );
  }

  type Day = CombinedProductionResult["days"][number];
  type Div = CombinedProductionResult["divisions"][number];
  type Writer = CombinedProductionResult["writers"][number];
  type Editor = CombinedProductionResult["editors"][number];

  const daySpec: TableSpec<Day> = {
    title: "Published by day",
    subtitle: "Each sheet's own publication date",
    csv: "days",
    rows: data.days,
    lead: [{ key: "date", label: "Date", cell: (r) => fmtDay(r.date), value: (r) => r.date }],
    groups: [{ key: "published", label: "Published", get: (r) => r.published }],
  };
  const divSpec: TableSpec<Div> = {
    title: "By division",
    subtitle: "Yahoo's CFB, Tennis and Olympics are counted under College Football and US Sports",
    csv: "divisions",
    rows: data.divisions,
    lead: [{ key: "division", label: "Division", cell: (r) => <span className="font-medium text-gray-900 dark:text-white">{r.division}</span>, value: (r) => r.division }],
    groups: [
      { key: "submitted", label: "Submitted", get: (r) => r.submitted },
      { key: "published", label: "Published", get: (r) => r.published },
    ],
  };
  const writerSpec: TableSpec<Writer> = {
    title: "Writer production",
    subtitle: "Pieces submitted in the range, by the day they were submitted",
    csv: "writers",
    rows: data.writers,
    lead: [
      { key: "writer", label: "Writer", cell: (r) => <span className="font-medium text-gray-900 dark:text-white">{r.writer}</span>, value: (r) => r.writer },
      { key: "division", label: "Division", cell: (r) => r.division || "—", value: (r) => r.division },
    ],
    groups: [{ key: "submitted", label: "Submitted", get: (r) => r.submitted }],
    extra: { key: "sentBack", label: "Sent back", value: (r) => r.sentBack },
  };
  const editorSpec: TableSpec<Editor> = {
    title: "Editor production",
    subtitle: "Pieces published in the range; for Yahoo, the newsroom editor who published it",
    csv: "editors",
    rows: data.editors,
    lead: [
      { key: "editor", label: "Editor", cell: (r) => <span className="font-medium text-gray-900 dark:text-white">{r.editor}</span>, value: (r) => r.editor },
      { key: "division", label: "Division", cell: (r) => r.division || "—", value: (r) => r.division },
    ],
    groups: [{ key: "published", label: "Published", get: (r) => r.published }],
  };

  return (
    <div className="space-y-4">
      <p className="rounded-xl border border-indigo-100 bg-indigo-50/60 px-4 py-2.5 text-[11px] leading-relaxed text-indigo-900 dark:border-indigo-500/20 dark:bg-indigo-500/10 dark:text-indigo-200">
        <strong>Yahoo</strong> is every piece on the Yahoo sheet; <strong>Non-Yahoo</strong> is the rest of the Critical Flow sheets.
        {" "}{fmtInt(data.notes.sharedWithYahoo)} CF pieces are tracked on both sheets and are counted once, as Yahoo.
        {data.notes.undated > 0 && (
          <> {fmtInt(data.notes.undated)} pieces have no date on either sheet, so no range includes them.</>
        )}
      </p>

      <div className="grid gap-4 md:grid-cols-2">
        <SplitCard title="Submitted" hint="By the day each piece was submitted" split={data.totals.submitted} />
        <SplitCard title="Published" hint="By each sheet's publication date" split={data.totals.published} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <SplitTable spec={daySpec} />
        <SplitTable spec={divSpec} />
      </div>

      <div className="grid gap-4 2xl:grid-cols-2">
        <SplitTable spec={writerSpec} />
        <SplitTable spec={editorSpec} />
      </div>
    </div>
  );
}
