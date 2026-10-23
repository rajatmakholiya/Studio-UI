import { lastDaysIst } from "@/features/critical-flow/format";

export type PeriodKey = "today" | "yesterday" | "7d" | "30d" | "month" | "lastMonth" | "custom";

export const PERIOD_PRESETS: { key: Exclude<PeriodKey, "custom">; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "yesterday", label: "Yesterday" },
  { key: "7d", label: "7D" },
  { key: "30d", label: "30D" },
  { key: "month", label: "This month" },
  { key: "lastMonth", label: "Last month" },
];

const shift = (date: string, days: number) => {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};

/** A preset's dates, in IST like every production stamp. */
export function periodRange(key: Exclude<PeriodKey, "custom">): { startDate: string; endDate: string } {
  const today = lastDaysIst(1).endDate;
  const monthStart = `${today.slice(0, 8)}01`;
  switch (key) {
    case "today":
      return { startDate: today, endDate: today };
    case "yesterday":
      return { startDate: shift(today, -1), endDate: shift(today, -1) };
    case "7d":
      return lastDaysIst(7);
    case "30d":
      return lastDaysIst(30);
    case "month":
      return { startDate: monthStart, endDate: today };
    case "lastMonth": {
      const end = shift(monthStart, -1);
      return { startDate: `${end.slice(0, 8)}01`, endDate: end };
    }
  }
}

const dayFmt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

/** "16 Oct 2026 – 22 Oct 2026", or one date for a single day. */
export function periodLabel(startDate: string, endDate: string): string {
  const fmt = (d: string) => dayFmt.format(new Date(`${d}T00:00:00Z`));
  return startDate === endDate ? fmt(startDate) : `${fmt(startDate)} – ${fmt(endDate)}`;
}
