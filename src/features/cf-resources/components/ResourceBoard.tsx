"use client";

import { useCallback } from "react";
import { ArrowRight } from "lucide-react";
import type { ResourceBoardResult, ResourcePerson } from "@/features/critical-flow/types";
import { csvTimestamp, fmtAgo } from "@/features/critical-flow/format";
import { useTableSort, SortableTh } from "@/components/ui/SortableTable";
import ExportCsvButton from "@/components/ui/ExportCsvButton";
import type { CsvColumn } from "@/lib/csv";
import StatusChip from "./StatusChip";

interface Props {
  data?: ResourceBoardResult;
  isLoading: boolean;
  onFindCover: (person: ResourcePerson) => void;
}

const ROLE_CLASS: Record<string, string> = {
  writer: "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400",
  editor: "bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-400",
  lead: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
  other: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
};

/** Sort key per column; statuses order by how much room the person has. */
const STATUS_RANK: Record<string, number> = {
  Free: 0, Available: 1, "At capacity": 2, Busy: 3, Overloaded: 4, Off: 5,
};

const FLAG_LABELS: Record<string, string> = {
  unlisted: "not on Team Structure",
  "duplicate-row": "listed twice",
  "week-off-unclear": "week off unclear",
  "off-desk": "outside CF/Yahoo",
  "no-team": "no division",
};
const flagLabel = (f: string) => FLAG_LABELS[f] ?? f.replaceAll("-", " ");

function csvColumns(date: string): CsvColumn<ResourcePerson>[] {
  const isEditor = (p: ResourcePerson) => p.roleGroup === "editor";
  return [
    { header: "Date", value: () => date },
    { header: "Status", value: (p) => p.status },
    { header: "Status Reason", value: (p) => p.statusReason },
    { header: "Name", value: (p) => p.name },
    { header: "Flags", value: (p) => p.flags.map(flagLabel).join("; ") },
    { header: "Division", value: (p) => p.primaryDivision },
    { header: "Sub-feed", value: (p) => p.subFeed },
    { header: "Role", value: (p) => p.roleGroup },
    { header: "Role Title", value: (p) => p.role },
    { header: "Pod", value: (p) => p.pod },
    { header: "Shift", value: (p) => p.shift },
    { header: "Shift Hours", value: (p) => p.shiftClock },
    { header: "Done Today", value: (p) => p.doneToday },
    { header: "Quota", value: (p) => p.quota },
    { header: "Done via Yahoo", value: (p) => p.doneYahoo },
    { header: "Verified Today", value: (p) => (isEditor(p) ? p.verifiedToday : null) },
    { header: "Undated Pieces", value: (p) => p.undatedPieces },
    { header: "Load", value: (p) => (isEditor(p) ? p.queue : p.inFlight) },
    { header: "Load Type", value: (p) => (isEditor(p) ? "to review" : "in flight") },
    { header: "Load via Yahoo", value: (p) => p.loadYahoo },
    { header: "Secondary Divisions", value: (p) => p.secondaryDivisions.join(", ") },
    { header: "Worked Divisions", value: (p) => p.workedDivisions.map((w) => `${w.division} ×${w.pieces}`).join(", ") },
    { header: "Off Today", value: (p) => (p.offToday ? "Yes" : "No") },
    { header: "Off Reason", value: (p) => p.offReason },
    { header: "Weekly Off", value: (p) => p.weekoff },
    { header: "Covered By", value: (p) => p.coveredBy },
    { header: "Backup", value: (p) => p.backup },
    { header: "Last Active", value: (p) => csvTimestamp(p.lastActive) },
  ];
}

