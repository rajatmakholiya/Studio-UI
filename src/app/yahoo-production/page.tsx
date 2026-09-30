"use client";

import { useState, useCallback, useMemo } from "react";
import { triggerYpSync } from "@/lib/api";
import type { CfFilterParams } from "@/features/yahoo-production/types";
import {
  useYpSyncStatus,
  useYpFilters,
  useYpOverview,
  useYpTimeseries,
  useYpFunnel,
  useYpPending,
  useYpWriters,
  useYpEditors,
  useYpAllotters,
  useYpTat,
  useYpDivisions,
  useYpQuotas,
  useYpArticleTypes,
  useYpRoster,
  useYpInsights,
  useCombinedProduction,
} from "@/features/yahoo-production/hooks/useYahooData";

// Yahoo is the same lifecycle as Critical Flow over a different source sheet,
// so it renders with the same components rather than a second set kept in step
// by hand. What differs is passed as props: no send-back columns, and a quota
// tab where Critical Flow has send-backs.
import CfHeader, {
  TAB_SETS,
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
import QuotaTable from "@/features/yahoo-production/components/QuotaTable";
import CombinedProduction from "@/features/yahoo-production/components/CombinedProduction";
import { lastDaysIst } from "@/features/critical-flow/format";
import { useRole } from "@/hooks/useRole";

const RANGE_DAYS: Record<Exclude<RangeKey, "custom">, number | null> = {
  "7d": 7,
  "14d": 14,
  "30d": 30,
  "90d": 90,
  all: null,
};

export default function YahooProductionPage() {
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

  const syncStatus = useYpSyncStatus();
  const filterOptions = useYpFilters();

  // Overview
  const overview = useYpOverview(filters);
  const pending = useYpPending(filters);
  const timeseries = useYpTimeseries(filters, granularity);
  const divisionStats = useYpDivisions(filters);
  const articleTypes = useYpArticleTypes(filters);

  // Pipeline
  const funnel = useYpFunnel(filters);

  // Quotas
  const quotas = useYpQuotas(filters);

  // Turnaround
  const tat = useYpTat(filters);

  // People
  const writers = useYpWriters(filters);
  const editors = useYpEditors(filters);
  const allotters = useYpAllotters(filters);
  const roster = useYpRoster(filters);

  // Insights
  const insights = useYpInsights(filters);

  // Combined: Yahoo + Critical Flow. Reads both pipelines, so only while open.
  const combined = useCombinedProduction(filters, tab === "combined");

  const handleSync = useCallback(async () => {
    setIsSyncing(true);
    try {
      await triggerYpSync();
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
        tabs={TAB_SETS.yahoo}
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
          <KpiHero
            overview={overview.data}
            isLoading={overview.isLoading}
            showSendBacks={false}
          />
          <PendingBoard
            data={pending.data}
            isLoading={pending.isLoading}
            showSendBacks={false}
          />
          <ThroughputChart
            data={timeseries.data}
            isLoading={timeseries.isLoading}
            granularity={granularity}
            onGranularityChange={setGranularity}
          />
          <ArticleTypeCards data={articleTypes.data} isLoading={articleTypes.isLoading} />
          <DivisionTable
            data={divisionStats.data}
            isLoading={divisionStats.isLoading}
            showSendBacks={false}
            csvPrefix="yahoo"
          />
        </>
      )}

      {tab === "pipeline" && (
        <>
          <PendingBoard
            data={pending.data}
            isLoading={pending.isLoading}
            showSendBacks={false}
          />
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <FunnelChart data={funnel.data} isLoading={funnel.isLoading} />
            <AgeBandChart data={pending.data} isLoading={pending.isLoading} />
          </div>
          <PendingTable items={pending.data?.items} isLoading={pending.isLoading} csvPrefix="yahoo" />
        </>
      )}

      {tab === "quality" && (
        <>
          <QuotaTable data={quotas.data} isLoading={quotas.isLoading} />
          <DivisionTable
            data={divisionStats.data}
            isLoading={divisionStats.isLoading}
            showSendBacks={false}
            csvPrefix="yahoo"
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
          <SlowestTable data={tat.data} isLoading={tat.isLoading} csvPrefix="yahoo" />
        </>
      )}

      {tab === "people" && (
        <>
          <WritersTable
            data={writers.data}
            isLoading={writers.isLoading}
            showSendBacks={false}
            csvPrefix="yahoo"
          />
          <EditorsTable
            data={editors.data}
            isLoading={editors.isLoading}
            showSendBacks={false}
            csvPrefix="yahoo"
          />
          <AllottersTable data={allotters.data} isLoading={allotters.isLoading} csvPrefix="yahoo" />
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
            csvPrefix="yahoo"
          />
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <DuplicatesTable data={insights.data} isLoading={insights.isLoading} csvPrefix="yahoo" />
            <DataQualityCard data={insights.data} isLoading={insights.isLoading} />
          </div>
        </>
      )}

      {tab === "combined" && (
        <CombinedProduction data={combined.data} isLoading={combined.isLoading} />
      )}
    </div>
  );
}
