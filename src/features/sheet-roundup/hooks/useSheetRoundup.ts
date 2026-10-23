import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { fetchSheetRoundup } from "@/lib/api";
import type { SheetRoundup } from "../types";

export function useSheetRoundup(startDate: string, endDate: string) {
  return useQuery<SheetRoundup>({
    queryKey: ["sheet-roundup", startDate, endDate],
    queryFn: () => fetchSheetRoundup({ startDate, endDate }),
    // Changing the period keeps the current numbers up until the next arrive.
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 5,
  });
}
