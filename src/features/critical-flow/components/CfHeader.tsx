"use client";

import { useState, useRef, useEffect } from "react";
import {
  LayoutDashboard,
  GitBranch,
  ShieldAlert,
  Timer,
  Users,
  Sparkles,
  RefreshCw,
  ChevronDown,
  Calendar,
  Check,
  Target,
  Layers,
} from "lucide-react";
import type { SyncStatus } from "../types";

export type CfTab =
  | "overview"
  | "pipeline"
  | "quality"
  | "speed"
  | "people"
  | "insights"
  | "combined";
export type RangeKey = "7d" | "14d" | "30d" | "90d" | "all" | "custom";

const TABS = [
  { key: "overview" as CfTab, label: "Overview", icon: LayoutDashboard },
  { key: "pipeline" as CfTab, label: "Pipeline", icon: GitBranch },
  { key: "quality" as CfTab, label: "Send-Backs", icon: ShieldAlert },
  { key: "speed" as CfTab, label: "Turnaround", icon: Timer },
  { key: "people" as CfTab, label: "People", icon: Users },
  { key: "insights" as CfTab, label: "Insights", icon: Sparkles },
];

/**
 * Yahoo runs a single editorial pass with no send-back loop, so that tab would
 * be a page of zeroes; a quota tab takes its place, since Yahoo is the pipeline
 * with per-division daily targets recorded.
 */
const YAHOO_TABS = [
  { key: "overview" as CfTab, label: "Overview", icon: LayoutDashboard },
  { key: "pipeline" as CfTab, label: "Pipeline", icon: GitBranch },
  { key: "quality" as CfTab, label: "Quotas", icon: Target },
  { key: "speed" as CfTab, label: "Turnaround", icon: Timer },
  { key: "people" as CfTab, label: "People", icon: Users },
  { key: "insights" as CfTab, label: "Insights", icon: Sparkles },
  { key: "combined" as CfTab, label: "Combined", icon: Layers },
];

export const TAB_SETS = { critical: TABS, yahoo: YAHOO_TABS };

const RANGE_PRESETS: { key: RangeKey; label: string }[] = [
  { key: "7d", label: "7D" },
  { key: "14d", label: "14D" },
  { key: "30d", label: "30D" },
  { key: "90d", label: "90D" },
  { key: "all", label: "All" },
];

interface Props {
  tab: CfTab;
  onTab: (t: CfTab) => void;
  range: RangeKey;
  onRange: (r: RangeKey) => void;
  customStart?: string;
  customEnd?: string;
  onCustomRange: (start: string, end: string) => void;
  divisions: string[];
  selectedDivisions: string[];
  onToggleDivision: (d: string) => void;
  onClearDivisions: () => void;
  syncStatus?: SyncStatus;
  onSync: () => void;
  isSyncing: boolean;
  showSync: boolean;
  /** Which tab set to render; defaults to Critical Flow's. */
  tabs?: typeof TABS;
}

function lastSyncLabel(iso: string | null | undefined): string {
  if (!iso) return "never synced";
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "synced just now";
  if (mins < 60) return `synced ${mins}m ago`;
  return `synced ${Math.round(mins / 60)}h ago`;
}

// ─── Division multi-select ───────────────────────────────────────────────────

