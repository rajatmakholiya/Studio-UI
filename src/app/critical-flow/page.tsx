"use client";

import { useState, useCallback, useMemo } from "react";
import { triggerCfSync } from "@/lib/api";
import type { CfFilterParams } from "@/features/critical-flow/types";
import {
  useCfSyncStatus,
  useCfFilters,
  useCfOverview,
  useCfTimeseries,
  useCfFunnel,
  useCfPending,
  useCfWriters,
  useCfEditors,
  useCfAllotters,
  useCfSendBacks,
  useCfTat,
  useCfDivisions,
  useCfArticleTypes,
  useCfRoster,
  useCfInsights,
} from "@/features/critical-flow/hooks/useCriticalFlowData";

import CfHeader, {
  type CfTab,
  type RangeKey,
} from "@/features/critical-flow/components/CfHeader";
import CfSkeleton from "@/features/critical-flow/components/CfSkeleton";
import KpiHero from "@/features/critical-flow/components/KpiHero";
import PendingBoard from "@/features/critical-flow/components/PendingBoard";
import ThroughputChart from "@/features/critical-flow/components/ThroughputChart";
import DivisionTable from "@/features/critical-flow/components/DivisionTable";
import ArticleTypeCards from "@/features/critical-flow/components/ArticleTypeCards";
import FunnelChart from "@/features/critical-flow/components/FunnelChart";
import AgeBandChart from "@/features/critical-flow/components/AgeBandChart";
import PendingTable from "@/features/critical-flow/components/PendingTable";
import SendBackOverview from "@/features/critical-flow/components/SendBackOverview";
import SendBackByPerson from "@/features/critical-flow/components/SendBackByPerson";
import TatOverview from "@/features/critical-flow/components/TatOverview";
import TatBreakdown from "@/features/critical-flow/components/TatBreakdown";
import SlowestTable from "@/features/critical-flow/components/SlowestTable";
import WritersTable from "@/features/critical-flow/components/WritersTable";
import EditorsTable from "@/features/critical-flow/components/EditorsTable";
import AllottersTable from "@/features/critical-flow/components/AllottersTable";
import RosterBoard from "@/features/critical-flow/components/RosterBoard";
import WeekdayRhythm from "@/features/critical-flow/components/WeekdayRhythm";
import SubmissionHeatmap from "@/features/critical-flow/components/SubmissionHeatmap";
import DuplicatesTable from "@/features/critical-flow/components/DuplicatesTable";
import DataQualityCard from "@/features/critical-flow/components/DataQualityCard";
import { useRole } from "@/hooks/useRole";
import { lastDaysIst } from "@/features/critical-flow/format";

const RANGE_DAYS: Record<Exclude<RangeKey, "custom">, number | null> = {
  "7d": 7,
  "14d": 14,
  "30d": 30,
  "90d": 90,
  all: null,
};

