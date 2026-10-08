"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import type { StableQueue, StableQueueItem } from "../types";
import { fmtInt } from "@/features/critical-flow/format";
import ExportCsvButton from "@/components/ui/ExportCsvButton";
import type { CsvColumn } from "@/lib/csv";
import { FALLBACK_EVENT_COLOR, STAGE_STYLE } from "../palette";
import { EventChip, LinkOut, LoadingBlock, Panel, StagePill } from "./Bits";

const CSV_COLUMNS: CsvColumn<StableQueueItem>[] = [
  { header: "Event", value: (r) => r.event },
  { header: "Sport", value: (r) => r.sport },
  { header: "Sheet Row", value: (r) => r.sheetRow },
  { header: "Player", value: (r) => r.player },
  { header: "Title", value: (r) => r.title },
  { header: "Stable Type", value: (r) => r.stableType },
  { header: "New / Update", value: (r) => r.pieceKind },
  { header: "Writer", value: (r) => r.writer },
  { header: "Editor", value: (r) => r.editor },
  { header: "Stage", value: (r) => r.stage },
  { header: "Editing Status", value: (r) => r.editingStatus },
  { header: "Staging Link", value: (r) => r.stagingLink },
  { header: "Research Doc", value: (r) => r.researchDoc },
  { header: "Editor Comments", value: (r) => r.editorComments },
];

const PAGE = 100;

/** Everything still waiting on a writer or an editor, grouped by event. */
export default function QueueTable({
  data,
  isLoading,
  colors,
}: {
  data?: StableQueue;
  isLoading: boolean;
  colors: Map<string, string>;
}) {
  const [stage, setStage] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [shown, setShown] = useState(PAGE);

  const items = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return (data?.items ?? []).filter(
      (i) =>
        (!stage || i.stage === stage) &&
        (!needle ||
          [i.player, i.title, i.writer, i.editor, i.event, i.stableType]
            .join(" ")
            .toLowerCase()
            .includes(needle)),
    );
  }, [data, stage, q]);

  if (isLoading || !data) return <LoadingBlock height="h-96" />;

  return (
    <Panel
      title="Work Queue"
      subtitle={`${fmtInt(data.total)} pieces still need a writer or an editor`}
      actions={<ExportCsvButton rows={items} columns={CSV_COLUMNS} filename="stable-queue" />}
    >
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <button
          onClick={() => setStage(null)}
          className={`rounded-lg border px-2.5 py-1 text-[11px] font-medium ${
            stage === null
              ? "border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-400"
              : "border-gray-200 text-gray-500 dark:border-gray-700 dark:text-gray-400"
          }`}
        >
          All {fmtInt(data.total)}
        </button>
        {data.stages.map((s) => {
          const color = STAGE_STYLE[s.stage]?.color ?? "#94a3b8";
          const active = stage === s.stage;
          return (
            <button
              key={s.stage}
              onClick={() => setStage(active ? null : s.stage)}
              className="rounded-lg border px-2.5 py-1 text-[11px] font-medium transition-colors"
              style={{
                borderColor: active ? color : `${color}55`,
                backgroundColor: active ? `${color}22` : "transparent",
                color,
              }}
            >
              {s.stage} {fmtInt(s.count)}
            </button>
          );
        })}
        <div className="ml-auto flex items-center gap-2 rounded-lg border border-gray-200 px-2 py-1 dark:border-gray-700">
          <Search size={12} className="text-gray-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Player, writer, event…"
            className="w-44 bg-transparent text-xs text-gray-900 outline-none placeholder:text-gray-400 dark:text-white"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[1000px] text-xs">
          <thead className="text-gray-400 dark:text-gray-500">
            <tr className="border-b border-gray-100 dark:border-gray-800">
              <th className="px-3 py-2 text-left font-medium">Event</th>
              <th className="px-3 py-2 text-left font-medium">Piece</th>
              <th className="px-3 py-2 text-left font-medium">Writer</th>
              <th className="px-3 py-2 text-left font-medium">Editor</th>
              <th className="px-3 py-2 text-left font-medium">Stage</th>
              <th className="px-3 py-2 text-left font-medium">Links</th>
              <th className="px-3 py-2 text-left font-medium">Note</th>
            </tr>
          </thead>
          <tbody>
            {items.slice(0, shown).map((i) => (
              <tr key={i.id} className="border-b border-gray-50 align-top last:border-0 dark:border-gray-800/50">
                <td className="px-3 py-2">
                  <EventChip event={i.event} color={colors.get(i.event) ?? FALLBACK_EVENT_COLOR} />
                  <p className="mt-0.5 text-[10px] text-gray-400">row {i.sheetRow}</p>
                </td>
                <td className="max-w-[280px] px-3 py-2">
                  <p className="truncate font-medium text-gray-900 dark:text-white" title={i.title}>
                    {i.player}
                  </p>
                  <p className="text-[10px] text-gray-400">
                    {i.stableType}
                    {i.pieceKind && ` · ${i.pieceKind}`}
                  </p>
                </td>
                <td className="px-3 py-2 text-gray-700 dark:text-gray-300">{i.writer}</td>
                <td className="px-3 py-2 text-gray-700 dark:text-gray-300">
                  {i.editor === "Unknown" ? <span className="text-gray-300 dark:text-gray-600">—</span> : i.editor}
                </td>
                <td className="px-3 py-2">
                  <StagePill stage={i.stage} />
                </td>
                <td className="space-x-2 whitespace-nowrap px-3 py-2">
                  <LinkOut href={i.stagingLink} label="Staging" />
                  <LinkOut href={i.researchDoc.startsWith("http") ? i.researchDoc : ""} label="Research" />
                </td>
                <td className="max-w-[220px] truncate px-3 py-2 text-gray-500 dark:text-gray-400" title={i.editorComments}>
                  {i.editorComments || <span className="text-gray-300 dark:text-gray-600">—</span>}
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center text-gray-400">
                  Nothing waiting here
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {items.length > shown && (
        <button
          onClick={() => setShown((n) => n + PAGE)}
          className="mt-3 w-full rounded-lg border border-gray-200 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          Show {Math.min(PAGE, items.length - shown)} more of {fmtInt(items.length - shown)}
        </button>
      )}
    </Panel>
  );
}
