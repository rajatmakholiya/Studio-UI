import type { AgeTone } from "@/features/critical-flow/format";
import type { ReportWeek } from "./types";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "2026-09-07" → "Sep 07" */
export function shortDate(date: string): string {
  return `${MONTHS[Number(date.slice(5, 7)) - 1]} ${date.slice(8, 10)}`;
}

export function weekLabel(w: ReportWeek): string {
  return `${shortDate(w.start)} – ${shortDate(w.end)}`;
}

/** Calendar arithmetic on YYYY-MM-DD, in UTC so no time zone shifts the day. */
export function addDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function targetTone(perDay: number | null, target: number | null): AgeTone | null {
  if (perDay == null || target == null || target <= 0) return null;
  const share = perDay / target;
  if (share >= 1) return "ok";
  if (share >= 0.8) return "warn";
  return "bad";
}

/** Caveats a group's numbers carry, shown under its name. */
export function groupNote(name: string, rostered: number): string | null {
  if (name === "Stables writers") return "Critical Flow and Yahoo work only — Stable pieces carry no dates";
  if (name === "Not on the schedule") return "Writing with no matching name in the Dynamic Schedule";
  if (rostered === 0 && /part-time|msn/i.test(name)) {
    return `Nobody yet — add "(${/msn/i.test(name) ? "MSN" : "Part-time"})" to their Role in the Dynamic Schedule`;
  }
  return null;
}
