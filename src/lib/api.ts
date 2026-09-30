import axios from "axios";
import { buildMappingIndex, resolveMapping } from "./page-mapping-match";
import { MappingEntry } from "../data/page-mapping";
import {
  AggregatedPageData,
  AggregatedMetric,
  CountryStat,
  HeadlineData,
  HeadlineWindows,
} from "../types";
import { platformKeysForMapping, type TrafficPlatformKey } from "./traffic-platforms";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";
const API_BASE_URL = `/v1/analytics`;
const MAPPINGS_URL = `/page-mappings`;
const REVENUE_URL = `/v1/revenue`;

export const apiClient = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: {
    "x-api-key": process.env.NEXT_PUBLIC_ANALYTICS_API_KEY || "",
  },
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const url = error.config?.url || "";
      // Skip redirect for auth-check calls (useAuth hook) and login/logout
      const isAuthCheck = url.includes("/sync-status") || url.includes("/auth/login") || url.includes("/auth/logout");
      if (!isAuthCheck && typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  },
);

export async function loginUser(email: string, password: string) {
  const response = await apiClient.post("/api/auth/login", { email, password });
  return response.data;
}

export async function logoutUser() {
  const response = await apiClient.post("/api/auth/logout");
  return response.data;
}

// ── Sign-up / password reset by emailed code ──

export type CodePurpose = "signup" | "reset";

export async function requestAccessCode(email: string, purpose: CodePurpose): Promise<{ message: string }> {
  const response = await apiClient.post("/api/auth/code", { email, purpose });
  return response.data;
}

export async function verifyAccessCode(
  email: string,
  code: string,
): Promise<{ setupToken: string; hasAccount: boolean }> {
  const response = await apiClient.post("/api/auth/code/verify", { email, code });
  return response.data;
}

export async function setAccountPassword(
  email: string,
  setupToken: string,
  password: string,
): Promise<{ email: string; role: string; created: boolean }> {
  const response = await apiClient.post("/api/auth/password", { email, setupToken, password });
  return response.data;
}

// ── Access management (superadmin) ──

export interface AppUser {
  id: string;
  email: string;
  role: "superadmin" | "admin" | "management" | "user";
  createdAt: string;
  lastLoginAt: string | null;
  passwordUpdatedAt: string | null;
}

export async function fetchUsers(): Promise<AppUser[]> {
  const response = await apiClient.get("/api/users");
  return response.data;
}

export async function updateUserRole(id: string, role: AppUser["role"]): Promise<AppUser> {
  const response = await apiClient.patch(`/api/users/${id}/role`, { role });
  return response.data;
}

export async function fetchPageMappings(): Promise<MappingEntry[]> {
  try {
    const response = await apiClient.get(MAPPINGS_URL);
    return response.data;
  } catch (error) {
    console.error("Mapping Fetch Error:", error);
    return [];
  }
}

