"use client";

import { useCallback } from "react";
import type { NamedCount, StableEditorStats, StableRosterEntry, StableWriterStats } from "../types";
import { csvNum, fmtInt, fmtPct } from "@/features/critical-flow/format";
import { useTableSort, SortableTh } from "@/components/ui/SortableTable";
import ExportCsvButton from "@/components/ui/ExportCsvButton";
import type { CsvColumn } from "@/lib/csv";
import { FALLBACK_EVENT_COLOR } from "../palette";
import { LoadingBlock, Panel, SegmentBar } from "./Bits";

const num = "px-3 py-2 text-right tabular-nums text-gray-700 dark:text-gray-300";
const eventsCsv = (events: NamedCount[]) => events.map((e) => `${e.name} (${e.count})`).join("; ");

/** A person's pieces split by event, in each event's colour. */
function EventMix({ events, colors }: { events: NamedCount[]; colors: Map<string, string> }) {
  const top = events.slice(0, 3);
  return (
    <div className="w-60 max-w-[240px]">
      <SegmentBar
        height={6}
        segments={events.map((e) => ({
          key: e.name,
          label: e.name,
          count: e.count,
          color: colors.get(e.name) ?? FALLBACK_EVENT_COLOR,
        }))}
      />
      <p className="mt-1 truncate text-[10px] text-gray-400" title={eventsCsv(events)}>
        {top.map((e) => `${e.name} ${e.count}`).join(" · ")}
        {events.length > 3 && ` · +${events.length - 3} more`}
      </p>
    </div>
  );
}

function RosterFlag({ onRoster }: { onRoster: boolean }) {
  if (onRoster) return null;
  return (
    <span
      title="Not on the Daily Schedule tab"
      className="ml-1.5 rounded bg-gray-100 px-1 text-[9px] font-medium uppercase text-gray-500 dark:bg-gray-800 dark:text-gray-400"
    >
      off desk
    </span>
  );
}

// ─── Writers ─────────────────────────────────────────────────────────────────

const WRITER_CSV: CsvColumn<StableWriterStats>[] = [
  { header: "Writer", value: (r) => r.writer },
  { header: "On Desk", value: (r) => (r.onRoster ? "Yes" : "No") },
  { header: "Daily BW", value: (r) => r.dailyTarget },
  { header: "Allotted", value: (r) => r.allotted },
  { header: "Submitted", value: (r) => r.submitted },
  { header: "To Write", value: (r) => r.awaitingSubmission },
  { header: "Sent Back", value: (r) => r.sentBack },
  { header: "Verified", value: (r) => r.verified },
  { header: "Scheduled / Live", value: (r) => r.published },
  { header: "Open", value: (r) => r.open },
  { header: "Complete (%)", value: (r) => csvNum(r.completionRate) },
  { header: "Events", value: (r) => eventsCsv(r.events) },
];

