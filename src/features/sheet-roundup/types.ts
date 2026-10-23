/** Mirrors the API's SheetRoundupResult (modules/resources/combined-production.service.ts). */

export interface RoundupCounts {
  written: number;
  edited: number;
  published: number;
}

export interface RoundupSheet extends RoundupCounts {
  sheet: string;
}

export interface RoundupSide {
  totals: RoundupCounts;
  /** One row per source sheet; for Yahoo, one per division on its single sheet. */
  sheets: RoundupSheet[];
}

export interface RoundupDay {
  date: string;
  yahoo: RoundupCounts;
  nonYahoo: RoundupCounts;
}

export interface SheetRoundup {
  startDate: string | null;
  endDate: string | null;
  total: RoundupCounts;
  yahoo: RoundupSide;
  nonYahoo: RoundupSide;
  days: RoundupDay[];
  notes: {
    /** CF-sheet pieces with activity in the range that the Yahoo sheet also tracks, counted under Yahoo. */
    sharedWithYahoo: number;
    /** Pieces no stamp places on a day, so outside every range. */
    undated: number;
  };
}

export const MEASURES: { key: keyof RoundupCounts; label: string }[] = [
  { key: "written", label: "Written" },
  { key: "edited", label: "Edited" },
  { key: "published", label: "Published" },
];
