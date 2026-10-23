import React, { useState, useMemo, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Table2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Download,
  Settings2,
  ChevronDown,
  ChevronRight,
  Search,
  Filter,
  CheckSquare,
  Square,
} from "lucide-react";
import {
  fetchReportSportsMappings,
  syncReportSportsMappings,
  ReportSportsMappingRow,
} from "@/lib/api";
import SportsMappingsModal from "./SportsMappingsModal";
import { usePageLinks, toPageLinkPlatform } from "@/lib/page-links";
import { PageNameLink } from "@/components/ui/PageNameLink";
import { useRole } from "@/hooks/useRole";
interface PageMetric {
  profileId: string;
  pageName: string;
  platform: string;
  followers: number;
  impressions: number;
  engagements: number;
  engagementRate: string;
  pageViews: number;
  videoViews: number;
  revenue: number;
}

type SortKey = keyof PageMetric;
type SortDir = "asc" | "desc";

interface SportGroup {
  sport: string;
  pages: PageMetric[];
  totals: {
    followers: number;
    impressions: number;
    engagements: number;
    pageViews: number;
    videoViews: number;
    revenue: number;
    engagementRate: string;
  };
}

const fetchPerPageData = async ({ queryKey }: any) => {
  const [_key, profileIds, startDate, endDate] = queryKey;
  const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "";

  const res = await fetch(`${BACKEND_URL}/api/analytics/aggregate/per-page`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ profileIds, startDate, endDate }),
  });

  const data = await res.json();
  if (!res.ok)
    throw new Error(data.error || "Failed to fetch per-page metrics");
  return data as { pages: PageMetric[] };
};

function buildSportGroups(
  pages: PageMetric[],
  mappings: ReportSportsMappingRow[],
): SportGroup[] {
  const sportByProfile: Record<string, string> = {};
  for (const m of mappings) {
    if (m.sport) sportByProfile[m.profileId] = m.sport;
  }

  const groupMap = new Map<string, PageMetric[]>();
  for (const page of pages) {
    const sport = sportByProfile[page.profileId] || "Uncategorized";
    if (!groupMap.has(sport)) groupMap.set(sport, []);
    groupMap.get(sport)!.push(page);
  }

  const groups: SportGroup[] = [];
  for (const [sport, sportPages] of groupMap) {
    const totals = sportPages.reduce(
      (acc, p) => {
        acc.followers += p.followers;
        acc.impressions += p.impressions;
        acc.engagements += p.engagements;
        acc.pageViews += p.pageViews;
        acc.videoViews += p.videoViews;
        acc.revenue += p.revenue;
        return acc;
      },
      {
        followers: 0,
        impressions: 0,
        engagements: 0,
        pageViews: 0,
        videoViews: 0,
        revenue: 0,
      },
    );

    const engRate =
      totals.impressions > 0
        ? ((totals.engagements / totals.impressions) * 100).toFixed(1)
        : "0.0";

    groups.push({
      sport,
      pages: sportPages,
      totals: { ...totals, engagementRate: engRate },
    });
  }

  // Sort: named sports first (alphabetically), Uncategorized last
  groups.sort((a, b) => {
    if (a.sport === "Uncategorized") return 1;
    if (b.sport === "Uncategorized") return -1;
    return a.sport.localeCompare(b.sport);
  });

  return groups;
}

