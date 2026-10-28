import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { fetchOverview } from "@/lib/api";
import type { Overview } from "../types";

export function useOverview(startDate: string, endDate: string) {
  return useQuery<Overview>({
    queryKey: ["overview", startDate, endDate],
    queryFn: () => fetchOverview({ startDate, endDate }),
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 5,
  });
}
