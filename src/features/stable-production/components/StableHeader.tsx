"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  LayoutDashboard,
  CalendarRange,
  Users,
  ListTodo,
  ShieldAlert,
  RefreshCw,
  ChevronDown,
  Check,
  Search,
} from "lucide-react";
import type { StableEventOption, StableSyncStatus } from "../types";
import { EventChip, EventDot, SportTag } from "./Bits";
import { FALLBACK_EVENT_COLOR } from "../palette";

export type StableTab = "overview" | "events" | "people" | "queue" | "quality";

const TABS: { key: StableTab; label: string; icon: typeof LayoutDashboard }[] = [
  { key: "overview", label: "Overview", icon: LayoutDashboard },
  { key: "events", label: "Events", icon: CalendarRange },
  { key: "people", label: "People", icon: Users },
  { key: "queue", label: "Work Queue", icon: ListTodo },
  { key: "quality", label: "Data Quality", icon: ShieldAlert },
];

function lastSyncLabel(iso: string | null | undefined): string {
  if (!iso) return "never synced";
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "synced just now";
  if (mins < 60) return `synced ${mins}m ago`;
  return `synced ${Math.round(mins / 60)}h ago`;
}

function useClickAway(open: boolean, close: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) close();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, close]);
  return ref;
}

function TriggerButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
        active
          ? "border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-400"
          : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}

// ─── Event picker ────────────────────────────────────────────────────────────

