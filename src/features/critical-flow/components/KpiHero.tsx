"use client";

import { TrendingUp, TrendingDown } from "lucide-react";
import type { KpiOverview, KpiDelta } from "../types";
import { fmtDec, fmtHours, fmtInt, fmtPct } from "../format";

interface Props {
  /**
   * Whether this pipeline has a send-back loop. Yahoo runs one editorial pass
   * and never sends work back, so the send-back tile would read 0% forever;
   * verified output takes its place.
   */
  showSendBacks?: boolean;

  overview?: KpiOverview;
  isLoading: boolean;
}

/**
 * `invert` marks a metric where going up is bad (turnaround, send-backs).
 * A null pct means there was no comparable preceding window, which renders as
 * nothing rather than a misleading 0%.
 */
function Delta({ delta, invert = false }: { delta?: KpiDelta; invert?: boolean }) {
  if (!delta || delta.pct == null || delta.pct === 0) return null;
  const good = invert ? delta.pct < 0 : delta.pct > 0;
  const Icon = delta.pct > 0 ? TrendingUp : TrendingDown;
  return (
    <span
      className={`flex items-center gap-0.5 text-[11px] font-medium ${
        good
          ? "text-emerald-600 dark:text-emerald-400"
          : "text-rose-600 dark:text-rose-400"
      }`}
    >
      <Icon size={11} />
      {Math.abs(Math.round(delta.pct * 10) / 10)}%
    </span>
  );
}

function Cell({
  label,
  value,
  second,
  sub,
  delta,
  invert,
  deltaHint,
}: {
  label: string;
  value: string;
  /**
   * A companion figure shown at the same size. Median and mean only differ
   * when a few pieces ran very long, and that gap is the thing worth seeing —
   * so where both exist neither is demoted to small print.
   */
  second?: string;
  sub?: string;
  delta?: KpiDelta;
  invert?: boolean;
  deltaHint?: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
      <p className="text-[11px] font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">
        {label}
      </p>
      <div className="mt-1.5 flex items-baseline gap-1.5">
        <span className="text-2xl font-bold tabular-nums text-gray-900 dark:text-white">
          {value}
        </span>
        {second && (
          <>
            <span className="text-lg font-light text-gray-400 dark:text-gray-500">/</span>
            <span className="text-2xl font-semibold tabular-nums text-gray-500 dark:text-gray-400">
              {second}
            </span>
          </>
        )}
        <span className="ml-0.5" title={deltaHint}>
          <Delta delta={delta} invert={invert} />
        </span>
      </div>
      {sub && (
        <p className="mt-0.5 text-[11px] text-gray-400 dark:text-gray-500">{sub}</p>
      )}
    </div>
  );
}

export default function KpiHero({
  overview,
  isLoading,
  showSendBacks = true,
}: Props) {
  if (isLoading || !overview) {
    return (
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-[92px] animate-pulse rounded-2xl border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-800/50"
          />
        ))}
      </div>
    );
  }

  const d = overview.deltas;

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
      <Cell
        label="Allotted"
        value={fmtInt(overview.allotted)}
        delta={d.allotted}
        sub={`${fmtInt(overview.submitted)} submitted`}
      />
      <Cell
        label="Published"
        value={fmtInt(overview.published)}
        delta={d.published}
        sub={`${fmtPct(overview.publishRate)} of allotted`}
      />
      <Cell
        label="Median / Avg TAT"
        value={fmtHours(overview.medianTatHours)}
        second={fmtHours(overview.avgTatHours)}
        delta={d.medianTatHours}
        invert
        deltaHint="Change in the median against the previous period"
        sub={`typical / mean · p90 ${fmtHours(overview.p90TatHours)}`}
      />
      {showSendBacks ? (
        <Cell
          label="Send-Back Rate"
          value={fmtPct(overview.sendBackRate)}
          delta={d.sendBackRate}
          invert
          sub="of pieces reaching editorial"
        />
      ) : (
        <Cell
          label="Verified"
          value={fmtInt(overview.verified)}
          delta={d.verified}
          sub={`${fmtInt(overview.activeEditors)} editors active`}
        />
      )}
      <Cell
        label="In Queue"
        value={fmtInt(overview.pendingCount)}
        delta={d.pendingCount}
        invert
        sub="not yet published"
      />
      <Cell
        label="Per Writer / Day Worked"
        value={fmtDec(overview.perWriterPerDay, 2)}
        delta={d.perWriterPerDay}
        sub={
          overview.writerDaysWorked != null
            ? `${fmtInt(overview.activeWriters)} writers · ${fmtInt(overview.writerDaysWorked)} days worked`
            : `${fmtInt(overview.activeWriters)} writers active`
        }
      />
    </div>
  );
}