export async function importPageMappingsCSV(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  const response = await apiClient.post(`${MAPPINGS_URL}/import`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
}

export async function importLegacyDataCSV(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  const response = await apiClient.post(
    `${API_BASE_URL}/import/legacy`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );
  return response.data;
}

export async function createPageMapping(mapping: MappingEntry) {
  return apiClient.post(MAPPINGS_URL, mapping);
}

export async function deletePageMapping(id: number) {
  return apiClient.delete(`${MAPPINGS_URL}/${id}`);
}

export async function updatePageMapping(id: number, mapping: Partial<MappingEntry>) {
  return apiClient.patch(`${MAPPINGS_URL}/${id}`, mapping);
}

/** Wipe every UTM page mapping. Rejected with 403 for non-admin callers. */
export async function deleteAllPageMappings(): Promise<{ deleted: number }> {
  const response = await apiClient.delete(MAPPINGS_URL);
  return response.data;
}

/** Batch-update the team field for multiple page-mapping IDs in a single
 *  request, avoiding the race condition of N parallel PATCH calls. */
export async function batchUpdatePageMappingTeam(
  ids: number[],
  team: string | null,
): Promise<MappingEntry[]> {
  const response = await apiClient.patch(`${MAPPINGS_URL}/batch/team`, { ids, team });
  return response.data;
}

export async function fetchHeadlines(
  source?: string,
): Promise<HeadlineData | null> {
  try {
    const response = await apiClient.get(`${API_BASE_URL}/headlines`, {
      params: { utmSource: source },
    });
    return response.data;
  } catch (error) {
    console.error("Headlines Error:", error);
    return null;
  }
}

export async function triggerManualSync() {
  try {
    const response = await apiClient.post(`${API_BASE_URL}/sync/manual`);
    return response.data;
  } catch (error) {
    console.error("Sync Error:", error);
    throw error;
  }
}

export async function triggerSocialManualSync() {
  try {
    const response = await apiClient.post(`/api/analytics/sync`);
    return response.data;
  } catch (error) {
    console.error("Social Sync Error:", error);
    throw error;
  }
}

export async function fetchCountryStats(
  startDate: string,
  endDate: string,
  source: string,
): Promise<CountryStat[]> {
  try {
    const response = await apiClient.get(`${API_BASE_URL}/country-stats`, {
      params: { startDate, endDate, utmSource: source },
    });
    return response.data;
  } catch (error) {
    console.error("Country Stats Error:", error);
    return [];
  }
}

// Returns pre-aggregated (date × medium) rows — far fewer than the raw endpoint.
export async function fetchAggregatedData(
  startDate: string,
  endDate: string,
  source: string,
  campaign?: string,
): Promise<AggregatedMetric[]> {
  try {
    const params: Record<string, string> = {
      startDate,
      endDate,
      utmSource: source,
    };
    if (campaign) params.utmCampaign = campaign;

    const response = await apiClient.get(`${API_BASE_URL}/utm/metrics-aggregated`, {
      params,
    });
    return response.data;
  } catch (error) {
    console.error("Aggregated API Error:", error);
    return [];
  }
}

/** Fetches distinct campaign names for a date range — lightweight query. */
export async function fetchAvailableCampaigns(
  startDate: string,
  endDate: string,
  source: string,
): Promise<string[]> {
  try {
    const response = await apiClient.get(`${API_BASE_URL}/campaigns`, {
      params: { startDate, endDate, utmSource: source },
    });
    return (response.data || []).map((r: any) => r.utm_campaign).filter(Boolean);
  } catch (error) {
    console.error("Campaigns API Error:", error);
    return [];
  }
}

/**
 * Fold the raw (day × medium) rows into per-page rows for the traffic table.
 *
 * `platform` scopes the medium → page lookup. The same UTM medium is mapped to
 * different page names on different platforms (e.g. 'golf_fan_page_es' is
 * "ES Golf" on Facebook and "EssentiallyGolf" on Threads), so an unscoped
 * lookup resolved those by whichever mapping row happened to be read last.
 * Scoping also keeps a generic medium like 'referral' — which Reddit uses for
 * its untagged organic traffic — from leaking a Reddit page name onto the
 * Facebook or Threads tab.
 */
export interface TopPageRow {
  page_path: string;
  sessions: number;
  pageviews: number;
  users: number;
  section: string;
  /** Set when a landing-page mapping claimed this path. */
  pageName: string | null;
  team: string | null;
  matchedPattern: string | null;
}

// ---- Landing-page (URL pattern) mappings ----

export interface PagePathMappingRow {
  id: number;
  pattern: string;
  pageName: string;
  category: string;
  team: string | null;
  priority: number;
}

export async function fetchPagePathMappings(): Promise<PagePathMappingRow[]> {
  try {
    const response = await apiClient.get(`${MAPPINGS_URL}/paths`);
    return response.data;
  } catch (error) {
    console.error("Path Mappings Error:", error);
    return [];
  }
}

export async function createPagePathMapping(
  mapping: Partial<PagePathMappingRow>,
): Promise<PagePathMappingRow> {
  const response = await apiClient.post(`${MAPPINGS_URL}/paths`, mapping);
  return response.data;
}

export async function updatePagePathMapping(
  id: number,
  mapping: Partial<PagePathMappingRow>,
): Promise<PagePathMappingRow> {
  const response = await apiClient.patch(`${MAPPINGS_URL}/paths/${id}`, mapping);
  return response.data;
}

export async function deletePagePathMapping(id: number): Promise<void> {
  await apiClient.delete(`${MAPPINGS_URL}/paths/${id}`);
}

export async function batchUpdatePagePathTeam(
  ids: number[],
  team: string | null,
): Promise<PagePathMappingRow[]> {
  const response = await apiClient.patch(`${MAPPINGS_URL}/paths/batch/team`, {
    ids,
    team,
  });
  return response.data;
}

/**
 * Top landing pages for a platform. This is the only readable breakdown for
 * untagged organic traffic, where every session shares utm_medium 'referral'.
 */
export async function fetchTopPages(
  startDate: string,
  endDate: string,
  source: string,
  limit = 100,
): Promise<TopPageRow[]> {
  try {
    const response = await apiClient.get(`${API_BASE_URL}/pages`, {
      params: { startDate, endDate, utmSource: source, limit },
    });
    return response.data;
  } catch (error) {
    console.error("Top Pages Error:", error);
    return [];
  }
}

export function processAggregatedData(
  rawData: AggregatedMetric[],
  platform: TrafficPlatformKey,
  mappingData: MappingEntry[],
): AggregatedPageData[] {
  const pageNameToTeam: Record<string, string | undefined> = {};
  const scoped: MappingEntry[] = [];

  for (let i = 0; i < mappingData.length; i++) {
    const entry = mappingData[i];
    const cleanPageName = (entry.pageName || "").trim();
    if (!cleanPageName) continue;

    if (entry.team?.trim()) {
      pageNameToTeam[cleanPageName.toLowerCase()] = entry.team.trim();
    }

    if (!platformKeysForMapping(entry).includes(platform)) continue;
    scoped.push(entry);
  }

  // Matching on medium alone used to collapse a page's autoposted traffic onto
  // its normal-post row, because the two carry the same utm_medium and differ
  // only by campaign. The shared matcher keys on both.
  const mappingIndex = buildMappingIndex(scoped);

  const grouped: Record<
    string,
    AggregatedPageData & { _dailyMap?: Record<string, any> }
  > = {};

  for (let i = 0; i < rawData.length; i++) {
    const row = rawData[i];
    const mappedInfo = resolveMapping(
      mappingIndex,
      row.utm_medium,
      row.utm_campaign,
    );

    let pageName = mappedInfo ? mappedInfo.pageName : (row.utm_medium || "").trim();
    if (!pageName) pageName = "Unknown";
    
    const category = mappedInfo ? mappedInfo.category : "Other";
    const team = pageNameToTeam[pageName.toLowerCase()] || undefined;

    if (!grouped[pageName]) {
      grouped[pageName] = {
        pageName,
        category,
        team,
        totals: {
          sessions: 0,
          pageviews: 0,
          users: 0,
          new_users: 0,
          recurring_users: 0,
          identified_users: 0,
          event_count: 0,
          engagement_rate_avg: 0,
        },
        dailyTrend: [],
        _dailyMap: {},
      };
    } else if (team && !grouped[pageName].team) {
      grouped[pageName].team = team;
    }

    const pageEntry = grouped[pageName];
    const dailyMap = pageEntry._dailyMap!;

    const sessions = Number(row.sessions) || 0;
    const pageviews = Number(row.pageviews) || 0;
    const users = Number(row.users) || 0;
    const new_users = Number(row.new_users) || 0;
    const recurring_users = Number(row.recurring_users) || 0;
    const identified_users = Number(row.identified_users) || 0;
    const event_count = Number(row.event_count) || 0;
    const parsedEngagement = parseFloat(String(row.engagement_rate)) || 0;

    const totals = pageEntry.totals;
    totals.sessions += sessions;
    totals.pageviews += pageviews;
    totals.users += users;
    totals.new_users += new_users;
    totals.recurring_users += recurring_users;
    totals.identified_users += identified_users;
    totals.event_count += event_count;

    let existingDay = dailyMap[row.event_day];
    if (existingDay) {
      existingDay.sessions += sessions;
      existingDay.pageviews += pageviews;
      existingDay.users += users;
      existingDay.new_users += new_users;
      existingDay.recurring_users += recurring_users;
      existingDay.identified_users += identified_users;
      existingDay.event_count += event_count;
      existingDay.engagement_rate = (existingDay.engagement_rate + parsedEngagement) / 2;
    } else {
      existingDay = {
        date: row.event_day,
        sessions,
        pageviews,
        users,
        new_users,
        recurring_users,
        identified_users,
        event_count,
        engagement_rate: parsedEngagement,
      };
      dailyMap[row.event_day] = existingDay;
      pageEntry.dailyTrend.push(existingDay);
    }
  }

  const results = Object.values(grouped);
  for (let i = 0; i < results.length; i++) {
    const page = results[i];
    let totalEngRates = 0;
    for (let j = 0; j < page.dailyTrend.length; j++) {
      totalEngRates += page.dailyTrend[j].engagement_rate;
    }
    page.totals.engagement_rate_avg = page.dailyTrend.length
      ? totalEngRates / page.dailyTrend.length
      : 0;
    delete page._dailyMap;
  }

  return results;
}

// ---- Revenue APIs ----

export interface RevenueMetricRow {
  date: string;
  pageName: string;
  /** Meta Page ID — what the page name links through to. */
  pageId: string | null;
  pageUrl: string | null;
  team: string;
  bonus: string;
  photo: string;
  reel: string;
  story: string;
  text: string;
  total: string;
}

export interface RevenueMappingRow {
  id: number;
  pageId: string;
  pageName: string;
  team: string | null;
  /** Override for the link; normally null, since `pageId` resolves on its own. */
  pageUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export async function fetchRevenueMetrics(
  startDate: string,
  endDate: string,
): Promise<RevenueMetricRow[]> {
  try {
    const response = await apiClient.get(`${REVENUE_URL}/metrics`, {
      params: { startDate, endDate },
    });
    return response.data;
  } catch (error) {
    console.error("Revenue Metrics Error:", error);
    return [];
  }
}

/** MTD / DOD / WOW revenue windows for the headline chips. */
export async function fetchRevenueHeadlines(): Promise<HeadlineWindows | null> {
  try {
    const response = await apiClient.get(`${REVENUE_URL}/headlines`);
    return response.data;
  } catch (error) {
    console.error("Revenue Headlines Error:", error);
    return null;
  }
}

export async function fetchRevenueMappings(): Promise<RevenueMappingRow[]> {
  try {
    const response = await apiClient.get(`${REVENUE_URL}/mappings`);
    return response.data;
  } catch (error) {
    console.error("Revenue Mappings Error:", error);
    return [];
  }
}

export async function updateRevenueMapping(
  id: number,
  team: string | null,
): Promise<RevenueMappingRow[]> {
  const response = await apiClient.patch(`${REVENUE_URL}/mappings/${id}`, { team });
  return response.data;
}

export async function updateRevenueMappingUrl(
  id: number,
  pageUrl: string | null,
): Promise<RevenueMappingRow[]> {
  const response = await apiClient.patch(`${REVENUE_URL}/mappings/${id}`, {
    pageUrl,
  });
  return response.data;
}

/** Batch-update the team for multiple revenue-mapping IDs in one request. */
export async function batchUpdateRevenueMappingTeam(
  ids: number[],
  team: string | null,
): Promise<RevenueMappingRow[]> {
  const response = await apiClient.patch(`${REVENUE_URL}/mappings/batch/team`, { ids, team });
  return response.data;
}

// ---- Page directory (click-through links) ----

/**
 * One account we can link to, as resolved by the backend from whichever of
 * social_profiles / revenue_mappings / page_mappings knows about it.
 */
export interface PageDirectoryEntry {
  name: string;
  /** `name` reduced to letters and digits, for cross-table matching. */
  key: string;
  platform: "facebook" | "instagram" | "threads" | "reddit";
  url: string;
  id: string | null;
  source: "mapping" | "profile" | "revenue";
}

/**
 * Backs every clickable page name. Returns [] on failure on purpose: a missing
 * directory should cost the links, not the table they sit in.
 */
export async function fetchPageDirectory(): Promise<PageDirectoryEntry[]> {
  try {
    const response = await apiClient.get(`/v1/page-directory`);
    return response.data;
  } catch (error) {
    console.error("Page Directory Error:", error);
    return [];
  }
}

// ---- Email Reports APIs ----

export interface ReportRecipientRow {
  id: number;
  email: string;
  isActive: boolean;
  createdAt: string;
}

export async function fetchReportRecipients(): Promise<ReportRecipientRow[]> {
  try {
    const response = await apiClient.get(`/v1/email-reports/recipients`);
    return response.data;
  } catch (error) {
    console.error("Fetch Recipients Error:", error);
    return [];
  }
}

export async function addReportRecipient(email: string): Promise<ReportRecipientRow> {
  const response = await apiClient.post(`/v1/email-reports/recipients`, { email });
  return response.data;
}

export async function deleteReportRecipient(id: number): Promise<void> {
  await apiClient.delete(`/v1/email-reports/recipients/${id}`);
}

export async function sendTestReport(): Promise<{ success: boolean; message: string }> {
  const response = await apiClient.post(`/v1/email-reports/send-test`);
  return response.data;
}

// ---- Report Sports Mappings APIs ----

const REPORT_SPORTS_MAPPINGS_URL = `/v1/report-sports-mappings`;

export interface ReportSportsMappingRow {
  id: number;
  profileId: string;
  pageName: string;
  sport: string | null;
  createdAt: string;
  updatedAt: string;
}

/** MTD / DOD / WOW impression windows for the selected report profiles. */
export async function fetchReportHeadlines(
  profileIds: string[],
): Promise<HeadlineWindows | null> {
  try {
    const response = await apiClient.post("/api/analytics/aggregate/headlines", {
      profileIds,
    });
    return response.data;
  } catch (error) {
    console.error("Report Headlines Error:", error);
    return null;
  }
}

export async function fetchReportSportsMappings(): Promise<ReportSportsMappingRow[]> {
  try {
    const response = await apiClient.get(REPORT_SPORTS_MAPPINGS_URL);
    return response.data;
  } catch (error) {
    console.error("Report Sports Mappings Error:", error);
    return [];
  }
}

/** Sync profiles into mappings table (creates rows for new profiles). */
export async function syncReportSportsMappings(
  profiles: { profileId: string; name: string }[],
): Promise<ReportSportsMappingRow[]> {
  try {
    const response = await apiClient.post(`${REPORT_SPORTS_MAPPINGS_URL}/sync`, { profiles });
    return response.data;
  } catch (error) {
    console.error("Sync Report Sports Mappings Error:", error);
    return [];
  }
}

/** Update sport for a single mapping. */
export async function updateReportSportsMapping(
  id: number,
  sport: string | null,
): Promise<ReportSportsMappingRow[]> {
  const response = await apiClient.patch(`${REPORT_SPORTS_MAPPINGS_URL}/${id}`, { sport });
  return response.data;
}

/** Batch-update sport for multiple mapping IDs. */
export async function batchUpdateReportSportsMappingSport(
  ids: number[],
  sport: string | null,
): Promise<ReportSportsMappingRow[]> {
  const response = await apiClient.patch(`${REPORT_SPORTS_MAPPINGS_URL}/batch/sport`, { ids, sport });
  return response.data;
}

// ── MSN Production ──

const MSN_URL = '/v1/msn-production';

function msnParams(params: Record<string, any>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v == null) continue;
    out[k] = Array.isArray(v) ? v.join(',') : String(v);
  }
  return out;
}

