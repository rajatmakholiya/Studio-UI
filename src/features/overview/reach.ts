import { csvNum, fmtDec, fmtInt, fmtPct } from "@/features/critical-flow/format";
import { PLATFORMS, type Reach } from "./types";

export interface ReachColumn {
  key: string;
  label: string;
  /** Swatch class for the platform columns, matching the platform bar. */
  swatch?: string;
  value: (r: Reach) => number | null;
  format: (v: number | null) => string;
  csv: (v: number | null) => number | null;
}

const whole = (v: number | null) => v;

/** The measures every table on the page shares, in one order, so the tables read alike. */
export const REACH_COLUMNS: ReachColumn[] = [
  { key: "published", label: "Published", value: (r) => r.published, format: fmtInt, csv: whole },
  { key: "reached", label: "Reached", value: (r) => r.reached, format: fmtInt, csv: whole },
  {
    key: "reachPct",
    label: "Reach %",
    value: (r) => (r.published ? (r.reached / r.published) * 100 : null),
    format: fmtPct,
    csv: (v) => csvNum(v),
  },
  ...PLATFORMS.map<ReachColumn>((p) => ({
    key: p.key,
    label: p.label,
    swatch: p.swatch,
    value: (r) => r.platforms[p.key],
    format: fmtInt,
    csv: whole,
  })),
  { key: "sessions", label: "Sessions", value: (r) => r.sessions, format: fmtInt, csv: whole },
  {
    key: "perArticle",
    label: "Per article",
    value: (r) => (r.published ? r.sessions / r.published : null),
    format: (v) => fmtDec(v, 1),
    csv: (v) => csvNum(v),
  },
];

export const PLATFORM_KEYS = new Set<string>(PLATFORMS.map((p) => p.key));
