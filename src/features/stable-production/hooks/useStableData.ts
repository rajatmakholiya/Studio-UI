import { useQuery } from "@tanstack/react-query";
import {
  fetchSpSyncStatus,
  fetchSpFilters,
  fetchSpOverview,
  fetchSpEvents,
  fetchSpWriters,
  fetchSpEditors,
  fetchSpStableTypes,
  fetchSpQueue,
  fetchSpRoster,
  fetchSpQuality,
} from "@/lib/api";
import type {
  StableFilterParams,
  StableSyncStatus,
  StableFilterOptions,
  StableOverview,
  StableEventStats,
  StableWriterStats,
  StableEditorStats,
  StableTypeMatrix,
  StableQueue,
  StableRosterEntry,
  StableQuality,
} from "../types";

/** Only non-empty filters reach the query string. */
function toParams(f: StableFilterParams) {
  const p: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(f)) {
    if (Array.isArray(v) && v.length) p[k] = v;
  }
  return p;
}

const STALE = 1000 * 60 * 5;

export function useSpSyncStatus() {
  return useQuery<StableSyncStatus>({
    queryKey: ["sp-sync-status"],
    queryFn: fetchSpSyncStatus,
    refetchInterval: 30000,
  });
}

export function useSpFilters() {
  return useQuery<StableFilterOptions>({
    queryKey: ["sp-filters"],
    queryFn: fetchSpFilters,
    staleTime: STALE,
  });
}

export function useSpOverview(filters: StableFilterParams) {
  return useQuery<StableOverview>({
    queryKey: ["sp-overview", filters],
    queryFn: () => fetchSpOverview(toParams(filters)),
    staleTime: STALE,
  });
}

export function useSpEvents(filters: StableFilterParams) {
  return useQuery<StableEventStats[]>({
    queryKey: ["sp-events", filters],
    queryFn: () => fetchSpEvents(toParams(filters)),
    staleTime: STALE,
  });
}

export function useSpWriters(filters: StableFilterParams, enabled = true) {
  return useQuery<StableWriterStats[]>({
    queryKey: ["sp-writers", filters],
    queryFn: () => fetchSpWriters(toParams(filters)),
    staleTime: STALE,
    enabled,
  });
}

export function useSpEditors(filters: StableFilterParams, enabled = true) {
  return useQuery<StableEditorStats[]>({
    queryKey: ["sp-editors", filters],
    queryFn: () => fetchSpEditors(toParams(filters)),
    staleTime: STALE,
    enabled,
  });
}

export function useSpStableTypes(filters: StableFilterParams, enabled = true) {
  return useQuery<StableTypeMatrix>({
    queryKey: ["sp-stable-types", filters],
    queryFn: () => fetchSpStableTypes(toParams(filters)),
    staleTime: STALE,
    enabled,
  });
}

/** The work queue is the action view, so it refreshes on a timer. */
export function useSpQueue(filters: StableFilterParams, enabled = true) {
  return useQuery<StableQueue>({
    queryKey: ["sp-queue", filters],
    queryFn: () => fetchSpQueue(toParams(filters)),
    refetchInterval: 60000,
    enabled,
  });
}

export function useSpRoster(filters: StableFilterParams, enabled = true) {
  return useQuery<StableRosterEntry[]>({
    queryKey: ["sp-roster", filters],
    queryFn: () => fetchSpRoster(toParams(filters)),
    staleTime: STALE,
    enabled,
  });
}

export function useSpQuality(filters: StableFilterParams, enabled = true) {
  return useQuery<StableQuality>({
    queryKey: ["sp-quality", filters],
    queryFn: () => fetchSpQuality(toParams(filters)),
    staleTime: STALE,
    enabled,
  });
}