export default function ResourceBoard({ data, isLoading, onFindCover }: Props) {
  const rows = data?.people ?? [];
  const getValue = useCallback((r: ResourcePerson, key: string) => {
    switch (key) {
      case "status": return STATUS_RANK[r.status] ?? 9;
      case "load": return r.roleGroup === "editor" ? r.queue : r.inFlight;
      case "progress": return r.quota ? r.doneToday / r.quota : r.doneToday;
      default: return r[key as keyof ResourcePerson] as string | number | null;
    }
  }, []);
  const { sorted, sortKey, sortDir, handleSort } = useTableSort(rows, getValue, { key: "status", dir: "asc" });

  if (isLoading || !data) {
    return <div className="h-[520px] animate-pulse rounded-2xl border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-800/50" />;
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Resource Board</h2>
          <p className="text-[11px] text-gray-400 dark:text-gray-500">
            Writers count submissions, editors count what they got published — Critical Flow and Yahoo together. Hover a status for the reason.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <span className="text-xs text-gray-400">{rows.length} people</span>
          <ExportCsvButton
            rows={sorted}
            columns={csvColumns(data.date)}
            filename="cf-resources-board"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[1040px] text-xs">
          <thead className="text-gray-400 dark:text-gray-500">
            <tr className="border-b border-gray-100 dark:border-gray-800">
              <SortableTh label="Status" colKey="status" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
              <SortableTh label="Name" colKey="name" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
              <SortableTh label="Division" colKey="primaryDivision" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
              <th className="px-3 py-2 text-left font-medium">Role</th>
              <SortableTh label="Shift" colKey="shift" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
              <SortableTh label="Today" colKey="progress" align="right" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
              <SortableTh label="Load" colKey="load" align="right" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
              <th className="px-3 py-2 text-left font-medium">Also covers</th>
              <th className="px-3 py-2 text-left font-medium">Off / backup</th>
              <SortableTh label="Last active" colKey="lastActive" align="right" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {sorted.map((p) => {
              const isEditor = p.roleGroup === "editor";
              return (
                <tr key={p.key} className={`border-b border-gray-50 last:border-0 dark:border-gray-800/50 ${p.offToday ? "opacity-60" : ""}`}>
                  <td className="px-3 py-2"><StatusChip status={p.status} reason={p.statusReason} /></td>
                  <td className="px-3 py-2">
                    <span className="font-medium text-gray-900 dark:text-white">{p.name}</span>
                    {p.flags.length > 0 && (
                      <p className="text-[10px] text-amber-600 dark:text-amber-400">
                        {p.flags.map(flagLabel).join(" · ")}
                      </p>
                    )}
                  </td>
                  <td className="px-3 py-2 text-gray-600 dark:text-gray-300">
                    {p.primaryDivision}{p.subFeed ? <span className="text-gray-400"> · {p.subFeed}</span> : null}
                  </td>
                  <td className="px-3 py-2">
                    <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${ROLE_CLASS[p.roleGroup] ?? ROLE_CLASS.other}`} title={p.role}>
                      {p.roleGroup}
                    </span>
                    {p.pod && <span className="ml-1 text-[10px] text-gray-400">{p.pod}</span>}
                  </td>
                  <td className="px-3 py-2 text-gray-500 dark:text-gray-400">
                    {p.shift || "—"}
                    {p.shiftClock && <span className="block text-[10px] text-gray-400">{p.shiftClock}</span>}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    <span className="font-semibold text-gray-900 dark:text-white">{p.doneToday}</span>
                    <span className="text-gray-400">/{p.quota ?? "—"}</span>
                    {p.doneYahoo > 0 && (
                      <span className="block text-[10px] text-gray-400" title="Of today's count, pieces on the Yahoo sheet">
                        {p.doneYahoo} via Yahoo
                      </span>
                    )}
                    {isEditor && p.verifiedToday > 0 && (
                      <span className="block text-[10px] text-gray-400">{p.verifiedToday} verified</span>
                    )}
                    {p.undatedPieces > 0 && (
                      <span className="block text-[10px] text-amber-600 dark:text-amber-400">{p.undatedPieces} undated</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums text-gray-700 dark:text-gray-300">
                    {isEditor ? p.queue : p.inFlight}
                    <span className="block text-[10px] text-gray-400">
                      {isEditor ? "to review" : "in flight"}
                      {p.loadYahoo > 0 && ` · ${p.loadYahoo} Yahoo`}
                    </span>
                  </td>
                  <td className="max-w-[200px] px-3 py-2 text-[11px] text-gray-500 dark:text-gray-400">
                    {p.secondaryDivisions.length > 0 && (
                      <span className="block truncate" title="Listed as secondary on the schedule">
                        {p.secondaryDivisions.join(", ")}
                      </span>
                    )}
                    {p.workedDivisions.length > 0 && (
                      <span className="block truncate text-gray-400" title="Inferred from pieces they have done">
                        {p.workedDivisions.slice(0, 3).map((w) => `${w.division} ×${w.pieces}`).join(", ")}
                      </span>
                    )}
                    {p.secondaryDivisions.length === 0 && p.workedDivisions.length === 0 && "—"}
                  </td>
                  <td className="max-w-[200px] px-3 py-2 text-[11px] text-gray-500 dark:text-gray-400">
                    {p.offToday ? (
                      <span className="block truncate text-gray-700 dark:text-gray-300" title={p.offReason}>{p.offReason}</span>
                    ) : (
                      <span className="block truncate">{p.weekoff ? `off ${p.weekoff}` : "—"}</span>
                    )}
                    {(p.coveredBy || p.backup) && (
                      <span className="block truncate text-gray-400">
                        {p.offToday ? "covered by " : p.backup.includes(",") ? "backups " : "backup "}
                        <span className="text-gray-600 dark:text-gray-300">{p.coveredBy || p.backup}</span>
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right text-gray-400">{p.lastActive ? fmtAgo(p.lastActive) : "—"}</td>
                  <td className="px-2 py-2 text-right">
                    <button
                      onClick={() => onFindCover(p)}
                      title={`Find someone to cover ${p.name}`}
                      className="rounded-md p-1 text-gray-300 hover:bg-indigo-50 hover:text-indigo-600 dark:text-gray-600 dark:hover:bg-indigo-500/10 dark:hover:text-indigo-400"
                    >
                      <ArrowRight size={13} />
                    </button>
                  </td>
                </tr>
              );
            })}
            {sorted.length === 0 && (
              <tr><td colSpan={11} className="px-3 py-10 text-center text-gray-400">No one matches these filters</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
