// Mirrors the API's cf-weekly-report types: each group's output per person per
// day worked, week on week, computed from Critical Flow and Yahoo production.

export interface ReportWeek {
  start: string;
  end: string;
}

export interface WeekTally {
  /** Pieces submitted (writers), published (editors) or written (editors' own). */
  output: number;
  daysWorked: number;
  /** People with any output. */
  active: number;
  perDay: number | null;
}

export interface ReportMember {
  name: string;
  division: string;
  role: string;
  weeks: WeekTally[];
}

export type GroupKey =
  | "stables"
  | "part-time"
  | "msn"
  | "tenured"
  | "editors"
  | "producers"
  | "pod"
  | "non-pod"
  | "associates"
  | "stables-editors"
  | "unlisted";

export interface ReportGroup {
  key: GroupKey;
  name: string;
  measure: "submitted" | "published" | "by role" | "written";
  /** Output per person per day; null where the sheet sets none. */
  target: number | null;
  rostered: number;
  /** Rostered members on leave for the whole of the latest week. */
  onLeave: number;
  divisions: string[];
  weeks: WeekTally[];
  members: ReportMember[];
}

export interface WeeklyReport {
  /** Oldest first; the last is the week the report is as of. */
  weeks: ReportWeek[];
  latestEnd: string;
  groups: ReportGroup[];
}