export async function fetchMsnSyncStatus() {
  const res = await apiClient.get(`${MSN_URL}/sync-status`);
  return res.data;
}

export async function triggerMsnSync() {
  const res = await apiClient.post(`${MSN_URL}/sync`);
  return res.data;
}

export async function fetchMsnFilters() {
  const res = await apiClient.get(`${MSN_URL}/filters`);
  return res.data;
}

export async function fetchMsnOverview(params: Record<string, any>) {
  const res = await apiClient.get(`${MSN_URL}/overview`, { params: msnParams(params) });
  return res.data;
}

export async function fetchMsnTimeseries(params: Record<string, any>) {
  const res = await apiClient.get(`${MSN_URL}/timeseries`, { params: msnParams(params) });
  return res.data;
}

export async function fetchMsnWriters(params: Record<string, any>) {
  const res = await apiClient.get(`${MSN_URL}/writers`, { params: msnParams(params) });
  return res.data;
}

export async function fetchMsnEditors(params: Record<string, any>) {
  const res = await apiClient.get(`${MSN_URL}/editors`, { params: msnParams(params) });
  return res.data;
}

export async function fetchMsnProduction(params: Record<string, any>) {
  const res = await apiClient.get(`${MSN_URL}/production`, { params: msnParams(params) });
  return res.data;
}