function EventPicker({
  events,
  colors,
  selected,
  onChange,
}: {
  events: StableEventOption[];
  colors: Map<string, string>;
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const ref = useClickAway(open, () => setOpen(false));

  const bySport = useMemo(() => {
    const m = new Map<string, StableEventOption[]>();
    const needle = q.trim().toLowerCase();
    for (const e of events) {
      if (needle && !e.event.toLowerCase().includes(needle) && !e.sport.toLowerCase().includes(needle)) continue;
      if (!m.has(e.sport)) m.set(e.sport, []);
      m.get(e.sport)!.push(e);
    }
    return [...m.entries()].sort((a, b) => a[1][0].order - b[1][0].order);
  }, [events, q]);

  const toggle = (e: string) =>
    onChange(selected.includes(e) ? selected.filter((x) => x !== e) : [...selected, e]);

  const toggleSport = (list: StableEventOption[]) => {
    const names = list.map((e) => e.event);
    const allOn = names.every((n) => selected.includes(n));
    onChange(allOn ? selected.filter((s) => !names.includes(s)) : [...new Set([...selected, ...names])]);
  };

  const count = selected.length;
  const openEvents = events.filter((e) => e.open > 0).map((e) => e.event);

  return (
    <div ref={ref} className="relative">
      <TriggerButton active={count > 0} onClick={() => setOpen((o) => !o)}>
        {count === 0 ? "All Events" : `${count} Event${count > 1 ? "s" : ""}`}
        <ChevronDown size={12} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </TriggerButton>

      {open && (
        <div className="absolute right-0 top-full z-30 mt-1 w-80 rounded-xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-900">
          <div className="border-b border-gray-100 p-2 dark:border-gray-800">
            <div className="flex items-center gap-2 rounded-lg border border-gray-200 px-2 py-1.5 dark:border-gray-700">
              <Search size={12} className="text-gray-400" />
              <input
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search events or sports…"
                className="w-full bg-transparent text-xs text-gray-900 outline-none placeholder:text-gray-400 dark:text-white"
              />
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              <button
                onClick={() => onChange(openEvents)}
                className="rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700 hover:bg-amber-100 dark:bg-amber-500/10 dark:text-amber-400"
              >
                With open work ({openEvents.length})
              </button>
              {count > 0 && (
                <button
                  onClick={() => onChange([])}
                  className="rounded-md px-2 py-0.5 text-[11px] font-medium text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto p-1">
            {bySport.length === 0 && (
              <p className="px-3 py-4 text-center text-xs text-gray-400">No matching events</p>
            )}
            {bySport.map(([sport, list]) => {
              const allOn = list.every((e) => selected.includes(e.event));
              return (
                <div key={sport} className="mb-1">
                  <button
                    onClick={() => toggleSport(list)}
                    className="flex w-full items-center justify-between rounded-md px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                    title={allOn ? `Deselect all ${sport}` : `Select all ${sport}`}
                  >
                    {sport}
                    <span className="normal-case tracking-normal">{allOn ? "deselect" : "select all"}</span>
                  </button>
                  {list.map((e) => {
                    const active = selected.includes(e.event);
                    return (
                      <button
                        key={e.event}
                        onClick={() => toggle(e.event)}
                        className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-800"
                      >
                        <EventDot color={colors.get(e.event) ?? FALLBACK_EVENT_COLOR} size={9} />
                        <span className="min-w-0 flex-1 truncate">{e.event}</span>
                        <span className="tabular-nums text-[10px] text-gray-400">{e.pieces}</span>
                        {e.open > 0 ? (
                          <span className="rounded bg-amber-50 px-1 text-[10px] font-medium text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
                            {e.open} open
                          </span>
                        ) : (
                          <span className="rounded bg-emerald-50 px-1 text-[10px] font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                            done
                          </span>
                        )}
                        <span className="w-3">{active && <Check size={13} className="text-indigo-500" />}</span>
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Simple multi-select ─────────────────────────────────────────────────────

function MultiPicker({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: string[];
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useClickAway(open, () => setOpen(false));
  const count = selected.length;
  return (
    <div ref={ref} className="relative">
      <TriggerButton active={count > 0} onClick={() => setOpen((o) => !o)}>
        {count === 0 ? `All ${label}` : `${count} ${label}`}
        <ChevronDown size={12} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </TriggerButton>
      {open && (
        <div className="absolute right-0 top-full z-30 mt-1 min-w-[200px] rounded-xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-900">
          <div className="max-h-64 overflow-y-auto p-1">
            {options.map((o) => {
              const active = selected.includes(o);
              return (
                <button
                  key={o}
                  onClick={() => onChange(active ? selected.filter((x) => x !== o) : [...selected, o])}
                  className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-800"
                >
                  <span className="truncate">{o}</span>
                  {active && <Check size={13} className="text-indigo-500" />}
                </button>
              );
            })}
          </div>
          {count > 0 && (
            <div className="border-t border-gray-100 p-1 dark:border-gray-800">
              <button
                onClick={() => onChange([])}
                className="w-full rounded-lg px-2.5 py-1.5 text-left text-xs font-medium text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800"
              >
                Clear selection
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Header ──────────────────────────────────────────────────────────────────

interface Props {
  tab: StableTab;
  onTab: (t: StableTab) => void;
  events: StableEventOption[];
  colors: Map<string, string>;
  selectedEvents: string[];
  onEvents: (next: string[]) => void;
  stableTypes: string[];
  selectedTypes: string[];
  onTypes: (next: string[]) => void;
  syncStatus?: StableSyncStatus;
  onSync: () => void;
  isSyncing: boolean;
  showSync: boolean;
}

export default function StableHeader({
  tab,
  onTab,
  events,
  colors,
  selectedEvents,
  onEvents,
  stableTypes,
  selectedTypes,
  onTypes,
  syncStatus,
  onSync,
  isSyncing,
  showSync,
}: Props) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => onTab(key)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                tab === key
                  ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
              }`}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <EventPicker events={events} colors={colors} selected={selectedEvents} onChange={onEvents} />
          <MultiPicker label="Types" options={stableTypes} selected={selectedTypes} onChange={onTypes} />
          <span className="hidden text-[11px] text-gray-400 sm:inline">
            {lastSyncLabel(syncStatus?.lastSyncTime)}
          </span>
          {showSync && (
            <button
              onClick={onSync}
              disabled={isSyncing || syncStatus?.syncing}
              title="Re-read the Stable sheet now"
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:border-gray-300 hover:text-gray-900 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:text-white"
            >
              <RefreshCw size={12} className={isSyncing || syncStatus?.syncing ? "animate-spin" : ""} />
              Sync
            </button>
          )}
        </div>
      </div>

      {(selectedEvents.length > 0 || selectedTypes.length > 0) && (
        <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-gray-100 pt-3 dark:border-gray-800">
          <span className="text-[11px] text-gray-400">Showing</span>
          {selectedEvents.map((e) => {
            const opt = events.find((x) => x.event === e);
            return (
              <span key={e} className="inline-flex items-center gap-1">
                <EventChip
                  event={e}
                  color={colors.get(e) ?? FALLBACK_EVENT_COLOR}
                  onRemove={() => onEvents(selectedEvents.filter((x) => x !== e))}
                />
                {opt && <SportTag sport={opt.sport} />}
              </span>
            );
          })}
          {selectedTypes.map((t) => (
            <span
              key={t}
              className="inline-flex items-center gap-1 rounded-full border border-gray-200 px-2 py-0.5 text-[11px] text-gray-600 dark:border-gray-700 dark:text-gray-300"
            >
              {t}
              <button onClick={() => onTypes(selectedTypes.filter((x) => x !== t))} aria-label={`Remove ${t}`}>
                ×
              </button>
            </span>
          ))}
          <button
            onClick={() => {
              onEvents([]);
              onTypes([]);
            }}
            className="ml-1 text-[11px] font-medium text-indigo-600 hover:underline dark:text-indigo-400"
          >
            Clear all
          </button>
        </div>
      )}

      {syncStatus?.error && (
        <p className="mt-2 rounded-lg bg-rose-50 px-3 py-1.5 text-[11px] text-rose-700 dark:bg-rose-500/10 dark:text-rose-400">
          Last sync failed: {syncStatus.error}
        </p>
      )}
    </div>
  );
}
