import { fmtInt, fmtPct } from "@/features/critical-flow/format";
import { PLATFORMS, type PlatformSessions } from "../types";

/** Facebook / Threads / Reddit as one stacked bar, with a legend carrying the numbers. */
export default function PlatformBar({ platforms, total }: { platforms: PlatformSessions; total: number }) {
  return (
    <div>
      <div className={`flex h-2 gap-[2px] overflow-hidden rounded-full ${total > 0 ? "" : "bg-gray-100 dark:bg-gray-800"}`}>
        {total > 0 &&
          PLATFORMS.filter((p) => platforms[p.key] > 0).map((p) => (
            <div
              key={p.key}
              className={`h-full ${p.swatch}`}
              style={{ width: `${(platforms[p.key] / total) * 100}%` }}
              title={`${p.label}: ${fmtInt(platforms[p.key])} (${fmtPct((platforms[p.key] / total) * 100)})`}
            />
          ))}
      </div>
      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] tabular-nums">
        {PLATFORMS.map((p) => (
          <span key={p.key} className="inline-flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
            <span className={`h-2 w-2 rounded-full ${p.swatch}`} />
            {p.label}
            <span className="font-medium text-gray-900 dark:text-white">{fmtInt(platforms[p.key])}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
