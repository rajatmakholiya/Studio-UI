// Mirrors the API's cf-weekly-report types: each group's output per person per
// day worked, week on week, computed from Critical Flow and Yahoo production.

export interface ReportWeek {
  start: string;
  end: string;
}

export interface WeekTally {
  /** Pieces submitted (writers) or published (editors). */
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

export interface ReportGroup {
  name: string;
  measure: "submitted" | "published" | "by role";
  /** Output per person per day; null for writers on no schedule. */
  target: number | null;
  rostered: number;
  weeks: WeekTally[];
  members: ReportMember[];
}

export interface ReportSection {
  title: string;
  groups: ReportGroup[];
}

export interface WeeklyReport {
  /** Oldest first; the last is the week the report is as of. */
  weeks: ReportWeek[];
  latestEnd: string;
  sections: ReportSection[];
}