function DivisionDropdown({
  divisions,
  selected,
  onToggle,
  onClear,
}: {
  divisions: string[];
  selected: string[];
  onToggle: (d: string) => void;
  onClear: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const count = selected.length;
  const label =
    count === 0 ? "All Divisions" : `${count} Division${count > 1 ? "s" : ""}`;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
          count > 0
            ? "border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-400"
            : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:text-white"
        }`}
      >
        {label}
        <ChevronDown
          size={12}
          className={`transition-transform duration-150 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-30 mt-1 min-w-[220px] rounded-xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-900">
          {divisions.length === 0 ? (
            <p className="px-3 py-4 text-center text-xs text-gray-400">
              No divisions loaded
            </p>
          ) : (
            <>
              <div className="max-h-64 overflow-y-auto p-1">
                {divisions.map((d) => {
                  const active = selected.includes(d);
                  return (
                    <button
                      key={d}
                      onClick={() => onToggle(d)}
                      className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-800"
                    >
                      <span className="truncate">{d}</span>
                      {active && <Check size={13} className="text-indigo-500" />}
                    </button>
                  );
                })}
              </div>
              {count > 0 && (
                <div className="border-t border-gray-100 p-1 dark:border-gray-800">
                  <button
                    onClick={onClear}
                    className="w-full rounded-lg px-2.5 py-1.5 text-left text-xs font-medium text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800"
                  >
                    Clear selection
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Custom date range ───────────────────────────────────────────────────────

function CustomRange({
  active,
  start,
  end,
  onApply,
}: {
  active: boolean;
  start?: string;
  end?: string;
  onApply: (s: string, e: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [s, setS] = useState(start ?? "");
  const [e, setE] = useState(end ?? "");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (ev: MouseEvent) => {
      if (ref.current && !ref.current.contains(ev.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${
          active
            ? "border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-400"
            : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
        }`}
      >
        <Calendar size={12} />
        {active && start && end ? `${start} → ${end}` : "Custom"}
      </button>
      {open && (
        <div className="absolute right-0 top-full z-30 mt-1 w-64 rounded-xl border border-gray-200 bg-white p-3 shadow-xl dark:border-gray-700 dark:bg-gray-900">
          <label className="block text-[11px] font-medium text-gray-500 dark:text-gray-400">
            From
            <input
              type="date"
              value={s}
              onChange={(ev) => setS(ev.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </label>
          <label className="mt-2 block text-[11px] font-medium text-gray-500 dark:text-gray-400">
            To
            <input
              type="date"
              value={e}
              onChange={(ev) => setE(ev.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </label>
          <button
            disabled={!s || !e}
            onClick={() => {
              onApply(s, e);
              setOpen(false);
            }}
            className="mt-3 w-full rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-40"
          >
            Apply
          </button>
        </div>
      )}
    </div>
  );
}

export default function CfHeader({
  tab,
  onTab,
  range,
  onRange,
  customStart,
  customEnd,
  onCustomRange,
  divisions,
  selectedDivisions,
  onToggleDivision,
  onClearDivisions,
  syncStatus,
  onSync,
  isSyncing,
  showSync,
  tabs,
}: Props) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Tabs */}
        <div className="flex flex-wrap gap-1">
          {(tabs ?? TABS).map(({ key, label, icon: Icon }) => {
            const active = tab === key;
            return (
              <button
                key={key}
                onClick={() => onTab(key)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                  active
                    ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400"
                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
                }`}
              >
                <Icon size={14} />
                {label}
              </button>
            );
          })}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <DivisionDropdown
            divisions={divisions}
            selected={selectedDivisions}
            onToggle={onToggleDivision}
            onClear={onClearDivisions}
          />


          <div className="flex items-center gap-0.5 rounded-lg border border-gray-200 p-0.5 dark:border-gray-700">
            {RANGE_PRESETS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => onRange(key)}
                className={`rounded-md px-2 py-1 text-[11px] font-medium transition-colors ${
                  range === key
                    ? "bg-indigo-600 text-white"
                    : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <CustomRange
            active={range === "custom"}
            start={customStart}
            end={customEnd}
            onApply={onCustomRange}
          />

          {showSync && (
            <button
              onClick={onSync}
              disabled={isSyncing || syncStatus?.syncing}
              title={lastSyncLabel(syncStatus?.lastSyncTime)}
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:border-gray-300 hover:text-gray-900 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:text-white"
            >
              <RefreshCw
                size={12}
                className={isSyncing || syncStatus?.syncing ? "animate-spin" : ""}
              />
              Sync
            </button>
          )}
        </div>
      </div>

      {syncStatus?.error && (
        <p className="mt-2 rounded-lg bg-rose-50 px-3 py-1.5 text-[11px] text-rose-700 dark:bg-rose-500/10 dark:text-rose-400">
          Last sync failed: {syncStatus.error}
        </p>
      )}
    </div>
  );
}
