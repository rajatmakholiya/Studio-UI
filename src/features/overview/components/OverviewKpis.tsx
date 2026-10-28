import { fmtDec, fmtInt, fmtPct } from "@/features/critical-flow/format";
import type { Overview } from "../types";
import PlatformBar from "./PlatformBar";

const card = "rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900";
const pct = (part: number, whole: number) => (whole > 0 ? (part / whole) * 100 : null);

function Card({ label, value, hint, children }: { label: string; value: string; hint: string; children?: React.ReactNode }) {
  return (
    <div className={card}>
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{label}</p>
      <p className="mt-1 text-3xl font-bold tabular-nums text-gray-900 dark:text-white">{value}</p>
      {children && <div className="mt-3">{children}</div>}
      <p className="mt-2 text-[10px] text-gray-400 dark:text-gray-500">{hint}</p>
    </div>
  );
}

export default function OverviewKpis({ data }: { data: Overview }) {
  const { totals, desks, landings } = data;
  const yahooShare = pct(desks.yahoo.published, totals.published) ?? 0;

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <Card label="Articles published" value={fmtInt(totals.published)} hint="Critical Flow and Yahoo sheets, by publication date">
        <div className="h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
          <div className="h-full rounded-full bg-indigo-500" style={{ width: `${yahooShare}%` }} />
        </div>
        <div className="mt-2 flex justify-between text-[11px] tabular-nums">
          <span className="text-indigo-600 dark:text-indigo-400">Yahoo {fmtInt(desks.yahoo.published)}</span>
          <span className="text-gray-500 dark:text-gray-400">Non-Yahoo {fmtInt(desks.nonYahoo.published)}</span>
        </div>
      </Card>

      <Card
        label="Reached social"
        value={fmtInt(totals.reached)}
        hint="Articles whose page drew at least one Facebook, Threads or Reddit landing"
      >
        <p className="text-[11px] tabular-nums text-gray-500 dark:text-gray-400">
          <span className="font-medium text-gray-900 dark:text-white">{fmtPct(pct(totals.reached, totals.published))}</span> of the{" "}
          {fmtInt(totals.published)} published
        </p>
      </Card>

      <Card
        label="Social sessions"
        value={fmtInt(totals.sessions)}
        hint={`${fmtDec(totals.published ? totals.sessions / totals.published : null, 1)} per article published, counted from publication to date`}
      >
        <PlatformBar platforms={totals.platforms} total={totals.sessions} />
      </Card>

      <Card
        label="Share of the period's social traffic"
        value={fmtPct(pct(landings.theseArticles, landings.all))}
        hint="The rest landed on older articles and other pages"
      >
        <p className="text-[11px] tabular-nums text-gray-500 dark:text-gray-400">
          <span className="font-medium text-gray-900 dark:text-white">{fmtInt(landings.theseArticles)}</span> of{" "}
          {fmtInt(landings.all)} social landings dated in the period
        </p>
      </Card>
    </div>
  );
}
