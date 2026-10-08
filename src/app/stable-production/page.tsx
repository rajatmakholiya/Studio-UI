"use client";

import { useCallback, useMemo, useState } from "react";
import { Info } from "lucide-react";
import { triggerSpSync } from "@/lib/api";
import { useRole } from "@/hooks/useRole";
import type { StableFilterParams } from "@/features/stable-production/types";
import {
  useSpSyncStatus,
  useSpFilters,
  useSpOverview,
  useSpEvents,
  useSpWriters,
  useSpEditors,
  useSpStableTypes,
  useSpQueue,
  useSpRoster,
  useSpQuality,
} from "@/features/stable-production/hooks/useStableData";
import { eventColorMap } from "@/features/stable-production/palette";
import StableHeader, { type StableTab } from "@/features/stable-production/components/StableHeader";
import StableKpis from "@/features/stable-production/components/StableKpis";
import EventCards from "@/features/stable-production/components/EventCards";
import EventTable from "@/features/stable-production/components/EventTable";
import EventWriterMatrix from "@/features/stable-production/components/EventWriterMatrix";
import TypeMatrix from "@/features/stable-production/components/TypeMatrix";
import {
  StableWritersTable,
  StableEditorsTable,
  DeskRoster,
} from "@/features/stable-production/components/PeopleTables";
import QueueTable from "@/features/stable-production/components/QueueTable";
import QualityPanel from "@/features/stable-production/components/QualityPanel";
import CfSkeleton from "@/features/critical-flow/components/CfSkeleton";

// Stables are tracked by event, not by date: the sheet is one tab per event
// and keeps no reliable timestamps, so there is no date range here — the event
// picker is the page's main filter.
export default function StableProductionPage() {
  const { canAccess } = useRole();
  const [tab, setTab] = useState<StableTab>("overview");
  const [events, setEvents] = useState<string[]>([]);
  const [types, setTypes] = useState<string[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  const filters: StableFilterParams = useMemo(() => ({ events, stableTypes: types }), [events, types]);

  const syncStatus = useSpSyncStatus();
  const filterOptions = useSpFilters();
  const overview = useSpOverview(filters);
  const eventStats = useSpEvents(filters);
  // The cards are the event selector, so they always list every event; only the
  // type filter narrows them.
  const cardFilters: StableFilterParams = useMemo(() => ({ stableTypes: types }), [types]);
  const cardStats = useSpEvents(cardFilters);
  const typeMatrix = useSpStableTypes(filters, tab === "overview" || tab === "events");
  const writers = useSpWriters(filters, tab === "people");
  const editors = useSpEditors(filters, tab === "people");
  const roster = useSpRoster(filters, tab === "people");
  const queue = useSpQueue(filters, tab === "queue");
  const quality = useSpQuality(filters, tab === "quality");

  // Colours come from the full event list, not the filtered one, so an event
  // keeps its colour while other events are filtered in and out.
  const colors = useMemo(
    () => eventColorMap((filterOptions.data?.events ?? []).map((e) => e.event)),
    [filterOptions.data],
  );

  const toggleEvent = useCallback((e: string) => {
    setEvents((prev) => (prev.includes(e) ? prev.filter((x) => x !== e) : [...prev, e]));
  }, []);

  const focusEvent = useCallback((e: string) => {
    setEvents([e]);
    setTab("overview");
  }, []);

  const handleSync = useCallback(async () => {
    setIsSyncing(true);
    try {
      await triggerSpSync();
      await Promise.all([syncStatus.refetch(), filterOptions.refetch(), overview.refetch(), eventStats.refetch()]);
    } finally {
      setIsSyncing(false);
    }
  }, [syncStatus, filterOptions, overview, eventStats]);

  if (filterOptions.isLoading && !filterOptions.data) return <CfSkeleton />;

  const noData = !filterOptions.data?.events.length;

  return (
    <div className="min-h-screen space-y-4 px-4 pb-6 pt-4 lg:px-6">
      <StableHeader
        tab={tab}
        onTab={setTab}
        events={filterOptions.data?.events ?? []}
        colors={colors}
        selectedEvents={events}
        onEvents={setEvents}
        stableTypes={filterOptions.data?.stableTypes ?? []}
        selectedTypes={types}
        onTypes={setTypes}
        syncStatus={syncStatus.data}
        onSync={handleSync}
        isSyncing={isSyncing}
        showSync={canAccess("admin")}
      />

      {noData ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center dark:border-gray-700 dark:bg-gray-900">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-200">No Stable data yet</p>
          <p className="mt-1 text-xs text-gray-400">
            The API reads the Stable sheet every 10 minutes once STABLE_SHEET_ID is set and the sheet is shared with
            the service account.
          </p>
        </div>
      ) : (
        <>
          {tab === "overview" && (
            <>
              <StableKpis data={overview.data} isLoading={overview.isLoading} />
              <EventCards
                data={cardStats.data}
                isLoading={cardStats.isLoading}
                colors={colors}
                selected={events}
                onToggle={toggleEvent}
              />
              <TypeMatrix data={typeMatrix.data} isLoading={typeMatrix.isLoading} colors={colors} />
            </>
          )}

          {tab === "events" && (
            <>
              <EventTable
                data={eventStats.data}
                isLoading={eventStats.isLoading}
                colors={colors}
                onSelect={focusEvent}
              />
              <EventWriterMatrix data={eventStats.data} isLoading={eventStats.isLoading} colors={colors} />
              <TypeMatrix data={typeMatrix.data} isLoading={typeMatrix.isLoading} colors={colors} />
            </>
          )}

          {tab === "people" && (
            <>
              <StableWritersTable data={writers.data} isLoading={writers.isLoading} colors={colors} />
              <StableEditorsTable data={editors.data} isLoading={editors.isLoading} colors={colors} />
              <DeskRoster data={roster.data} isLoading={roster.isLoading} />
            </>
          )}

          {tab === "queue" && <QueueTable data={queue.data} isLoading={queue.isLoading} colors={colors} />}

          {tab === "quality" && <QualityPanel data={quality.data} isLoading={quality.isLoading} colors={colors} />}

          <p className="flex items-start gap-1.5 px-1 text-[11px] text-gray-400 dark:text-gray-500">
            <Info size={12} className="mt-0.5 shrink-0" />
            A live snapshot of the Stable sheet, one event per tab. Submitted = a staging link or submission doc is in;
            Scheduled / live = a Published URL, a scheduling time, or &quot;schd&quot; / &quot;Scheduled&quot; noted on
            the row. New event tabs appear on the next sync.
          </p>
        </>
      )}
    </div>
  );
}
