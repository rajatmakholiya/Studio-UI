"use client";

import type { StableOverview } from "../types";
import { fmtInt, fmtPct } from "@/features/critical-flow/format";
import { LoadingBlock, SegmentBar, StageLegend, stageBarSegments } from "./Bits";

function pctOf(part: number, whole: number) {
  return whole > 0 ? (part / whole) * 100 : null;
}

function Tile({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: string;
}) {
  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3 dark:border-gray-800 dark:bg-gray-800/40">
      <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400">{label}</p>
      <p className="mt-1 text-xl font-semibold tabular-nums text-gray-900 dark:text-white" style={accent ? { color: accent } : undefined}>
        {value}
      </p>
      {sub && <p className="mt-0.5 text-[11px] text-gray-400 dark:text-gray-500">{sub}</p>}
    </div>
  );
}

export default function StableKpis({
  data,
  isLoading,
}: {
  data?: StableOverview;
  isLoading: boolean;
}) {
  if (isLoading || !data) return <LoadingBlock height="h-48" />;
  const d = data;
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <Tile
          label="Allotted"
          value={fmtInt(d.allotted)}
          sub={`${fmtInt(d.newCount)} new · ${fmtInt(d.updateCount)} updates`}
        />
        <Tile
          label="Submitted"
          value={fmtInt(d.submitted)}
          sub={`${fmtPct(pctOf(d.submitted, d.allotted))} of allotted`}
        />
        <Tile
          label="Verified"
          value={fmtInt(d.verified)}
          sub={`${fmtPct(d.completionRate)} complete`}
          accent="#8b5cf6"
        />
        <Tile
          label="Scheduled / live"
          value={fmtInt(d.published)}
          sub={`${fmtInt(d.verifiedUnpublished)} verified, not scheduled`}
          accent="#10b981"
        />
        <Tile
          label="Open work"
          value={fmtInt(d.open)}
          sub={`${fmtInt(d.awaitingSubmission)} to write · ${fmtInt(d.awaitingEditorial + d.inEditorial)} to edit`}
          accent={d.open > 0 ? "#f59e0b" : undefined}
        />
        <Tile
          label="Events"
          value={fmtInt(d.events)}
          sub={`${d.writers} writers · ${d.editors} editors`}
        />
      </div>

      <div className="mt-4">
        <div className="mb-1.5 flex items-center justify-between">
          <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400">Where every piece stands</p>
          {d.sentBack + d.onHold > 0 && (
            <p className="text-[11px] text-gray-400">
              {fmtInt(d.sentBack)} sent back · {fmtInt(d.onHold)} on hold
            </p>
          )}
        </div>
        <SegmentBar segments={stageBarSegments(d.stages)} height={12} />
        <div className="mt-2">
          <StageLegend stages={d.stages} />
        </div>
      </div>
    </div>
  );
}
