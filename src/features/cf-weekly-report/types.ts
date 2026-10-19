// Mirrors the API's cf-weekly-report types: each group's output per person per
// day worked, week on week, computed from Critical Flow and Yahoo production
// with people grouped from the Team Structure tab.

export interface ReportWeek {
  start: string;
  end: string;
  /** The week in progress, counted up to `through` (today). */
  partial: boolean;
  through: string;
}

export interface WeekTally {
  /** Pieces submitted (writers, producers, editors' own writing) or published (editors). */
  output: number;
  daysWorked: number;
  /** People with any output. */
  active: number;
  /** A person's output per day worked; a group's is the mean of its active members'. */
  perDay: number | null;
}

export interface ReportMember {
  name: string;
  division: string;
  role: string;
  /** False for someone outside the group's roster who still had output. */
  rostered: boolean;
  weeks: WeekTally[];
}

export type GroupKey =
  | "stables"
  | "part-time"
  | "tenured"
  | "editors"
  | "associate-editors"
  | "newsroom"
  | "producers"
  | "associates"
  | "pod"
  | "non-pod"
  | "unlisted";

export interface ReportGroup {
  key: GroupKey;
  name: string;
  measure: "submitted" | "published" | "written";
  /** Output per person per day; null where none is set. */
  target: number | null;
  rostered: number;
  divisions: string[];
  weeks: WeekTally[];
  members: ReportMember[];
}

export interface WeeklyReport {
  /** Oldest first; the last is the week the report is as of. */
  weeks: ReportWeek[];
  /** End of the week in progress. */
  latestEnd: string;
  /** End of the latest complete week. */
  lastCompleteEnd: string;
  groups: ReportGroup[];
}
