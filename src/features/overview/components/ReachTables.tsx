"use client";

import { useCallback } from "react";
import { ExternalLink } from "lucide-react";
import { fmtInt } from "@/features/critical-flow/format";
import { useTableSort, SortableTh } from "@/components/ui/SortableTable";
import ExportCsvButton from "@/components/ui/ExportCsvButton";
import type { CsvColumn } from "@/lib/csv";
import { REACH_COLUMNS, type ReachColumn } from "../reach";
import { DESK_LABEL, SITE_URL, type Desk, type Overview, type OverviewGroup, type Reach } from "../types";

export const card = "rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900";

export function ColumnLabel({ column }: { column: Pick<ReachColumn, "label" | "swatch"> }) {
  if (!column.swatch) return <>{column.label}</>;
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`h-1.5 w-1.5 rounded-full ${column.swatch}`} />
      {column.label}
    </span>
  );
}

function ReachCells({ row, strong = false }: { row: Reach; strong?: boolean }) {
  return (
    <>
      {REACH_COLUMNS.map((c) => {
        const v = c.value(row);
        return (
          <td
            key={c.key}
            className={`whitespace-nowrap px-3 py-1.5 text-right tabular-nums ${
              strong || c.key === "sessions"
                ? "font-semibold text-gray-900 dark:text-white"
                : !v
                  ? "text-gray-300 dark:text-gray-600"
                  : "text-gray-600 dark:text-gray-400"
            }`}
          >
            {c.format(v)}
          </td>
        );
      })}
    </>
  );
}

export function DeskTable({ data }: { data: Overview }) {
  const desks: Desk[] = ["yahoo", "nonYahoo"];
  return (
    <div className={card}>
      <div className="mb-3">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white">By desk</h2>
        <p className="text-[11px] text-gray-400 dark:text-gray-500">
          Yahoo is every article on the Yahoo sheet; Non-Yahoo is the rest of the Critical Flow sheets
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-xs">
          <thead className="text-gray-400 dark:text-gray-500">
            <tr className="border-b border-gray-100 dark:border-gray-800">
              <th className="px-3 py-2 text-left font-medium">Desk</th>
              {REACH_COLUMNS.map((c) => (
                <th key={c.key} className="whitespace-nowrap px-3 py-2 text-right font-medium">
                  <ColumnLabel column={c} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {desks.map((d) => (
              <tr key={d} className="border-b border-gray-50 dark:border-gray-800/50">
                <td className="px-3 py-1.5 font-medium text-gray-900 dark:text-white">{DESK_LABEL[d]}</td>
                <ReachCells row={data.desks[d]} />
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-gray-200 dark:border-gray-700">
              <td className="px-3 py-1.5 font-semibold text-gray-900 dark:text-white">Total</td>
              <ReachCells row={data.totals} strong />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

const isNobody = (name: string) => /^No (writer|editor) recorded$/.test(name);

export function GroupTable({
  title,
  subtitle,
  nameLabel,
  rows,
  showDivision,
  csv,
  onPick,
}: {
  title: string;
  subtitle: string;
  nameLabel: string;
  rows: OverviewGroup[];
  showDivision: boolean;
  csv: string;
  /** Opens the articles behind a row. */
  onPick: (name: string) => void;
}) {
  const getValue = useCallback((r: OverviewGroup, key: string) => {
    if (key === "name") return r.name;
    if (key === "division") return r.division || null;
    if (key === "top") return r.top?.sessions ?? null;
    return REACH_COLUMNS.find((c) => c.key === key)?.value(r) ?? null;
  }, []);
  const { sorted, sortKey, sortDir, handleSort } = useTableSort(rows, getValue);
  const columns: CsvColumn<OverviewGroup>[] = [
    { header: nameLabel, value: (r) => r.name },
    ...(showDivision ? [{ header: "Division", value: (r: OverviewGroup) => r.division }] : []),
    ...REACH_COLUMNS.map((c) => ({ header: c.label, value: (r: OverviewGroup) => c.csv(c.value(r)) })),
    { header: "Best article", value: (r) => r.top?.title ?? null },
    { header: "Best article sessions", value: (r) => r.top?.sessions ?? null },
    { header: "Best article URL", value: (r) => (r.top ? SITE_URL + r.top.path : null) },
  ];

  return (
    <div className={card}>
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">{title}</h2>
          <p className="text-[11px] text-gray-400 dark:text-gray-500">{subtitle}</p>
        </div>
        <ExportCsvButton rows={sorted} columns={columns} filename={`overview-${csv}`} />
      </div>
      <div className="max-h-[640px] overflow-auto">
        <table className="w-full min-w-[1080px] text-xs">
          <thead className="sticky top-0 z-10 bg-white text-gray-400 dark:bg-gray-900 dark:text-gray-500">
            <tr className="border-b border-gray-100 dark:border-gray-800">
              <SortableTh label={nameLabel} colKey="name" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
              {showDivision && (
                <SortableTh label="Division" colKey="division" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
              )}
              {REACH_COLUMNS.map((c) => (
                <SortableTh
                  key={c.key}
                  label={<ColumnLabel column={c} />}
                  colKey={c.key}
                  align="right"
                  sortKey={sortKey}
                  sortDir={sortDir}
                  onSort={handleSort}
                />
              ))}
              <SortableTh label="Best article" colKey="top" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
            </tr>
          </thead>
          <tbody>
            {sorted.map((r) => (
              <tr key={r.name} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/60 dark:border-gray-800/50 dark:hover:bg-gray-800/30">
                <td className="whitespace-nowrap px-3 py-1.5">
                  <button
                    type="button"
                    onClick={() => onPick(r.name)}
                    title={`Show the ${fmtInt(r.published)} articles`}
                    className={`text-left font-medium hover:text-indigo-600 hover:underline dark:hover:text-indigo-400 ${
                      isNobody(r.name) ? "italic text-gray-400 dark:text-gray-500" : "text-gray-900 dark:text-white"
                    }`}
                  >
                    {r.name}
                  </button>
                </td>
                {showDivision && (
                  <td className="whitespace-nowrap px-3 py-1.5 text-gray-500 dark:text-gray-400">{r.division || "—"}</td>
                )}
                <ReachCells row={r} />
                <td className="max-w-[280px] px-3 py-1.5">
                  {r.top ? (
                    <a
                      href={SITE_URL + r.top.path}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={r.top.title}
                      className="group flex items-center gap-1.5 text-gray-600 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400"
                    >
                      <span className="truncate">{r.top.title}</span>
                      <span className="shrink-0 tabular-nums text-gray-400">{fmtInt(r.top.sessions)}</span>
                      <ExternalLink size={11} className="shrink-0 opacity-0 group-hover:opacity-100" />
                    </a>
                  ) : (
                    <span className="text-gray-300 dark:text-gray-600">—</span>
                  )}
                </td>
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={REACH_COLUMNS.length + (showDivision ? 3 : 2)} className="px-3 py-8 text-center text-gray-400">
                  Nothing was published in this period
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
