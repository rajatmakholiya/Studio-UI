/** Mirrors the API's SheetRoundupResult (modules/resources/combined-production.service.ts). */

export interface RoundupCounts {
  written: number;
  edited: number;
  published: number;
}

export interface RoundupSheetCounts extends RoundupCounts {
  /** Written in the range and not yet through an editorial pass, as of the last sync. */
  pendingEditor: number;
}

export interface RoundupSheet extends RoundupSheetCounts {
  sheet: string;
}

export interface RoundupSide {
  totals: RoundupSheetCounts;
  /** One row per source sheet; for Yahoo, one per division on its sheet, plus BB News. */
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
    /**
     * The BB News workbook, read live: when it was last read, and why the latest
     * read failed. Absent from an API older than the BB News change.
     */
    bbNews?: { readAt: string | null; error: string | null };
  };
}

export const MEASURES: { key: keyof RoundupCounts; label: string }[] = [
  { key: "written", label: "Written" },
  { key: "edited", label: "Edited" },
  { key: "published", label: "Published" },
];
