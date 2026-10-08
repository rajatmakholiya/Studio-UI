"use client";

import { useState } from "react";
import { useWeeklyReport } from "@/features/cf-weekly-report/hooks/useWeeklyReport";
import { addDays } from "@/features/cf-weekly-report/format";
import WeeklyReportHeader from "@/features/cf-weekly-report/components/WeeklyReportHeader";
import WeeklySheet from "@/features/cf-weekly-report/components/WeeklySheet";
import CfSkeleton from "@/features/critical-flow/components/CfSkeleton";

// Computed by the API from the production the desk already tracks, laid out as
// the managers' own Week on Week sheet.
export default function CfWeeklyReportPage() {
  const [end, setEnd] = useState<string | undefined>();
  const report = useWeeklyReport(end);
  const data = report.data;

  const shift = (weeks: number) => {
    const last = data?.weeks.at(-1)?.end;
    if (last) setEnd(addDays(last, 7 * weeks));
  };

  if (report.isLoading && !data) return <CfSkeleton />;

  return (
    <div className="min-h-screen space-y-4 px-4 pb-6 pt-4 lg:px-6">
      <WeeklyReportHeader report={data} onShift={shift} />

      {!data ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center dark:border-gray-700 dark:bg-gray-900">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-200">The weekly report could not be loaded</p>
          <p className="mt-1 text-xs text-gray-400">The API could not be reached.</p>
        </div>
      ) : (
        <WeeklySheet report={data} />
      )}
    </div>
  );
}
