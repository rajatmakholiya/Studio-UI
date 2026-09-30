import { useQuery } from "@tanstack/react-query";
import {
  fetchYpSyncStatus,
  fetchYpFilters,
  fetchYpOverview,
  fetchYpTimeseries,
  fetchYpFunnel,
  fetchYpPending,
  fetchYpWriters,
  fetchYpEditors,
  fetchYpAllotters,
  fetchYpTat,
  fetchYpDivisions,
  fetchYpQuotas,
  fetchYpArticleTypes,
  fetchYpRoster,
  fetchYpInsights,
  fetchCombinedProduction,
} from "@/lib/api";
import type {
  CfFilterParams,
  SyncStatus,
  FilterOptions,
  KpiOverview,
  TimeseriesBucket,
  FunnelStage,
  PendingResult,
  WriterStats,
  EditorStats,
  AllotterStats,
  TatResult,
  DivisionStats,
  ArticleTypeEntry,
  RosterResult,
  InsightsResult,
  YpQuotaAttainment,
  CombinedProductionResult,
} from "../types";

/** Only the fields the API actually filters on reach the query string. */
function toParams(f: CfFilterParams, extra?: Record<string, string>) {
  const p: Record<string, unknown> = {};
  if (f.startDate) p.startDate = f.startDate;
  if (f.endDate) p.endDate = f.endDate;
  if (f.divisions?.length) p.divisions = f.divisions;
  if (f.writers?.length) p.writers = f.writers;
  if (f.editors?.length) p.editors = f.editors;
  if (f.articleTypes?.length) p.articleTypes = f.articleTypes;
  if (f.statuses?.length) p.statuses = f.statuses;
  if (f.allotters?.length) p.allotters = f.allotters;
  return { ...p, ...extra };
}

const STALE = 1000 * 60 * 5;

export function useYpSyncStatus() {
  return useQuery<SyncStatus>({
    queryKey: ["yp-sync-status"],
    queryFn: fetchYpSyncStatus,
    refetchInterval: 30000,
  });
}

export function useYpFilters() {
  return useQuery<FilterOptions>({
    queryKey: ["yp-filters"],
    queryFn: fetchYpFilters,
    staleTime: STALE,
  });
}

export function useYpOverview(filters: CfFilterParams) {
  return useQuery<KpiOverview>({
    queryKey: ["yp-overview", filters],
    queryFn: () => fetchYpOverview(toParams(filters)),
    staleTime: STALE,
  });
}

export function useYpTimeseries(filters: CfFilterParams, granularity: string) {
  return useQuery<TimeseriesBucket[]>({
    queryKey: ["yp-timeseries", filters, granularity],
    queryFn: () => fetchYpTimeseries(toParams(filters, { granularity })),
    staleTime: STALE,
  });
}

export function useYpFunnel(filters: CfFilterParams) {
  return useQuery<FunnelStage[]>({
    queryKey: ["yp-funnel", filters],
    queryFn: () => fetchYpFunnel(toParams(filters)),
    staleTime: STALE,
  });
}

/** The live queue board — refreshed on a timer, since it is the action view. */
export function useYpPending(filters: CfFilterParams) {
  return useQuery<PendingResult>({
    queryKey: ["yp-pending", filters],
    queryFn: () => fetchYpPending(toParams(filters)),
    refetchInterval: 60000,
  });
}

export function useYpWriters(filters: CfFilterParams) {
  return useQuery<WriterStats[]>({
    queryKey: ["yp-writers", filters],
    queryFn: () => fetchYpWriters(toParams(filters)),
    staleTime: STALE,
  });
}

export function useYpEditors(filters: CfFilterParams) {
  return useQuery<EditorStats[]>({
    queryKey: ["yp-editors", filters],
    queryFn: () => fetchYpEditors(toParams(filters)),
    staleTime: STALE,
  });
}

export function useYpAllotters(filters: CfFilterParams) {
  return useQuery<AllotterStats[]>({
    queryKey: ["yp-allotters", filters],
    queryFn: () => fetchYpAllotters(toParams(filters)),
    staleTime: STALE,
  });
}

export function useYpTat(filters: CfFilterParams) {
  return useQuery<TatResult>({
    queryKey: ["yp-tat", filters],
    queryFn: () => fetchYpTat(toParams(filters)),
    staleTime: STALE,
  });
}

export function useYpDivisions(filters: CfFilterParams) {
  return useQuery<DivisionStats[]>({
    queryKey: ["yp-divisions", filters],
    queryFn: () => fetchYpDivisions(toParams(filters)),
    staleTime: STALE,
  });
}

export function useYpQuotas(filters: CfFilterParams) {
  return useQuery<YpQuotaAttainment[]>({
    queryKey: ["yp-quotas", filters],
    queryFn: () => fetchYpQuotas(toParams(filters)),
    staleTime: STALE,
  });
}

export function useYpArticleTypes(filters: CfFilterParams) {
  return useQuery<ArticleTypeEntry[]>({
    queryKey: ["yp-article-types", filters],
    queryFn: () => fetchYpArticleTypes(toParams(filters)),
    staleTime: STALE,
  });
}

export function useYpRoster(filters: CfFilterParams) {
  return useQuery<RosterResult>({
    queryKey: ["yp-roster", filters],
    queryFn: () => fetchYpRoster(toParams(filters)),
    staleTime: STALE,
  });
}

export function useYpInsights(filters: CfFilterParams) {
  return useQuery<InsightsResult>({
    queryKey: ["yp-insights", filters],
    queryFn: () => fetchYpInsights(toParams(filters)),
    staleTime: STALE,
  });
}

/** Only fetched while the Combined tab is open — it reads both pipelines. */
export function useCombinedProduction(filters: CfFilterParams, enabled: boolean) {
  const params: Record<string, unknown> = {};
  if (filters.startDate) params.startDate = filters.startDate;
  if (filters.endDate) params.endDate = filters.endDate;
  if (filters.divisions?.length) params.divisions = filters.divisions;
  return useQuery<CombinedProductionResult>({
    queryKey: ["production-combined", params],
    queryFn: () => fetchCombinedProduction(params),
    staleTime: STALE,
    enabled,
  });
}
