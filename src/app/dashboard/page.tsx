"use client";

import { useState } from "react";
import { useOverview } from "@/features/overview/hooks/useOverview";
import OverviewView from "@/features/overview/components/OverviewView";
import { periodRange, type PeriodKey } from "@/features/sheet-roundup/periods";
import RoundupHeader from "@/features/sheet-roundup/components/RoundupHeader";
import CfSkeleton from "@/features/critical-flow/components/CfSkeleton";

// Production joined to social traffic: who wrote and edited each article, and
// the Facebook / Threads / Reddit landings its page drew.
export default function Dashboard() {
  const [period, setPeriod] = useState<PeriodKey>("7d");
  const [range, setRange] = useState(() => periodRange("7d"));
  const overview = useOverview(range.startDate, range.endDate);
  const data = overview.data;

  if (overview.isLoading && !data) return <CfSkeleton />;

  return (
    <div className="min-h-screen space-y-4 pb-6">
      <RoundupHeader
        period={period}
        startDate={range.startDate}
        endDate={range.endDate}
        loading={overview.isFetching}
        onPreset={(key) => {
          setPeriod(key);
          setRange(periodRange(key));
        }}
        onCustom={(startDate, endDate) => {
          setPeriod("custom");
          setRange(startDate <= endDate ? { startDate, endDate } : { startDate: endDate, endDate: startDate });
        }}
      />

      {!data ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center dark:border-gray-700 dark:bg-gray-900">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-200">The overview could not be loaded</p>
          <p className="mt-1 text-xs text-gray-400">The API could not be reached.</p>
        </div>
      ) : (
        <OverviewView data={data} />
      )}
    </div>
  );
}