export function StableWritersTable({
  data,
  isLoading,
  colors,
}: {
  data?: StableWriterStats[];
  isLoading: boolean;
  colors: Map<string, string>;
}) {
  const rows = data ?? [];
  const getValue = useCallback(
    (r: StableWriterStats, key: string) =>
      key === "events" ? r.events.length : (r[key as keyof StableWriterStats] as string | number),
    [],
  );
  const { sorted, sortKey, sortDir, handleSort } = useTableSort(rows, getValue);
  if (isLoading) return <LoadingBlock />;
  const th = (label: string, key: string, align: "left" | "right" = "right") => (
    <SortableTh label={label} colKey={key} align={align} sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
  );

  return (
    <Panel
      title="Writers"
      subtitle="Every piece allotted to each writer, and which events it came from"
      actions={<ExportCsvButton rows={sorted} columns={WRITER_CSV} filename="stable-writers" />}
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] text-xs">
          <thead className="text-gray-400 dark:text-gray-500">
            <tr className="border-b border-gray-100 dark:border-gray-800">
              {th("Writer", "writer", "left")}
              {th("Allotted", "allotted")}
              {th("Submitted", "submitted")}
              {th("To Write", "awaitingSubmission")}
              {th("Sent Back", "sentBack")}
              {th("Verified", "verified")}
              {th("Sched.", "published")}
              {th("Open", "open")}
              {th("Complete", "completionRate")}
              {th("Event Mix", "events", "left")}
            </tr>
          </thead>
          <tbody>
            {sorted.map((r) => (
              <tr key={r.writer} className="border-b border-gray-50 last:border-0 dark:border-gray-800/50">
                <td className="px-3 py-2">
                  <span className="whitespace-nowrap font-medium text-gray-900 dark:text-white">{r.writer}</span>
                  <RosterFlag onRoster={r.onRoster} />
                  {(r.shift || r.dailyTarget != null) && (
                    <p className="whitespace-nowrap text-[10px] text-gray-400">
                      {[r.shift, r.dailyTarget != null ? `BW ${r.dailyTarget}/day` : ""].filter(Boolean).join(" · ")}
                    </p>
                  )}
                </td>
                <td className={num}>{fmtInt(r.allotted)}</td>
                <td className={num}>{fmtInt(r.submitted)}</td>
                <td className={num}>{fmtInt(r.awaitingSubmission)}</td>
                <td className={num}>{fmtInt(r.sentBack)}</td>
                <td className={num}>{fmtInt(r.verified)}</td>
                <td className={num}>{fmtInt(r.published)}</td>
                <td className={num}>{fmtInt(r.open)}</td>
                <td className={num}>{fmtPct(r.completionRate)}</td>
                <td className="px-3 py-2">
                  <EventMix events={r.events} colors={colors} />
                </td>
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={10} className="px-3 py-8 text-center text-gray-400">No writers match these filters</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

// ─── Editors ─────────────────────────────────────────────────────────────────

const EDITOR_CSV: CsvColumn<StableEditorStats>[] = [
  { header: "Editor", value: (r) => r.editor },
  { header: "On Desk", value: (r) => (r.onRoster ? "Yes" : "No") },
  { header: "Handled", value: (r) => r.handled },
  { header: "Verified", value: (r) => r.verified },
  { header: "Scheduled / Live", value: (r) => r.published },
  { header: "Editing", value: (r) => r.inEditorial },
  { header: "Sent Back", value: (r) => r.sentBack },
  { header: "On Hold", value: (r) => r.onHold },
  { header: "Trashed", value: (r) => r.trashed },
  { header: "Events", value: (r) => eventsCsv(r.events) },
];

export function StableEditorsTable({
  data,
  isLoading,
  colors,
}: {
  data?: StableEditorStats[];
  isLoading: boolean;
  colors: Map<string, string>;
}) {
  const rows = data ?? [];
  const getValue = useCallback(
    (r: StableEditorStats, key: string) =>
      key === "events" ? r.events.length : (r[key as keyof StableEditorStats] as string | number),
    [],
  );
  const { sorted, sortKey, sortDir, handleSort } = useTableSort(rows, getValue);
  if (isLoading) return <LoadingBlock />;
  const th = (label: string, key: string, align: "left" | "right" = "right") => (
    <SortableTh label={label} colKey={key} align={align} sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
  );

  return (
    <Panel
      title="Editors"
      subtitle="Pieces with each editor's name on them, by where they stand now"
      actions={<ExportCsvButton rows={sorted} columns={EDITOR_CSV} filename="stable-editors" />}
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px] text-xs">
          <thead className="text-gray-400 dark:text-gray-500">
            <tr className="border-b border-gray-100 dark:border-gray-800">
              {th("Editor", "editor", "left")}
              {th("Handled", "handled")}
              {th("Verified", "verified")}
              {th("Sched.", "published")}
              {th("Editing", "inEditorial")}
              {th("Sent Back", "sentBack")}
              {th("On Hold", "onHold")}
              {th("Event Mix", "events", "left")}
            </tr>
          </thead>
          <tbody>
            {sorted.map((r) => (
              <tr key={r.editor} className="border-b border-gray-50 last:border-0 dark:border-gray-800/50">
                <td className="px-3 py-2">
                  <span className="whitespace-nowrap font-medium text-gray-900 dark:text-white">{r.editor}</span>
                  <RosterFlag onRoster={r.onRoster} />
                </td>
                <td className={num}>{fmtInt(r.handled)}</td>
                <td className={num}>{fmtInt(r.verified)}</td>
                <td className={num}>{fmtInt(r.published)}</td>
                <td className={num}>{fmtInt(r.inEditorial)}</td>
                <td className={num}>{fmtInt(r.sentBack)}</td>
                <td className={num}>{fmtInt(r.onHold)}</td>
                <td className="px-3 py-2">
                  <EventMix events={r.events} colors={colors} />
                </td>
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={8} className="px-3 py-8 text-center text-gray-400">No editors match these filters</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

// ─── Desk roster ─────────────────────────────────────────────────────────────

const ROSTER_CSV: CsvColumn<StableRosterEntry>[] = [
  { header: "Name", value: (r) => r.name },
  { header: "Position", value: (r) => r.position },
  { header: "Daily BW", value: (r) => r.bandwidthNote },
  { header: "Timings", value: (r) => r.timings },
  { header: "Shift", value: (r) => r.shift },
  { header: "Week Off", value: (r) => r.weekoff },
  { header: "Open Pieces", value: (r) => r.open },
  { header: "Total Pieces", value: (r) => r.total },
];

export function DeskRoster({ data, isLoading }: { data?: StableRosterEntry[]; isLoading: boolean }) {
  if (isLoading) return <LoadingBlock height="h-56" />;
  const rows = data ?? [];
  return (
    <Panel
      title="Desk"
      subtitle="From the sheet's Daily Schedule tab"
      actions={<ExportCsvButton rows={rows} columns={ROSTER_CSV} filename="stable-desk" />}
    >
      {rows.length === 0 ? (
        <p className="py-6 text-center text-xs text-gray-400">No Daily Schedule found in the sheet</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-xs">
            <thead className="text-gray-400 dark:text-gray-500">
              <tr className="border-b border-gray-100 dark:border-gray-800">
                <th className="px-3 py-2 text-left font-medium">Name</th>
                <th className="px-3 py-2 text-left font-medium">Position</th>
                <th className="px-3 py-2 text-left font-medium">Daily BW</th>
                <th className="px-3 py-2 text-left font-medium">Shift</th>
                <th className="px-3 py-2 text-left font-medium">Week Off</th>
                <th className="px-3 py-2 text-right font-medium">Open</th>
                <th className="px-3 py-2 text-right font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.name} className="border-b border-gray-50 last:border-0 dark:border-gray-800/50">
                  <td className="px-3 py-2 font-medium text-gray-900 dark:text-white">{r.name}</td>
                  <td className="px-3 py-2 text-gray-600 dark:text-gray-300">{r.position}</td>
                  <td className="px-3 py-2 text-gray-600 dark:text-gray-300">{r.bandwidthNote || "—"}</td>
                  <td className="px-3 py-2 text-gray-600 dark:text-gray-300">
                    {r.shift || "—"}
                    {r.timings && <span className="ml-1 text-[10px] text-gray-400">{r.timings}</span>}
                  </td>
                  <td className="px-3 py-2 text-gray-600 dark:text-gray-300">
                    {r.weekoff || "—"}
                    {r.offToday && (
                      <span className="ml-1.5 rounded bg-sky-50 px-1 text-[10px] font-medium text-sky-700 dark:bg-sky-500/10 dark:text-sky-400">
                        off today
                      </span>
                    )}
                  </td>
                  <td className={num}>{r.roleGroup === "other" && !r.total ? "—" : fmtInt(r.open)}</td>
                  <td className={num}>{r.roleGroup === "other" && !r.total ? "—" : fmtInt(r.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );
}
