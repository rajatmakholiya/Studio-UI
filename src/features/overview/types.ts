// Mirrors ES_Studio_API/src/modules/overview/types.ts.

export type PlatformKey = "fb" | "threads" | "reddit";
export type PlatformSessions = Record<PlatformKey, number>;

export interface Reach {
  published: number;
  /** Published articles whose page drew at least one social landing. */
  reached: number;
  /** Social landings on those pages, from publication to the last synced day. */
  sessions: number;
  platforms: PlatformSessions;
}

export type Desk = "yahoo" | "nonYahoo";

export interface OverviewArticle {
  id: string;
  title: string;
  desk: Desk;
  division: string;
  writer: string;
  editor: string;
  publishedDay: string;
  /** The matched page, e.g. "/nfl-active-news-…/"; null when no page matched. */
  path: string | null;
  sessions: number;
  platforms: PlatformSessions;
}

export interface OverviewGroup extends Reach {
  name: string;
  division: string;
  top: { title: string; path: string; sessions: number } | null;
}

export interface Overview {
  startDate: string;
  endDate: string;
  traffic: { from: string | null; through: string | null };
  totals: Reach;
  desks: Record<Desk, Reach>;
  /** Social landings dated inside the period: on every page, and on this period's articles. */
  landings: { all: number; theseArticles: number };
  writers: OverviewGroup[];
  editors: OverviewGroup[];
  divisions: OverviewGroup[];
  articles: OverviewArticle[];
}

// Checked with the dataviz palette validator against white and gray-900:
// blue needs its lighter step on the dark surface, teal and orange do not.
export const PLATFORMS: { key: PlatformKey; label: string; swatch: string }[] = [
  { key: "fb", label: "Facebook", swatch: "bg-blue-600 dark:bg-blue-500" },
  { key: "threads", label: "Threads", swatch: "bg-teal-600" },
  { key: "reddit", label: "Reddit", swatch: "bg-orange-600" },
];

export const DESK_LABEL: Record<Desk, string> = { yahoo: "Yahoo", nonYahoo: "Non-Yahoo" };

export const SITE_URL = "https://www.essentiallysports.com";