export default function CriticalFlowPage() {
  const { canAccess } = useRole();

  const [tab, setTab] = useState<CfTab>("overview");
  const [range, setRange] = useState<RangeKey>("30d");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [divisions, setDivisions] = useState<string[]>([]);
  const [granularity, setGranularity] = useState("day");
  const [isSyncing, setIsSyncing] = useState(false);

  const filters: CfFilterParams = useMemo(() => {
    const base: CfFilterParams = { divisions };
    if (range === "custom") {
      return customStart && customEnd
        ? { ...base, startDate: customStart, endDate: customEnd }
        : base;
    }
    const days = RANGE_DAYS[range];
    if (days === null) return base;
    return { ...base, ...lastDaysIst(days) };
  }, [range, divisions, customStart, customEnd]);

  const syncStatus = useCfSyncStatus();
  const filterOptions = useCfFilters();

  // Overview
  const overview = useCfOverview(filters);
  const pending = useCfPending(filters);
  const timeseries = useCfTimeseries(filters, granularity);
  const divisionStats = useCfDivisions(filters);
  const articleTypes = useCfArticleTypes(filters);

  // Pipeline
  const funnel = useCfFunnel(filters);

  // Send-backs
  const sendBacks = useCfSendBacks(filters);

  // Turnaround
  const tat = useCfTat(filters);

  // People
  const writers = useCfWriters(filters);
  const editors = useCfEditors(filters);
  const allotters = useCfAllotters(filters);
  const roster = useCfRoster(filters);

  // Insights
  const insights = useCfInsights(filters);

  const handleSync = useCallback(async () => {
    setIsSyncing(true);
    try {
      await triggerCfSync();
      await Promise.all([syncStatus.refetch(), overview.refetch()]);
    } finally {
      setIsSyncing(false);
    }
  }, [syncStatus, overview]);

  const toggleDivision = useCallback((d: string) => {
    setDivisions((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d],
    );
  }, []);

  const applyCustomRange = useCallback((s: string, e: string) => {
    setCustomStart(s);
    setCustomEnd(e);
    setRange("custom");
  }, []);

  // First paint: nothing to frame the page with until the filter list lands.
  if (filterOptions.isLoading && !filterOptions.data) return <CfSkeleton />;

  return (
    <div className="min-h-screen space-y-4 px-4 pb-6 pt-4 lg:px-6">
      <CfHeader
        tab={tab}
        onTab={setTab}
        range={range}
        onRange={setRange}
        customStart={customStart}
        customEnd={customEnd}
        onCustomRange={applyCustomRange}
        divisions={filterOptions.data?.divisions ?? []}
        selectedDivisions={divisions}
        onToggleDivision={toggleDivision}
        onClearDivisions={() => setDivisions([])}
        syncStatus={syncStatus.data}
        onSync={handleSync}
        isSyncing={isSyncing}
        showSync={canAccess("admin")}
      />

      {tab === "overview" && (
        <>
          <KpiHero overview={overview.data} isLoading={overview.isLoading} />
          <PendingBoard data={pending.data} isLoading={pending.isLoading} />
          <ThroughputChart
            data={timeseries.data}
            isLoading={timeseries.isLoading}
            granularity={granularity}
            onGranularityChange={setGranularity}
          />
          <ArticleTypeCards data={articleTypes.data} isLoading={articleTypes.isLoading} />
          <DivisionTable data={divisionStats.data} isLoading={divisionStats.isLoading} />
        </>
      )}

      {tab === "pipeline" && (
        <>
          <PendingBoard data={pending.data} isLoading={pending.isLoading} />
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <FunnelChart data={funnel.data} isLoading={funnel.isLoading} />
            <AgeBandChart data={pending.data} isLoading={pending.isLoading} />
          </div>
          <PendingTable items={pending.data?.items} isLoading={pending.isLoading} />
        </>
      )}

      {tab === "quality" && (
        <>
          <SendBackOverview data={sendBacks.data} isLoading={sendBacks.isLoading} />
          <SendBackByPerson data={sendBacks.data} isLoading={sendBacks.isLoading} />
          <PendingTable
            items={sendBacks.data?.openSendBacks}
            isLoading={sendBacks.isLoading}
            title="Open Send-Backs"
            subtitle="Returned to the writer and not yet re-verified"
          />
        </>
      )}

      {tab === "speed" && (
        <>
          <TatOverview data={tat.data} isLoading={tat.isLoading} />
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <TatBreakdown
              title="By Division"
              subtitle="Slowest first"
              rows={tat.data?.byDivision}
              isLoading={tat.isLoading}
            />
            <TatBreakdown
              title="By Article Type"
              subtitle="Longer formats naturally sit higher"
              rows={tat.data?.byArticleType}
              isLoading={tat.isLoading}
            />
          </div>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <TatBreakdown
              title="By Writer"
              subtitle="Writers with at least 3 measured pieces"
              rows={tat.data?.byWriter}
              isLoading={tat.isLoading}
            />
            <TatBreakdown
              title="By Editor"
              subtitle="Editors with at least 3 measured pieces"
              rows={tat.data?.byEditor}
              isLoading={tat.isLoading}
            />
          </div>
          <SlowestTable data={tat.data} isLoading={tat.isLoading} />
        </>
      )}

      {tab === "people" && (
        <>
          <WritersTable data={writers.data} isLoading={writers.isLoading} />
          <EditorsTable data={editors.data} isLoading={editors.isLoading} />
          <AllottersTable data={allotters.data} isLoading={allotters.isLoading} />
          <RosterBoard data={roster.data} isLoading={roster.isLoading} />
        </>
      )}

      {tab === "insights" && (
        <>
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <WeekdayRhythm data={insights.data} isLoading={insights.isLoading} />
            <SubmissionHeatmap data={insights.data} isLoading={insights.isLoading} />
          </div>
          <PendingTable
            items={insights.data?.stuck}
            isLoading={insights.isLoading}
            title="Stalled Work"
            subtitle="In queue for more than 48 hours"
          />
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <DuplicatesTable data={insights.data} isLoading={insights.isLoading} />
            <DataQualityCard data={insights.data} isLoading={insights.isLoading} />
          </div>
        </>
      )}
    </div>
  );
}
