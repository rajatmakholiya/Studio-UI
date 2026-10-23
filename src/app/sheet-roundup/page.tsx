"use client";

import { useState } from "react";
import { useSheetRoundup } from "@/features/sheet-roundup/hooks/useSheetRoundup";
import { periodRange, type PeriodKey } from "@/features/sheet-roundup/periods";
import RoundupHeader from "@/features/sheet-roundup/components/RoundupHeader";
import SheetRoundupView from "@/features/sheet-roundup/components/SheetRoundupView";
import CfSkeleton from "@/features/critical-flow/components/CfSkeleton";

// Written / edited / published on every production sheet, Yahoo and Non-Yahoo
// apart. Counted by the API on the Combined tab's rules, so the two agree.
export default function SheetRoundupPage() {
  const [period, setPeriod] = useState<PeriodKey>("7d");
  const [range, setRange] = useState(() => periodRange("7d"));
  const roundup = useSheetRoundup(range.startDate, range.endDate);
  const data = roundup.data;

  if (roundup.isLoading && !data) return <CfSkeleton />;

  return (
    <div className="min-h-screen space-y-4 px-4 pb-6 pt-4 lg:px-6">
      <RoundupHeader
        period={period}
        startDate={range.startDate}
        endDate={range.endDate}
        loading={roundup.isFetching}
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
          <p className="text-sm font-medium text-gray-700 dark:text-gray-200">The roundup could not be loaded</p>
          <p className="mt-1 text-xs text-gray-400">The API could not be reached.</p>
        </div>
      ) : (
        <SheetRoundupView data={data} />
      )}
    </div>
  );
}
