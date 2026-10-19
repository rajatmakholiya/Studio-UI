import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { fetchCfWeeklyReport } from "@/lib/api";
import type { WeeklyReport } from "../types";

/** `end` is any day in the last week shown; omitted, the latest complete week. */
export function useWeeklyReport(end: string | undefined, weeks: number) {
  return useQuery<WeeklyReport>({
    queryKey: ["cf-weekly-report", end ?? "latest", weeks],
    queryFn: () => fetchCfWeeklyReport(end, weeks),
    // Switching weeks keeps the current sheet up until the next one arrives.
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 5,
  });
}