export default function PageMetricsTable({
  selectedProfileIds,
  startDate,
  endDate,
  activePlatform,
}: {
  selectedProfileIds: string[];
  startDate: string;
  endDate: string;
  activePlatform: string;
}) {
  const queryClient = useQueryClient();
  const pageLinks = usePageLinks();
  const { canAccess } = useRole();
  const [sortKey, setSortKey] = useState<SortKey>("impressions");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [showMappingsModal, setShowMappingsModal] = useState(false);
  const [expandedSports, setExpandedSports] = useState<Set<string>>(
    new Set(),
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSports, setSelectedSports] = useState<Set<string>>(new Set());
  const [isSportFilterOpen, setIsSportFilterOpen] = useState(false);
  const [sportFilterInitialized, setSportFilterInitialized] = useState(false);
  const sportFilterRef = useRef<HTMLDivElement>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["per-page-aggregate", selectedProfileIds, startDate, endDate],
    queryFn: fetchPerPageData,
    enabled: selectedProfileIds.length > 0,
    staleTime: 1000 * 60 * 5,
  });

  const { data: mappings = [] } = useQuery({
    queryKey: ["report-sports-mappings"],
    queryFn: fetchReportSportsMappings,
    staleTime: 1000 * 60 * 5,
  });

  // Auto-sync profiles into mappings table when pages load
  const pages = data?.pages || [];
  useEffect(() => {
    if (pages.length > 0) {
      const profiles = pages.map((p) => ({
        profileId: p.profileId,
        name: p.pageName,
      }));
      syncReportSportsMappings(profiles).then(() => {
        queryClient.invalidateQueries({
          queryKey: ["report-sports-mappings"],
        });
      });
    }
  }, [pages.length]); // Only sync when page count changes

  const hasSportAssignments = mappings.some((m) => m.sport);

  // Build sport-by-profile lookup for filtering
  const sportByProfile = useMemo(() => {
    const map: Record<string, string> = {};
    for (const m of mappings) {
      if (m.sport) map[m.profileId] = m.sport;
    }
    return map;
  }, [mappings]);

  // Derive available sport names from mappings
  const availableSports = useMemo(() => {
    const sports = new Set<string>();
    for (const m of mappings) {
      if (m.sport) sports.add(m.sport);
    }
    return Array.from(sports).sort();
  }, [mappings]);

  // Auto-select all sports when they first appear or change
  useEffect(() => {
    if (availableSports.length > 0 && !sportFilterInitialized) {
      setSelectedSports(new Set([...availableSports, "Uncategorized"]));
      setSportFilterInitialized(true);
    }
  }, [availableSports, sportFilterInitialized]);

  // When new sports are added, add them to selection
  useEffect(() => {
    if (sportFilterInitialized && availableSports.length > 0) {
      setSelectedSports((prev) => {
        const next = new Set(prev);
        for (const s of availableSports) {
          if (!next.has(s)) next.add(s);
        }
        if (!next.has("Uncategorized")) next.add("Uncategorized");
        return next;
      });
    }
  }, [availableSports.length]);

  // Close sport filter dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (sportFilterRef.current && !sportFilterRef.current.contains(e.target as Node)) {
        setIsSportFilterOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter pages by selected sports and search query
  const filteredPages = useMemo(() => {
    let result = pages;

    // Sport filter
    if (hasSportAssignments && selectedSports.size > 0) {
      const allPossible = new Set([...availableSports, "Uncategorized"]);
      const isAllSelected = selectedSports.size >= allPossible.size;
      if (!isAllSelected) {
        result = result.filter((p) => {
          const sport = sportByProfile[p.profileId] || "Uncategorized";
          return selectedSports.has(sport);
        });
      }
    }

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter((p) => p.pageName.toLowerCase().includes(q));
    }

    return result;
  }, [pages, hasSportAssignments, selectedSports, availableSports, sportByProfile, searchQuery]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const sortPages = (pageList: PageMetric[]) => {
    return [...pageList].sort((a, b) => {
      let aVal: any = a[sortKey];
      let bVal: any = b[sortKey];
      if (sortKey === "engagementRate") {
        aVal = parseFloat(aVal);
        bVal = parseFloat(bVal);
      }
      if (sortKey === "pageName") {
        aVal = (aVal as string).toLowerCase();
        bVal = (bVal as string).toLowerCase();
        if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
        if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
        return 0;
      }
      return sortDir === "asc" ? aVal - bVal : bVal - aVal;
    });
  };

  const sortedPages = useMemo(() => sortPages(filteredPages), [filteredPages, sortKey, sortDir]);

  const sportGroups = useMemo(
    () =>
      hasSportAssignments ? buildSportGroups(filteredPages, mappings) : [],
    [filteredPages, mappings, hasSportAssignments],
  );

  // Sport filter helpers
  const allSportOptions = useMemo(() => [...availableSports, "Uncategorized"], [availableSports]);
  const isAllSportsSelected = selectedSports.size >= allSportOptions.length;

  const toggleSportFilter = (sport: string) => {
    setSelectedSports((prev) => {
      const next = new Set(prev);
      if (next.has(sport)) next.delete(sport);
      else next.add(sport);
      return next;
    });
  };

  const toggleAllSports = () => {
    if (isAllSportsSelected) {
      setSelectedSports(new Set());
    } else {
      setSelectedSports(new Set(allSportOptions));
    }
  };

  // Auto-expand all groups on first load
  useEffect(() => {
    if (sportGroups.length > 0 && expandedSports.size === 0) {
      setExpandedSports(new Set(sportGroups.map((g) => g.sport)));
    }
  }, [sportGroups.length]);

  const toggleSportExpand = (sport: string) => {
    setExpandedSports((prev) => {
      const next = new Set(prev);
      if (next.has(sport)) next.delete(sport);
      else next.add(sport);
      return next;
    });
  };

  // Earnings per page are for managers; SM Users get the table without them.
  const showRevenue = activePlatform === "facebook" && canAccess("management");

  const columns: { key: SortKey; label: string; align?: "left" | "right" }[] = [
    { key: "pageName", label: "Page Name", align: "left" },
    { key: "followers", label: "Followers", align: "right" },
    { key: "impressions", label: "Impressions", align: "right" },
    { key: "engagements", label: "Engagements", align: "right" },
    { key: "engagementRate", label: "Eng. Rate", align: "right" },
    { key: "pageViews", label: "Page Views", align: "right" },
    { key: "videoViews", label: "Video Views", align: "right" },
    ...(showRevenue
      ? [
          {
            key: "revenue" as SortKey,
            label: "Revenue",
            align: "right" as const,
          },
        ]
      : []),
  ];

  const colSpan = columns.length;

  const exportCSV = () => {
    const headers = hasSportAssignments
      ? ["Sport", ...columns.map((c) => c.label)]
      : columns.map((c) => c.label);
    const rows: string[][] = [headers];

    const sportByProfile: Record<string, string> = {};
    for (const m of mappings) {
      if (m.sport) sportByProfile[m.profileId] = m.sport;
    }

    const pagesForExport = hasSportAssignments
      ? sportGroups.flatMap((g) => g.pages.map((p) => ({ ...p, _sport: g.sport })))
      : sortedPages.map((p) => ({ ...p, _sport: "" }));

    for (const page of pagesForExport) {
      const row: string[] = [
        ...(hasSportAssignments ? [(page as any)._sport] : []),
        page.pageName,
        String(page.followers),
        String(page.impressions),
        String(page.engagements),
        `${page.engagementRate}%`,
        String(page.pageViews),
        String(page.videoViews),
        ...(showRevenue ? [`$${page.revenue.toFixed(2)}`] : []),
      ];
      rows.push(row);
    }

    // Totals
    const totalFollowers = sortedPages.reduce((s, p) => s + p.followers, 0);
    const totalImpressions = sortedPages.reduce((s, p) => s + p.impressions, 0);
    const totalEngagements = sortedPages.reduce((s, p) => s + p.engagements, 0);
    const totalPageViews = sortedPages.reduce((s, p) => s + p.pageViews, 0);
    const totalVideoViews = sortedPages.reduce((s, p) => s + p.videoViews, 0);
    const totalRevenue = sortedPages.reduce((s, p) => s + p.revenue, 0);
    const engRate =
      totalImpressions > 0
        ? ((totalEngagements / totalImpressions) * 100).toFixed(1)
        : "0.0";

    rows.push([
      ...(hasSportAssignments ? [""] : []),
      "Total",
      String(totalFollowers),
      String(totalImpressions),
      String(totalEngagements),
      `${engRate}%`,
      String(totalPageViews),
      String(totalVideoViews),
      ...(showRevenue ? [`$${totalRevenue.toFixed(2)}`] : []),
    ]);

    const csv = rows
      .map((r) =>
        r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","),
      )
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `page_breakdown_${startDate}_to_${endDate}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const SortIcon = ({ columnKey }: { columnKey: SortKey }) => {
    if (sortKey !== columnKey)
      return <ArrowUpDown size={12} className="opacity-40" />;
    return sortDir === "asc" ? (
      <ArrowUp size={12} className="text-indigo-500" />
    ) : (
      <ArrowDown size={12} className="text-indigo-500" />
    );
  };

  // Grand totals
  const totals = sortedPages.reduce(
    (acc, p) => {
      acc.followers += p.followers;
      acc.impressions += p.impressions;
      acc.engagements += p.engagements;
      acc.pageViews += p.pageViews;
      acc.videoViews += p.videoViews;
      acc.revenue += p.revenue;
      return acc;
    },
    { followers: 0, impressions: 0, engagements: 0, pageViews: 0, videoViews: 0, revenue: 0 },
  );

  const totalEngRate =
    totals.impressions > 0
      ? ((totals.engagements / totals.impressions) * 100).toFixed(1)
      : "0.0";

  // --- Loading ---
  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center gap-3">
          <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
            <Table2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              Page-wise Breakdown
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              Performance metrics for each selected page
            </p>
          </div>
        </div>
        <div className="p-6">
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-10 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse"
                style={{ animationDelay: `${i * 100}ms` }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // --- Empty ---
  if (pages.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-8 text-center">
        <Table2 className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
        <p className="text-gray-500 dark:text-gray-400 font-medium">
          No page data available for the selected date range.
        </p>
      </div>
    );
  }

  /* ─── Render helpers ─── */

  /**
   * A Facebook Page ID is also its profile URL, so these rows link with no
   * setup at all. Instagram needs the handle from `social_profiles.username`,
   * which the directory supplies — until it's backfilled, IG names stay plain.
   */
  const pageHref = (page: PageMetric) =>
    pageLinks.resolve({
      platform: toPageLinkPlatform(page.platform),
      id: page.profileId,
      name: page.pageName,
    });

  const renderPageRow = (page: PageMetric) => (
    <tr
      key={page.profileId}
      className="group hover:bg-gray-50/70 dark:hover:bg-gray-800/40 transition-colors"
    >
      <td className="px-4 py-3.5 font-semibold text-gray-900 dark:text-white whitespace-nowrap">
        <PageNameLink name={page.pageName} href={pageHref(page)} />
      </td>
      <td className="px-4 py-3.5 text-right font-medium text-gray-700 dark:text-gray-300 tabular-nums">
        {page.followers.toLocaleString()}
      </td>
      <td className="px-4 py-3.5 text-right font-medium text-gray-700 dark:text-gray-300 tabular-nums">
        {page.impressions.toLocaleString()}
      </td>
      <td className="px-4 py-3.5 text-right font-medium text-gray-700 dark:text-gray-300 tabular-nums">
        {page.engagements.toLocaleString()}
      </td>
      <td className="px-4 py-3.5 text-right tabular-nums">
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400">
          {page.engagementRate}%
        </span>
      </td>
      <td className="px-4 py-3.5 text-right font-medium text-gray-700 dark:text-gray-300 tabular-nums">
        {page.pageViews.toLocaleString()}
      </td>
      <td className="px-4 py-3.5 text-right font-medium text-gray-700 dark:text-gray-300 tabular-nums">
        {page.videoViews.toLocaleString()}
      </td>
      {showRevenue && (
        <td className="px-4 py-3.5 text-right font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
          ${page.revenue.toFixed(2)}
        </td>
      )}
    </tr>
  );

  const renderTotalsRow = (
    label: string,
    t: typeof totals & { engagementRate?: string },
    className?: string,
  ) => {
    const engRate =
      t.engagementRate ||
      (t.impressions > 0
        ? ((t.engagements / t.impressions) * 100).toFixed(1)
        : "0.0");
    return (
      <tr className={className}>
        <td className="px-4 py-3.5 font-bold text-gray-900 dark:text-white uppercase text-xs tracking-wider">
          {label}
        </td>
        <td className="px-4 py-3.5 text-right font-bold text-gray-900 dark:text-white tabular-nums">
          {t.followers.toLocaleString()}
        </td>
        <td className="px-4 py-3.5 text-right font-bold text-gray-900 dark:text-white tabular-nums">
          {t.impressions.toLocaleString()}
        </td>
        <td className="px-4 py-3.5 text-right font-bold text-gray-900 dark:text-white tabular-nums">
          {t.engagements.toLocaleString()}
        </td>
        <td className="px-4 py-3.5 text-right tabular-nums">
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300">
            {engRate}%
          </span>
        </td>
        <td className="px-4 py-3.5 text-right font-bold text-gray-900 dark:text-white tabular-nums">
          {t.pageViews.toLocaleString()}
        </td>
        <td className="px-4 py-3.5 text-right font-bold text-gray-900 dark:text-white tabular-nums">
          {t.videoViews.toLocaleString()}
        </td>
        {showRevenue && (
          <td className="px-4 py-3.5 text-right font-bold text-emerald-700 dark:text-emerald-300 tabular-nums">
            ${t.revenue.toFixed(2)}
          </td>
        )}
      </tr>
    );
  };

  return (
    <>
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
              <Table2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Page-wise Breakdown
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                Performance metrics for each selected page
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowMappingsModal(true)}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
            >
              <Settings2 size={16} />
              Mappings
            </button>
            <button
              onClick={exportCSV}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
            >
              <Download size={16} />
              Export CSV
            </button>
          </div>
        </div>

        {/* ═══ Filter & Search Bar ═══ */}
        <div className="px-6 py-3 border-b border-gray-100 dark:border-gray-800 flex flex-wrap items-center gap-3 bg-gray-50/50 dark:bg-gray-800/20">
          {/* Sport Filter Dropdown */}
          {hasSportAssignments && availableSports.length > 0 && (
            <div className="relative" ref={sportFilterRef}>
              <button
                onClick={() => setIsSportFilterOpen(!isSportFilterOpen)}
                className="flex items-center justify-between min-w-[180px] bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <span className="flex items-center gap-2 truncate pr-2">
                  <Filter size={14} className="text-gray-400 flex-shrink-0" />
                  {selectedSports.size === 0
                    ? "Select Sports..."
                    : isAllSportsSelected
                      ? `All Sports (${availableSports.length})`
                      : `${selectedSports.size} of ${allSportOptions.length} Sports`}
                </span>
                <ChevronDown
                  size={14}
                  className={`text-gray-400 flex-shrink-0 transition-transform ${isSportFilterOpen ? "rotate-180" : ""}`}
                />
              </button>

              {isSportFilterOpen && (
                <div className="absolute top-full left-0 mt-1 w-64 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-30 overflow-hidden flex flex-col">
                  {/* Select All */}
                  <div className="px-2 py-1.5 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                    <button
                      onClick={toggleAllSports}
                      className="flex items-center gap-2 w-full px-2 py-1 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400"
                    >
                      {isAllSportsSelected ? (
                        <CheckSquare size={16} className="text-indigo-600 dark:text-indigo-400" />
                      ) : (
                        <Square size={16} className="text-gray-400 dark:text-gray-500" />
                      )}
                      {isAllSportsSelected ? "Deselect All" : "Select All"}
                    </button>
                  </div>

                  {/* Sport List */}
                  <div className="max-h-60 overflow-y-auto p-1.5 space-y-0.5">
                    {allSportOptions.map((sport) => {
                      const isSelected = selectedSports.has(sport);
                      return (
                        <button
                          key={sport}
                          onClick={() => toggleSportFilter(sport)}
                          className={`flex items-center gap-2 w-full text-left px-2 py-1.5 text-sm rounded-md transition-colors ${
                            isSelected
                              ? "bg-indigo-50/50 dark:bg-indigo-900/20 text-gray-900 dark:text-white font-semibold"
                              : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                          }`}
                        >
                          {isSelected ? (
                            <CheckSquare size={16} className="text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
                          ) : (
                            <Square size={16} className="text-gray-300 dark:text-gray-600 flex-shrink-0" />
                          )}
                          <span className="truncate">{sport}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Search Box */}
          <div className="relative flex-1 max-w-xs">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Search pages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-400 transition-shadow text-gray-700 dark:text-gray-200 placeholder:text-gray-400"
            />
          </div>

          {/* Result count */}
          {(searchQuery.trim() || (hasSportAssignments && !isAllSportsSelected)) && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Showing {filteredPages.length} of {pages.length} pages
            </span>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800/60 border-b border-gray-200 dark:border-gray-800">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    onClick={() => handleSort(col.key)}
                    className={`px-4 py-3 font-semibold text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer select-none hover:text-gray-700 dark:hover:text-gray-200 transition-colors ${col.align === "right" ? "text-right" : "text-left"}`}
                  >
                    <span className="inline-flex items-center gap-1.5">
                      {col.label}
                      <SortIcon columnKey={col.key} />
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {hasSportAssignments
                ? /* ═══ GROUPED VIEW ═══ */
                  sportGroups.map((group) => {
                    const isExpanded = expandedSports.has(group.sport);
                    const sortedGroupPages = sortPages(group.pages);
                    return (
                      <React.Fragment key={group.sport}>
                        {/* Sport header row */}
                        <tr
                          onClick={() => toggleSportExpand(group.sport)}
                          className="bg-indigo-50/50 dark:bg-indigo-900/10 cursor-pointer hover:bg-indigo-100/50 dark:hover:bg-indigo-900/20 transition-colors border-t border-indigo-100 dark:border-indigo-900/30"
                        >
                          <td className="px-4 py-3 font-bold text-indigo-800 dark:text-indigo-300 whitespace-nowrap">
                            <span className="inline-flex items-center gap-2">
                              {isExpanded ? (
                                <ChevronDown size={16} />
                              ) : (
                                <ChevronRight size={16} />
                              )}
                              {group.sport}
                              <span className="text-xs font-medium text-indigo-500 dark:text-indigo-400">
                                ({group.pages.length}{" "}
                                {group.pages.length === 1 ? "page" : "pages"})
                              </span>
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-indigo-800 dark:text-indigo-300 tabular-nums">
                            {group.totals.followers.toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-indigo-800 dark:text-indigo-300 tabular-nums">
                            {group.totals.impressions.toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-indigo-800 dark:text-indigo-300 tabular-nums">
                            {group.totals.engagements.toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300">
                              {group.totals.engagementRate}%
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-indigo-800 dark:text-indigo-300 tabular-nums">
                            {group.totals.pageViews.toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-indigo-800 dark:text-indigo-300 tabular-nums">
                            {group.totals.videoViews.toLocaleString()}
                          </td>
                          {showRevenue && (
                            <td className="px-4 py-3 text-right font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                              ${group.totals.revenue.toFixed(2)}
                            </td>
                          )}
                        </tr>
                        {/* Expanded pages */}
                        {isExpanded &&
                          sortedGroupPages.map((page) => (
                            <tr
                              key={page.profileId}
                              className="group hover:bg-gray-50/70 dark:hover:bg-gray-800/40 transition-colors"
                            >
                              <td className="px-4 py-3.5 pl-10 font-semibold text-gray-900 dark:text-white whitespace-nowrap">
                                <PageNameLink
                                  name={page.pageName}
                                  href={pageHref(page)}
                                />
                              </td>
                              <td className="px-4 py-3.5 text-right font-medium text-gray-700 dark:text-gray-300 tabular-nums">
                                {page.followers.toLocaleString()}
                              </td>
                              <td className="px-4 py-3.5 text-right font-medium text-gray-700 dark:text-gray-300 tabular-nums">
                                {page.impressions.toLocaleString()}
                              </td>
                              <td className="px-4 py-3.5 text-right font-medium text-gray-700 dark:text-gray-300 tabular-nums">
                                {page.engagements.toLocaleString()}
                              </td>
                              <td className="px-4 py-3.5 text-right tabular-nums">
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400">
                                  {page.engagementRate}%
                                </span>
                              </td>
                              <td className="px-4 py-3.5 text-right font-medium text-gray-700 dark:text-gray-300 tabular-nums">
                                {page.pageViews.toLocaleString()}
                              </td>
                              <td className="px-4 py-3.5 text-right font-medium text-gray-700 dark:text-gray-300 tabular-nums">
                                {page.videoViews.toLocaleString()}
                              </td>
                              {showRevenue && (
                                <td className="px-4 py-3.5 text-right font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                                  ${page.revenue.toFixed(2)}
                                </td>
                              )}
                            </tr>
                          ))}
                      </React.Fragment>
                    );
                  })
                : /* ═══ FLAT VIEW ═══ */
                  sortedPages.map(renderPageRow)}

              {/* Grand total row */}
              {renderTotalsRow(
                "Total",
                { ...totals, engagementRate: totalEngRate },
                "bg-gray-50/80 dark:bg-gray-800/50 border-t-2 border-gray-200 dark:border-gray-700",
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mappings Modal */}
      {showMappingsModal && (
        <SportsMappingsModal
          mappings={mappings}
          onClose={() => setShowMappingsModal(false)}
          onMutate={() =>
            queryClient.invalidateQueries({
              queryKey: ["report-sports-mappings"],
            })
          }
        />
      )}
    </>
  );
}
