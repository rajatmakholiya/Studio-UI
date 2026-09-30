/**
 * Formatting helpers for the Critical Flow views.
 *
 * Every number goes through an explicit "en-US" locale: the Node process this
 * renders under and the browser that hydrates it do not agree on a default
 * locale, and a bare toLocaleString() produces different digit grouping on
 * each side, which React reports as a hydration mismatch.
 */

/** Compact human duration from hours: 45m / 6.5h / 2.3d. */
export function fmtHours(h: number | null | undefined): string {
  if (h == null || isNaN(h) || h <= 0) return "—";
  if (h < 1) return `${Math.round(h * 60)}m`;
  if (h < 48) return `${Math.round(h * 10) / 10}h`;
  return `${Math.round((h / 24) * 10) / 10}d`;
}

export function fmtPct(v: number | null | undefined): string {
  if (v == null || isNaN(v)) return "—";
  return `${Math.round(v * 10) / 10}%`;
}

export function fmtInt(v: number | null | undefined): string {
  if (v == null || isNaN(v)) return "—";
  return Math.round(v).toLocaleString("en-US");
}

export function fmtDec(v: number | null | undefined, digits = 1): string {
  if (v == null || isNaN(v)) return "—";
  return v.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  });
}

// CSV cells carry raw numbers rather than the display strings ("6.5h", "1,204")
// so a spreadsheet can sum and sort them. Blank wherever the table shows "—".
export function csvNum(v: number | null | undefined, digits = 1): number | null {
  if (v == null || isNaN(v)) return null;
  const f = 10 ** digits;
  return Math.round(v * f) / f;
}

export function csvHours(h: number | null | undefined): number | null {
  return h == null || h <= 0 ? null : csvNum(h);
}

/** "2026-09-23 14:05" in the viewer's zone — a form Excel reads as a date. */
export function csvTimestamp(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export type AgeTone = "ok" | "warn" | "bad";

/** Freshness tone for queued work: <24h fine, <72h warning, else alarming. */
export function ageTone(h: number): AgeTone {
  if (h < 24) return "ok";
  if (h < 72) return "warn";
  return "bad";
}

export const AGE_TONE_CLASS: Record<AgeTone, string> = {
  ok: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
  warn: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
  bad: "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400",
};

/**
 * Send-back rate tone. Inverted against ageTone: a low rate is the good case,
 * and anything past a fifth of output going back is worth flagging.
 */
export function rateTone(pctValue: number): AgeTone {
  if (pctValue < 5) return "ok";
  if (pctValue < 15) return "warn";
  return "bad";
}

/** Colour per pipeline queue, shared by the board, charts and tables. */
export const STAGE_COLOR: Record<string, string> = {
  "Awaiting Submission": "#6366f1",
  "Awaiting Editorial": "#f59e0b",
  "Sent Back": "#f43f5e",
  "Awaiting Live": "#10b981",
};

export const STAGE_CLASS: Record<string, string> = {
  "Awaiting Submission":
    "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400",
  "Awaiting Editorial":
    "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
  "Sent Back": "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400",
  "Awaiting Live":
    "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
};

/** Short date label for chart axes: "12 Sep". */
export function fmtDay(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  // A bare date parses as UTC midnight; formatting it in the viewer's zone
  // would show the previous day anywhere west of UTC.
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(iso);
  return d.toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    ...(dateOnly ? { timeZone: "UTC" } : {}),
  });
}

/**
 * The last `days` desk days ending today, in IST — the zone every production
 * stamp is recorded in. "7D" is seven days including today, not eight, and
 * "today" does not lag behind until 05:30 the way a UTC date would.
 */
export function lastDaysIst(days: number): { startDate: string; endDate: string } {
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  const start = new Date(`${today}T12:00:00Z`);
  start.setUTCDate(start.getUTCDate() - (days - 1));
  return { startDate: start.toISOString().slice(0, 10), endDate: today };
}

/** Relative age from an ISO timestamp: "3h ago", "2d ago". */
export function fmtAgo(iso: string | null): string {
  if (!iso) return "—";
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (mins < 1440) return `${Math.round(mins / 60)}h ago`;
  return `${Math.round(mins / 1440)}d ago`;
}
