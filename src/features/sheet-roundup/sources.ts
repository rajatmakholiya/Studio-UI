/**
 * The source workbooks the roundup's rows come from, so a pending count can
 * open the sheet its pieces sit on. Mirrors the n8n configs; keep in step with
 * n8n/critical-flow/src/01-config.js (one workbook per division, named by the
 * division it syncs as) and n8n/yahoo/src/01-config.js (one workbook for every
 * Yahoo division). BB News is read by the API itself (resources/bb-news.service.ts).
 */

const CF_SHEETS: Record<string, string> = {
  NFL: "1wcj9EAskN_QVvEaHe63S-7ktcsd8px-3XZPEBhVYmu8",
  "College Football": "1o_TPvVSImUavWX-M6nlDXUYnkcZCcGE7I2X1IYjhkKA",
  NASCAR: "1IJU-0KztG4fWFjrB2UMvZneTT4zHGhirardoex0LEgU",
  NBA: "1dgPGGQ4SsHmj3Gd0Go7AKVBvhHk8enyYVMURPNG1FwU",
  WNBA: "1YvE87y-3IDISqwKrWr2b9SEQ5a8t-HSIatDN_z_CvlY",
  UFC: "186m86f2UwdVWrhrH1mheiOnq5cT7yiDQOxAXXOLCssA",
  Golf: "1uv4cB9C2fxGQ0JSAOlK8vIZBiBMXPv1HKWmeuD9hpmI",
  "US Sports": "1bYm0aNdmeIqLz_iilTP3B1U67KcaWxO5xAZivkmbxYo",
  MLB: "15V9RP-iIKoHCL-f8DQBSTHqOsySGwz1e_sbvfCOxpWw",
};

const YAHOO_SHEET = "1s11VcQecffsoSwwApejgFXNRwxtwPiHlQZ1TRUIn9as";
const BB_NEWS_SHEET = "1uonCiv7IC0WasF1K9k-So6Fu9VKqsuVcCyjWV62fkPw";

export interface SourceSheet {
  /** The workbook's name as the desk knows it. */
  name: string;
  url: string;
}

const sheetUrl = (id: string) => `https://docs.google.com/spreadsheets/d/${id}/edit`;

/** A Non-Yahoo row is a whole CF workbook; null for a division not in the config. */
export const nonYahooSource = (division: string): SourceSheet | null => {
  const id = CF_SHEETS[division.trim()];
  return id ? { name: division.trim(), url: sheetUrl(id) } : null;
};

/** A Yahoo row is a division on the one Yahoo workbook, except BB News, which has its own. */
export const yahooSource = (division: string): SourceSheet =>
  division.trim() === "BB News"
    ? { name: "BB News", url: sheetUrl(BB_NEWS_SHEET) }
    : { name: "Yahoo", url: sheetUrl(YAHOO_SHEET) };
