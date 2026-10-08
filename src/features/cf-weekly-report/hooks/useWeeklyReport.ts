import { useQuery } from "@tanstack/react-query";
import { fetchCfWeeklyReport } from "@/lib/api";
import type { WeeklyReport } from "../types";

/** `end` is the last week shown; omitted, the latest complete week. */
export function useWeeklyReport(end?: string) {
  return useQuery<WeeklyReport>({
    queryKey: ["cf-weekly-report", end ?? "latest"],
    queryFn: () => fetchCfWeeklyReport(end),
    staleTime: 1000 * 60 * 5,
  });
}