export async function fetchMsnStageDurations(params: Record<string, any>) {
  const res = await apiClient.get(`${MSN_URL}/stage-durations`, { params: msnParams(params) });
  return res.data;
}

export async function fetchMsnStageBoard(params: Record<string, any>) {
  const res = await apiClient.get(`${MSN_URL}/stage-board`, { params: msnParams(params) });
  return res.data;
}

export async function fetchMsnPeopleAvailability() {
  const res = await apiClient.get(`${MSN_URL}/people-availability`);
  return res.data;
}

export async function fetchMsnWorkGaps(params: Record<string, any>) {
  const res = await apiClient.get(`${MSN_URL}/work-gaps`, { params: msnParams(params) });
  return res.data;
}

export async function fetchMsnCategorySplit(params: Record<string, any>) {
  const res = await apiClient.get(`${MSN_URL}/category-split`, { params: msnParams(params) });
  return res.data;
}

export async function fetchMsnInsights(params: Record<string, any>) {
  const res = await apiClient.get(`${MSN_URL}/insights`, { params: msnParams(params) });
  return res.data;
}

export async function fetchMsnModeration(params: Record<string, any>) {
  const res = await apiClient.get(`${MSN_URL}/moderation`, { params: msnParams(params) });
  return res.data;
}

export async function fetchMsnDuplicates(params: Record<string, any>) {
  const res = await apiClient.get(`${MSN_URL}/duplicates`, { params: msnParams(params) });
  return res.data;
}

