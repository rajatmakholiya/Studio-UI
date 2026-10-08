"use client";

import type { ReactNode } from "react";
import { X } from "lucide-react";
import { fmtInt } from "@/features/critical-flow/format";
import { STAGE_STYLE } from "../palette";

export function Panel({
  title,
  subtitle,
  actions,
  children,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">{title}</h2>
          {subtitle && (
            <p className="text-[11px] text-gray-400 dark:text-gray-500">{subtitle}</p>
          )}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </div>
      {children}
    </div>
  );
}

export function LoadingBlock({ height = "h-72" }: { height?: string }) {
  return (
    <div
      className={`${height} animate-pulse rounded-2xl border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-800/50`}
    />
  );
}

export function EventDot({ color, size = 8 }: { color: string; size?: number }) {
  return (
    <span
      className="inline-block shrink-0 rounded-full"
      style={{ width: size, height: size, backgroundColor: color }}
    />
  );
}

export function SportTag({ sport }: { sport: string }) {
  return (
    <span className="shrink-0 rounded-md bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-gray-500 dark:bg-gray-800 dark:text-gray-400">
      {sport}
    </span>
  );
}

/** An event name in its colour; the same pill everywhere an event appears. */
export function EventChip({
  event,
  color,
  onRemove,
  onClick,
}: {
  event: string;
  color: string;
  onRemove?: () => void;
  onClick?: () => void;
}) {
  return (
    <span
      onClick={onClick}
      className={`inline-flex max-w-full items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium ${
        onClick ? "cursor-pointer" : ""
      }`}
      style={{ borderColor: `${color}55`, backgroundColor: `${color}14`, color }}
    >
      <EventDot color={color} size={6} />
      <span className="truncate">{event}</span>
      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          aria-label={`Remove ${event}`}
          className="rounded-full opacity-70 hover:opacity-100"
        >
          <X size={11} />
        </button>
      )}
    </span>
  );
}

export function StagePill({ stage }: { stage: string }) {
  const color = STAGE_STYLE[stage]?.color ?? "#94a3b8";
  return (
    <span
      className="inline-flex items-center gap-1 whitespace-nowrap rounded-md px-1.5 py-0.5 text-[10px] font-medium"
      style={{ backgroundColor: `${color}1f`, color }}
    >
      {stage}
    </span>
  );
}

/** A single horizontal bar split into coloured segments by count. */
export function SegmentBar({
  segments,
  height = 8,
}: {
  segments: { key: string; label: string; count: number; color: string }[];
  height?: number;
}) {
  const total = segments.reduce((s, x) => s + x.count, 0);
  if (!total) {
    return <div className="w-full rounded-full bg-gray-100 dark:bg-gray-800" style={{ height }} />;
  }
  return (
    <div
      className="flex w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800"
      style={{ height }}
    >
      {segments
        .filter((s) => s.count > 0)
        .map((s) => (
          <div
            key={s.key}
            title={`${s.label}: ${fmtInt(s.count)} (${Math.round((s.count / total) * 100)}%)`}
            style={{ width: `${(s.count / total) * 100}%`, backgroundColor: s.color }}
          />
        ))}
    </div>
  );
}

export function stageBarSegments(stages: { stage: string; count: number }[]) {
  return stages.map((s) => ({
    key: s.stage,
    label: s.stage,
    count: s.count,
    color: STAGE_STYLE[s.stage]?.color ?? "#94a3b8",
  }));
}

export function StageLegend({ stages }: { stages: { stage: string; count: number }[] }) {
  return (
    <div className="flex flex-wrap gap-x-3 gap-y-1">
      {stages
        .filter((s) => s.count > 0)
        .map((s) => (
          <span key={s.stage} className="inline-flex items-center gap-1 text-[11px] text-gray-500 dark:text-gray-400">
            <EventDot color={STAGE_STYLE[s.stage]?.color ?? "#94a3b8"} size={7} />
            {s.stage}
            <span className="tabular-nums text-gray-700 dark:text-gray-300">{fmtInt(s.count)}</span>
          </span>
        ))}
    </div>
  );
}

export function LinkOut({ href, label }: { href: string; label: string }) {
  if (!href) return <span className="text-gray-300 dark:text-gray-600">—</span>;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-indigo-600 hover:underline dark:text-indigo-400"
    >
      {label}
    </a>
  );
}
