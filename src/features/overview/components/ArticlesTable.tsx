"use client";

import { useCallback, useMemo, useState } from "react";
import { ExternalLink, Search, X } from "lucide-react";
import { fmtDay, fmtInt } from "@/features/critical-flow/format";
import { useTableSort, SortableTh } from "@/components/ui/SortableTable";
import ExportCsvButton from "@/components/ui/ExportCsvButton";
import type { CsvColumn } from "@/lib/csv";
import { DESK_LABEL, PLATFORMS, SITE_URL, type OverviewArticle } from "../types";
import { PLATFORM_KEYS } from "../reach";
import { card, ColumnLabel } from "./ReachTables";

export type ArticleFilter = { field: "writer" | "editor" | "division"; value: string };

const FIELD_LABEL: Record<ArticleFilter["field"], string> = { writer: "Writer", editor: "Editor", division: "Division" };
const PAGE = 100;

const CSV_COLUMNS: CsvColumn<OverviewArticle>[] = [
  { header: "Title", value: (a) => a.title },
  { header: "Desk", value: (a) => DESK_LABEL[a.desk] },
  { header: "Division", value: (a) => a.division },
  { header: "Writer", value: (a) => a.writer },
  { header: "Editor", value: (a) => a.editor },
  { header: "Published", value: (a) => a.publishedDay },
  ...PLATFORMS.map((p) => ({ header: p.label, value: (a: OverviewArticle) => a.platforms[p.key] })),
  { header: "Sessions", value: (a) => a.sessions },
  { header: "URL", value: (a) => (a.path ? SITE_URL + a.path : null) },
];