// ── MSN syndication reports (EOD / EOW / MTD) ──

export async function fetchMsnReportPeriods() {
  const res = await apiClient.get(`${MSN_URL}/reports/periods`);
  return res.data;
}

export async function fetchMsnReportEod(date?: string) {
  const res = await apiClient.get(`${MSN_URL}/reports/eod`, {
    params: date ? { date } : {},
  });
  return res.data;
}

export async function fetchMsnReportEow(weekStart?: string) {
  const res = await apiClient.get(`${MSN_URL}/reports/eow`, {
    params: weekStart ? { weekStart } : {},
  });
  return res.data;
}

export async function fetchMsnReportMtd(month?: string) {
  const res = await apiClient.get(`${MSN_URL}/reports/mtd`, {
    params: month ? { month } : {},
  });
  return res.data;
}

export async function fetchMsnReportsConfig() {
  const res = await apiClient.get(`${MSN_URL}/reports/config`);
  return res.data;
}

export async function fetchMsnReportTargets() {
  const res = await apiClient.get(`${MSN_URL}/reports/targets`);
  return res.data;
}

export async function updateMsnReportTargets(targets: unknown[]) {
  const res = await apiClient.put(`${MSN_URL}/reports/targets`, { targets });
  return res.data;
}

// ── Critical Flow ──

