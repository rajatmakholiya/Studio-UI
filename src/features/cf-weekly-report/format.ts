import type { ReportGroup, ReportWeek } from "./types";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const FULL_MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/** "2026-09-07" → "Sep 07" */
export function shortDate(date: string): string {
  return `${MONTHS[Number(date.slice(5, 7)) - 1]} ${date.slice(8, 10)}`;
}

/** As the desk's sheet heads its columns: "September 07 - September 13". */
export function sheetWeekLabel(w: ReportWeek): string {
  const long = (d: string) => `${FULL_MONTHS[Number(d.slice(5, 7)) - 1]} ${d.slice(8, 10)}`;
  return `${long(w.start)} - ${long(w.end)}`;
}

/** Calendar arithmetic on YYYY-MM-DD, in UTC so no time zone shifts the day. */
export function addDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Caveats a group's numbers carry, shown under its name. */
export function groupNote(g: ReportGroup): string | null {
  if (g.key === "stables") return "Critical Flow and Yahoo work only; Stable pieces carry no dates";
  if (g.key === "unlisted") return "Writing with no matching name in the Dynamic Schedule";
  if (g.rostered === 0 && (g.key === "part-time" || g.key === "msn")) {
    return `Nobody yet: add "(${g.key === "msn" ? "MSN" : "Part-time"})" to their Role in the Dynamic Schedule`;
  }
  return null;
}
