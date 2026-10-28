"use client";

import { useState } from "react";
import { fmtInt } from "@/features/critical-flow/format";
import { periodLabel } from "@/features/sheet-roundup/periods";
import type { Overview } from "../types";
import OverviewKpis from "./OverviewKpis";
import { DeskTable, GroupTable } from "./ReachTables";
import ArticlesTable, { type ArticleFilter } from "./ArticlesTable";

type Tab = "writers" | "editors" | "divisions" | "articles";

export default function OverviewView({ data }: { data: Overview }) {
  const [tab, setTab] = useState<Tab>("writers");
  const [filter, setFilter] = useState<ArticleFilter | null>(null);
  const pick = (field: ArticleFilter["field"]) => (value: string) => {
    setFilter({ field, value });
    setTab("articles");
  };

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "writers", label: "Writers", count: data.writers.length },
    { key: "editors", label: "Editors", count: data.editors.length },
    { key: "divisions", label: "Divisions", count: data.divisions.length },
    { key: "articles", label: "Articles", count: data.articles.length },
  ];
  const { from, through } = data.traffic;

  return (
    <div className="space-y-4">
      <p className="rounded-xl border border-indigo-100 bg-indigo-50/60 px-4 py-2.5 text-[11px] leading-relaxed text-indigo-900 dark:border-indigo-500/20 dark:bg-indigo-500/10 dark:text-indigo-200">
        Every Critical Flow and Yahoo article <strong>published</strong> in the period, credited to its writer and editor as on the
        Combined tab, joined to the <strong>social landings</strong> (Facebook, Threads, Reddit) its page drew. The sheets hold no public
        URL, so each article is matched to its page by headline; an article with no match drew no social traffic that can be traced to it.
        {through ? (
          <> Sessions run from publication to {periodLabel(through, through)}, so the newest articles are still gathering traffic.</>
        ) : (
          <> No landing-page traffic has synced yet.</>
        )}
        {from && from > data.startDate && (
          <> Landing-page traffic is on record from {periodLabel(from, from)}; articles published before then show none.</>
        )}{" "}
        MSN and Stable are not included: MSN articles live on the MSN microsite, outside the site&apos;s analytics, and the Stable sheet
        records no dates.
      </p>

      <OverviewKpis data={data} />
      <DeskTable data={data} />

      <div className="flex w-fit flex-wrap items-center gap-0.5 rounded-lg border border-gray-200 bg-white p-0.5 dark:border-gray-700 dark:bg-gray-900" role="tablist">
        {tabs.map((t) => (
          <button
            key={t.key}
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              tab === t.key
                ? "bg-indigo-600 text-white"
                : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            }`}
          >
            {t.label}
            <span className={`ml-1.5 tabular-nums ${tab === t.key ? "text-indigo-200" : "text-gray-400 dark:text-gray-500"}`}>
              {fmtInt(t.count)}
            </span>
          </button>
        ))}
      </div>

      {tab === "writers" && (
        <GroupTable
          title="Writers"
          subtitle="Articles each writer had published in the period; click a name for their articles"
          nameLabel="Writer"
          rows={data.writers}
          showDivision
          csv="writers"
          onPick={pick("writer")}
        />
      )}
      {tab === "editors" && (
        <GroupTable
          title="Editors"
          subtitle="Credited to the editor who cleared each article; click a name for their articles"
          nameLabel="Editor"
          rows={data.editors}
          showDivision
          csv="editors"
          onPick={pick("editor")}
        />
      )}
      {tab === "divisions" && (
        <GroupTable
          title="Divisions"
          subtitle="Yahoo divisions folded into the Critical Flow names; click one for its articles"
          nameLabel="Division"
          rows={data.divisions}
          showDivision={false}
          csv="divisions"
          onPick={pick("division")}
        />
      )}
      {tab === "articles" && <ArticlesTable articles={data.articles} filter={filter} onClearFilter={() => setFilter(null)} />}
    </div>
  );
}