const CF_URL = '/v1/critical-flow';

/** Flattens filter params to query strings; arrays become comma lists. */
function cfParams(params: Record<string, any>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v == null) continue;
    if (Array.isArray(v)) {
      if (!v.length) continue;
      out[k] = v.join(',');
    } else {
      out[k] = String(v);
    }
  }
  return out;
}

async function cfGet(path: string, params?: Record<string, any>) {
  const res = await apiClient.get(`${CF_URL}/${path}`, {
    params: params ? cfParams(params) : undefined,
  });
  return res.data;
}

export async function fetchCfSyncStatus() {
  return cfGet('sync-status');
}

export async function triggerCfSync() {
  const res = await apiClient.post(`${CF_URL}/sync`);
  return res.data;
}

export async function fetchCfFilters() {
  return cfGet('filters');
}

export async function fetchCfOverview(params: Record<string, any>) {
  return cfGet('overview', params);
}

export async function fetchCfTimeseries(params: Record<string, any>) {
  return cfGet('timeseries', params);
}

export async function fetchCfFunnel(params: Record<string, any>) {
  return cfGet('funnel', params);
}

export async function fetchCfPending(params: Record<string, any>) {
  return cfGet('pending', params);
}

export async function fetchCfWriters(params: Record<string, any>) {
  return cfGet('writers', params);
}