export default function ArticlesTable({
  articles,
  filter,
  onClearFilter,
}: {
  articles: OverviewArticle[];
  filter: ArticleFilter | null;
  onClearFilter: () => void;
}) {
  const [query, setQuery] = useState("");
  const [reachedOnly, setReachedOnly] = useState(false);
  const [limit, setLimit] = useState(PAGE);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return articles.filter(
      (a) =>
        (!filter || a[filter.field] === filter.value) &&
        (!reachedOnly || a.sessions > 0) &&
        (!q || a.title.toLowerCase().includes(q) || a.writer.toLowerCase().includes(q) || a.editor.toLowerCase().includes(q)),
    );
  }, [articles, filter, query, reachedOnly]);

  const getValue = useCallback((a: OverviewArticle, key: string) => {
    if (PLATFORM_KEYS.has(key)) return a.platforms[key as keyof OverviewArticle["platforms"]];
    if (key === "desk") return DESK_LABEL[a.desk];
    return a[key as "title" | "division" | "writer" | "editor" | "publishedDay" | "sessions"];
  }, []);
  const { sorted, sortKey, sortDir, handleSort } = useTableSort(rows, getValue);
  const visible = sorted.slice(0, limit);
  const th = (label: React.ReactNode, colKey: string, align: "left" | "right" = "left") => (
    <SortableTh label={label} colKey={colKey} align={align} sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
  );

  return (
    <div className={card}>
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Articles</h2>
          <p className="text-[11px] text-gray-400 dark:text-gray-500">
            Each article published in the period and the social landings its page drew
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {filter && (
            <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 py-0.5 pl-2.5 pr-1 text-[11px] font-medium text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300">
              {FIELD_LABEL[filter.field]}: {filter.value}
              <button type="button" onClick={onClearFilter} aria-label="Clear filter" className="rounded-full p-0.5 hover:bg-indigo-100 dark:hover:bg-indigo-500/20">
                <X size={11} />
              </button>
            </span>
          )}
          <label className="inline-flex cursor-pointer items-center gap-1.5 text-[11px] text-gray-500 dark:text-gray-400">
            <input
              type="checkbox"
              checked={reachedOnly}
              onChange={(e) => setReachedOnly(e.target.checked)}
              className="h-3 w-3 rounded border-gray-300 accent-indigo-600"
            />
            Reached social only
          </label>
          <div className="relative">
            <Search size={12} className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setLimit(PAGE);
              }}
              placeholder="Search title or person"
              className="w-48 rounded-lg border border-gray-200 bg-transparent py-1 pl-7 pr-2 text-[11px] text-gray-700 outline-none focus:border-indigo-400 dark:border-gray-700 dark:text-gray-200"
            />
          </div>
          <ExportCsvButton rows={sorted} columns={CSV_COLUMNS} filename="overview-articles" />
        </div>
      </div>
      <div className="max-h-[720px] overflow-auto">
        <table className="w-full min-w-[1080px] text-xs">
          <thead className="sticky top-0 z-10 bg-white text-gray-400 dark:bg-gray-900 dark:text-gray-500">
            <tr className="border-b border-gray-100 dark:border-gray-800">
              {th("Article", "title")}
              {th("Desk", "desk")}
              {th("Division", "division")}
              {th("Writer", "writer")}
              {th("Editor", "editor")}
              {th("Published", "publishedDay")}
              {PLATFORMS.map((p) => (
                <SortableTh
                  key={p.key}
                  label={<ColumnLabel column={p} />}
                  colKey={p.key}
                  align="right"
                  sortKey={sortKey}
                  sortDir={sortDir}
                  onSort={handleSort}
                />
              ))}
              {th("Sessions", "sessions", "right")}
            </tr>
          </thead>
          <tbody>
            {visible.map((a) => (
              <tr key={a.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/60 dark:border-gray-800/50 dark:hover:bg-gray-800/30">
                <td className="max-w-[380px] px-3 py-1.5">
                  {a.path ? (
                    <a
                      href={SITE_URL + a.path}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={a.title}
                      className="group flex items-center gap-1.5 font-medium text-gray-900 hover:text-indigo-600 dark:text-white dark:hover:text-indigo-400"
                    >
                      <span className="truncate">{a.title}</span>
                      <ExternalLink size={11} className="shrink-0 opacity-0 group-hover:opacity-100" />
                    </a>
                  ) : (
                    <span className="block truncate text-gray-500 dark:text-gray-400" title={`${a.title} — no social landing matched`}>
                      {a.title}
                    </span>
                  )}
                </td>
                <td className="whitespace-nowrap px-3 py-1.5 text-gray-500 dark:text-gray-400">{DESK_LABEL[a.desk]}</td>
                <td className="whitespace-nowrap px-3 py-1.5 text-gray-500 dark:text-gray-400">{a.division}</td>
                <td className="whitespace-nowrap px-3 py-1.5 text-gray-700 dark:text-gray-300">{a.writer}</td>
                <td className="whitespace-nowrap px-3 py-1.5 text-gray-700 dark:text-gray-300">{a.editor}</td>
                <td className="whitespace-nowrap px-3 py-1.5 text-gray-500 dark:text-gray-400">{fmtDay(a.publishedDay)}</td>
                {PLATFORMS.map((p) => (
                  <td
                    key={p.key}
                    className={`px-3 py-1.5 text-right tabular-nums ${
                      a.platforms[p.key] ? "text-gray-600 dark:text-gray-400" : "text-gray-300 dark:text-gray-600"
                    }`}
                  >
                    {fmtInt(a.platforms[p.key])}
                  </td>
                ))}
                <td
                  className={`px-3 py-1.5 text-right font-semibold tabular-nums ${
                    a.sessions ? "text-gray-900 dark:text-white" : "text-gray-300 dark:text-gray-600"
                  }`}
                >
                  {fmtInt(a.sessions)}
                </td>
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={7 + PLATFORMS.length} className="px-3 py-8 text-center text-gray-400">
                  No articles match
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {sorted.length > 0 && (
        <div className="mt-3 flex items-center justify-between text-[11px] text-gray-400 dark:text-gray-500">
          <span>
            Showing {fmtInt(visible.length)} of {fmtInt(sorted.length)}
          </span>
          {sorted.length > limit && (
            <button
              type="button"
              onClick={() => setLimit(sorted.length)}
              className="font-medium text-indigo-600 hover:underline dark:text-indigo-400"
            >
              Show all {fmtInt(sorted.length)}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
