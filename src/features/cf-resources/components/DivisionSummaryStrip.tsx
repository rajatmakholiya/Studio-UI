"use client";

import { AlertTriangle } from "lucide-react";
import type { DivisionResourceSummary, ResourceSummaryResult } from "@/features/critical-flow/types";
import { fmtInt } from "@/features/critical-flow/format";

interface Props {
  data?: ResourceSummaryResult;
  isLoading: boolean;
  selectedDivisions: string[];
  onPick: (division: string) => void;
}

function ShiftBar({ done, quota, label, active }: { done: number; quota: number; label: string; active: boolean }) {
  const pct = quota > 0 ? Math.min((done / quota) * 100, 100) : 0;
  const met = quota > 0 && done >= quota;
  return (
    <div className="flex items-center gap-2">
      <span className={`w-7 shrink-0 text-[10px] font-medium ${active ? "text-indigo-600 dark:text-indigo-400" : "text-gray-400"}`}>
        {label}
      </span>
      <div className="h-1.5 flex-1 overflow-hidden rounded bg-gray-100 dark:bg-gray-800">
        <div
          className={`h-full rounded ${met ? "bg-emerald-500" : active ? "bg-indigo-500" : "bg-gray-300 dark:bg-gray-600"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-12 shrink-0 text-right text-[10px] tabular-nums text-gray-500 dark:text-gray-400">
        {done}/{quota || "—"}
      </span>
    </div>
  );
}

function Card({ d, shift, selected, onPick }: { d: DivisionResourceSummary; shift: string; selected: boolean; onPick: () => void }) {
  const gap = d.gapCurrentShift;
  const noOneFree = d.writersFree === 0 && d.writersAvailable === 0;
  // A division that only runs the other shift has nothing due right now — that
  // is "not started", not "on quota".
  const shiftQuota = shift === "EMP" ? d.quotaEmp : d.quotaLnp;
  const idleShift = !d.quotaMissing && shiftQuota === 0 && d.quotaTotal > 0;
  const tone =
    d.quotaMissing || idleShift ? "border-gray-200 dark:border-gray-800"
    : gap === 0 ? "border-emerald-200 dark:border-emerald-500/30"
    : noOneFree ? "border-rose-300 dark:border-rose-500/40"
    : "border-amber-200 dark:border-amber-500/30";

  return (
    <button
      onClick={onPick}
      className={`flex flex-col rounded-xl border bg-white p-3 text-left transition-shadow hover:shadow-md dark:bg-gray-900 ${tone} ${
        selected ? "ring-2 ring-indigo-400" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold text-gray-900 dark:text-white">{d.division}</p>
          <p className="truncate text-[10px] text-gray-400">
            {d.poc ? `PoC ${d.poc}` : "no PoC"}{d.architecture ? ` · ${d.architecture}` : ""}
          </p>
        </div>
        {d.quotaMissing ? (
          <span className="shrink-0 rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-500 dark:bg-gray-800 dark:text-gray-400">
            no quota
          </span>
        ) : idleShift ? (
          <span
            className="shrink-0 rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-500 dark:bg-gray-800 dark:text-gray-400"
            title={`${d.division} only runs the ${shift === "EMP" ? "LNP" : "EMP"} shift · ${d.gapDay} due today`}
          >
            {shift === "EMP" ? "LNP only" : "EMP only"}
          </span>
        ) : (
          <span
            className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold tabular-nums ${
              gap === 0
                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                : noOneFree
                  ? "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400"
                  : "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400"
            }`}
            title={`${gap} more needed this ${shift} shift · ${d.gapDay} for the day`}
          >
            {gap === 0 ? "on quota" : `${gap} to go`}
          </span>
        )}
      </div>

      <div className="mt-2 space-y-1">
        <ShiftBar label="EMP" done={d.submittedEmp} quota={d.quotaEmp} active={shift === "EMP"} />
        <ShiftBar label="LNP" done={d.submittedLnp} quota={d.quotaLnp} active={shift === "LNP"} />
        {d.subFeeds.map((s) => (
          <p key={s.subFeed} className="pl-9 text-[10px] text-gray-400">
            {s.subFeed}: {s.submitted}/{s.quota}
          </p>
        ))}
        {(d.yahooQuota != null || d.yahooPublished > 0 || d.yahooSubmitted > 0) && (
          <p
            className="flex items-center gap-2 text-[10px] text-gray-500 dark:text-gray-400"
            title={`Yahoo sheet: ${d.yahooSubmitted} submitted, ${d.yahooPublished} published today${d.yahooQuota != null ? ` against Yahoo's quota of ${d.yahooQuota}` : ""}`}
          >
            <span className="w-7 shrink-0 font-medium text-gray-400">YHO</span>
            <span className="tabular-nums">
              {d.yahooPublished}/{d.yahooQuota ?? "—"} published
            </span>
          </p>
        )}
      </div>

      <div className="mt-2 grid grid-cols-3 gap-1 text-center">
        <div>
          <p className="text-sm font-bold tabular-nums text-gray-900 dark:text-white">{fmtInt(d.awaitingEditorial)}</p>
          <p className="text-[9px] uppercase tracking-wide text-gray-400">to edit</p>
          {d.unassignedEditorial > 0 && (
            <p className="text-[9px] text-rose-500">{d.unassignedEditorial} unassigned</p>
          )}
        </div>
        <div>
          <p className="text-sm font-bold tabular-nums text-gray-900 dark:text-white">{fmtInt(d.awaitingSubmission)}</p>
          <p className="text-[9px] uppercase tracking-wide text-gray-400">to write</p>
          {d.openSendBacks > 0 && (
            <p className="text-[9px] text-rose-500">{d.openSendBacks} sent back</p>
          )}
        </div>
        <div>
          <p className="text-sm font-bold tabular-nums text-gray-900 dark:text-white">
            <span className="text-emerald-600 dark:text-emerald-400">{d.writersFree}</span>
            <span className="text-gray-300 dark:text-gray-600">/</span>
            <span className="text-violet-600 dark:text-violet-400">{d.editorsFree}</span>
          </p>
          <p className="text-[9px] uppercase tracking-wide text-gray-400">free w/e</p>
          <p className="text-[9px] text-gray-400">
            {d.writersOff + d.editorsOff > 0 ? `${d.writersOff + d.editorsOff} off` : `${d.writersTotal + d.editorsTotal} people`}
          </p>
        </div>
      </div>

      {(d.quotaConflict != null || d.undatedPieces > 0) && (
        <p className="mt-2 flex items-center gap-1 text-[9px] text-amber-600 dark:text-amber-400">
          <AlertTriangle size={9} />
          {d.quotaConflict != null && `chart says ${d.quotaConflict}`}
          {d.quotaConflict != null && d.undatedPieces > 0 && " · "}
          {d.undatedPieces > 0 && `${d.undatedPieces} undated`}
        </p>
      )}
    </button>
  );
}

export default function DivisionSummaryStrip({ data, isLoading, selectedDivisions, onPick }: Props) {
  if (isLoading || !data) {
    return (
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="h-40 animate-pulse rounded-xl border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-800/50" />
        ))}
      </div>
    );
  }
  const t = data.totals;
  return (
    <div>
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2 px-1">
        <p className="text-[11px] text-gray-500 dark:text-gray-400">
          <span className="font-semibold text-gray-900 dark:text-white">{fmtInt(t.submitted)}</span> submitted
          {t.quota > 0 ? (
            <>
              {" "}of <span className="font-semibold text-gray-900 dark:text-white">{fmtInt(t.quota)}</span> today ·{" "}
              {fmtInt(t.gapDay)} to go
            </>
          ) : (
            " today"
          )}{" "}
          · {fmtInt(t.yahooPublished)} published on Yahoo ·{" "}
          {fmtInt(t.awaitingEditorial)} waiting for an editor
        </p>
        <p className="text-[11px] text-gray-500 dark:text-gray-400">
          <span className="font-semibold text-emerald-600 dark:text-emerald-400">{t.writersFree}</span> writers free ·{" "}
          <span className="font-semibold text-violet-600 dark:text-violet-400">{t.editorsFree}</span> editors free
          {t.onLeave > 0 && <> · {t.onLeave} on leave</>}
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        {data.divisions.map((d) => (
          <Card
            key={d.division}
            d={d}
            shift={data.currentShift}
            selected={selectedDivisions.includes(d.division)}
            onPick={() => onPick(d.division)}
          />
        ))}
      </div>
    </div>
  );
}