export async function fetchCfEditors(params: Record<string, any>) {
  return cfGet('editors', params);
}

export async function fetchCfAllotters(params: Record<string, any>) {
  return cfGet('allotters', params);
}

export async function fetchCfSendBacks(params: Record<string, any>) {
  return cfGet('send-backs', params);
}

export async function fetchCfTat(params: Record<string, any>) {
  return cfGet('tat', params);
}

export async function fetchCfDivisions(params: Record<string, any>) {
  return cfGet('divisions', params);
}

export async function fetchCfArticleTypes(params: Record<string, any>) {
  return cfGet('article-types', params);
}

export async function fetchCfRoster(params: Record<string, any>) {
  return cfGet('roster', params);
}

export async function fetchCfInsights(params: Record<string, any>) {
  return cfGet('insights', params);
}

// ── Resources (people shared by Critical Flow and Yahoo) ──

const RES_URL = '/v1/resources';

async function resGet(path: string, params?: Record<string, any>) {
  const res = await apiClient.get(`${RES_URL}/${path}`, {
    params: params ? cfParams(params) : undefined,
  });
  return res.data;
}

export async function fetchResourceSummary(params: Record<string, any>) {
  return resGet('summary', params);
}

export async function fetchResourceBoard(params: Record<string, any>) {
  return resGet('board', params);
}

export async function fetchResourceSuggest(params: Record<string, any>) {
  return resGet('suggest', params);
}

export async function fetchResourceHealth() {
  return resGet('health');
}

export async function fetchResourceProfiles() {
  return resGet('profiles');
}

export async function updateResourceProfiles(profiles: unknown[]) {
  const res = await apiClient.put(`${RES_URL}/profiles`, { profiles });
  return res.data;
}

// ─── Yahoo Production ────────────────────────────────────────────────────────
//
// Same analytics as Critical Flow over a separate pipeline, so the query shape
// is identical — only the base path and the send-back surfaces differ.

const YP_URL = '/v1/yahoo-production';

async function ypGet(path: string, params?: Record<string, any>) {
  const res = await apiClient.get(`${YP_URL}/${path}`, {
    params: params ? cfParams(params) : undefined,
  });
  return res.data;
}

/** Yahoo + Critical Flow production in one place (the Yahoo page's Combined tab). */
export async function fetchCombinedProduction(params: Record<string, any>) {
  const res = await apiClient.get('/v1/production/combined', { params: cfParams(params) });
  return res.data;
}

export async function fetchYpSyncStatus() {
  return ypGet('sync-status');
}

export async function triggerYpSync() {
  const res = await apiClient.post(`${YP_URL}/sync`);
  return res.data;
}

export async function fetchYpFilters() {
  return ypGet('filters');
}

export async function fetchYpOverview(params: Record<string, any>) {
  return ypGet('overview', params);
}

export async function fetchYpTimeseries(params: Record<string, any>) {
  return ypGet('timeseries', params);
}

export async function fetchYpFunnel(params: Record<string, any>) {
  return ypGet('funnel', params);
}

export async function fetchYpPending(params: Record<string, any>) {
  return ypGet('pending', params);
}

export async function fetchYpWriters(params: Record<string, any>) {
  return ypGet('writers', params);
}

export async function fetchYpEditors(params: Record<string, any>) {
  return ypGet('editors', params);
}

export async function fetchYpAllotters(params: Record<string, any>) {
  return ypGet('allotters', params);
}

export async function fetchYpTat(params: Record<string, any>) {
  return ypGet('tat', params);
}

export async function fetchYpDivisions(params: Record<string, any>) {
  return ypGet('divisions', params);
}

export async function fetchYpQuotas(params: Record<string, any>) {
  return ypGet('quotas', params);
}

export async function fetchYpArticleTypes(params: Record<string, any>) {
  return ypGet('article-types', params);
}

export async function fetchYpRoster(params: Record<string, any>) {
  return ypGet('roster', params);
}

export async function fetchYpInsights(params: Record<string, any>) {
  return ypGet('insights', params);
}
