// Result shapes returned by /v1/critical-flow. Mirrors the API's
// src/modules/critical-flow/types.ts — keep the two in step.

export interface CfFilterParams {
  startDate?: string;
  endDate?: string;
  divisions?: string[];
  writers?: string[];
  editors?: string[];
  articleTypes?: string[];
  statuses?: string[];
  allotters?: string[];
}

export interface SyncStatus {
  lastSyncTime: string | null;
  rowCount: number;
  rosterCount: number;
  syncing: boolean;
  error: string | null;
}

export interface FilterOptions {
  divisions: string[];
  writers: string[];
  editors: string[];
  articleTypes: string[];
  statuses: string[];
  allotters: string[];
  sbReasons: string[];
  dateRange: { min: string; max: string };
}

export interface KpiDelta {
  value: number;
  pct: number | null;
}

export interface KpiOverview {
  allotted: number;
  submitted: number;
  verified: number;
  published: number;
  /** published / allotted */
  publishRate: number;
  /** submitted / allotted */
  submissionRate: number;
  /** pieces sent back at least once, as a share of those that reached editorial */
  sendBackRate: number;
  medianTatHours: number;
  /** Mean turnaround. Diverges from the median when a few pieces run long. */
  avgTatHours: number;
  p90TatHours: number;
  pendingCount: number;
  activeWriters: number;
  activeEditors: number;
  /** Writers' submissions over their summed days worked — not over the days in the range. */
  perWriterPerDay: number;
  /** Days worked, summed over writers: the denominator of perWriterPerDay. */
  writerDaysWorked?: number;
  /** False when no date range was supplied, so deltas carry no comparison. */
  deltasAvailable: boolean;
  deltas: Record<string, KpiDelta>;
}

export interface TimeseriesBucket {
  bucket: string;
  allotted: number;
  submitted: number;
  verified: number;
  published: number;
  sentBack: number;
  medianTatHours: number;
  avgTatHours: number;
}

export interface FunnelStage {
  stage: string;
  count: number;
  /** share of the stage before it */
  conversion: number;
  dropped: number;
}

export interface PendingItem {
  id: string;
  division: string;
  stage: string;
  pendingWith: string;
  title: string;
  stagingLink: string;
  waitingSince: string | null;
  ageingHours: number;
}

export interface PendingBucket {
  stage: string;
  count: number;
  medianAgeHours: number;
  oldestAgeHours: number;
}

export interface PendingResult {
  buckets: PendingBucket[];
  byDivision: { division: string; awaitingSubmission: number; awaitingEditorial: number; awaitingLive: number; total: number }[];
  ageBands: { band: string; count: number }[];
  items: PendingItem[];
}

export interface WriterStats {
  writer: string;
  division: string;
  allotted: number;
  submitted: number;
  verified: number;
  published: number;
  sentBack: number;
  sendBackRate: number;
  medianTatHours: number;
  avgTatHours: number;
  /** Null where allotment carries no clock time, making the leg unmeasurable. */
  medianWriteHours: number | null;
  submissionRate: number;
  pending: number;
  /** Distinct days in the period on which they submitted anything. */
  activeDays: number;
  /** Submissions per active day — days off and leave are excluded. */
  perActiveDay: number;
}

export interface EditorStats {
  editor: string;
  division: string;
  handled: number;
  verified: number;
  sentBack: number;
  sendBackRate: number;
  secondPass: number;
  medianReviewHours: number | null;
  avgReviewHours: number | null;
  /** Distinct days in the period on which they handled anything. */
  activeDays: number;
  /** Pieces handled per active day. */
  perActiveDay: number;
}

export interface AllotterStats {
  allotter: string;
  division: string;
  allotted: number;
  submitted: number;
  published: number;
  submissionRate: number;
  neverPicked: number;
}

export interface SendBackEntry {
  reason: string;
  count: number;
  share: number;
  medianReworkHours: number | null;
}

export interface SendBackResult {
  total: number;
  rate: number;
  reasons: SendBackEntry[];
  byEditor: { editor: string; sentBack: number; handled: number; rate: number }[];
  byWriter: { writer: string; sentBack: number; submitted: number; rate: number }[];
  byDivision: { division: string; sentBack: number; handled: number; rate: number }[];
  trend: { bucket: string; sentBack: number; handled: number; rate: number }[];
  /** Pieces sent back and still not re-verified. */
  openSendBacks: PendingItem[];
}

export interface TatStat {
  label: string;
  count: number;
  median: number;
  avg: number;
  p90: number;
  max: number;
}

export interface TatResult {
  overall: TatStat;
  distribution: { band: string; count: number }[];
  byDivision: TatStat[];
  byArticleType: TatStat[];
  byWriter: TatStat[];
  byEditor: TatStat[];
  /** Median and mean hours in each leg; null where the source lacks the timestamps. */
  stages: {
    stage: string;
    median: number | null;
    avg: number | null;
    p90: number | null;
    count: number;
  }[];
  slowest: {
    id: string;
    division: string;
    title: string;
    writer: string;
    editor: string;
    tatHours: number;
    stagingLink: string;
  }[];
}

export interface DivisionStats {
  division: string;
  allotted: number;
  submitted: number;
  verified: number;
  published: number;
  sentBack: number;
  pending: number;
  publishRate: number;
  medianTatHours: number;
  avgTatHours: number;
  writers: number;
  editors: number;
}

export interface ArticleTypeEntry {
  articleType: string;
  count: number;
  share: number;
  published: number;
  sentBack: number;
  medianTatHours: number;
  avgTatHours: number;
}

export interface RosterEntry {
  id: string;
  division: string;
  name: string;
  role: string;
  roleGroup: string;
  weekoff: string;
  shift: string;
  email: string;
  dailyTarget: number | null;
  /** Whether today is this person's week-off. */
  offToday: boolean;
  /** Pieces currently in flight with this person. */
  activePieces: number;
  lastActiveDate: string | null;
}

export interface RosterResult {
  people: RosterEntry[];
  byDivision: { division: string; total: number; writers: number; editors: number; offToday: number }[];
  /** Rostered people with no activity in the selected window. */
  idle: { name: string; division: string; role: string; lastActiveDate: string | null; daysIdle: number | null }[];
  /** Names appearing in the data but absent from every roster. */
  unrostered: { name: string; division: string; role: string; pieces: number }[];
  /** Names in the log that may be one person split across divisions. */
  nameVariants: { variants: { name: string; division: string; pieces: number }[] }[];
}

export interface InsightsResult {
  weekdayRhythm: {
    weekday: string;
    allotted: number;
    submitted: number;
    published: number;
    medianTatHours: number;
    avgTatHours: number;
  }[];
  submissionHeatmap: { weekday: number; hour: number; count: number }[];
  stuck: PendingItem[];
  duplicates: {
    titleNorm: string;
    title: string;
    count: number;
    divisions: string[];
    writers: string[];
    ids: string[];
  }[];
  dataQuality: { issue: string; count: number; detail: string }[];
}

// ── Resources page ──
// People come from the Dynamic Schedule; their work is counted across
// Critical Flow and Yahoo. Mirrors ES_Studio_API/src/modules/resources/types.ts.

export type ResourceStatus =
  | 'Off'
  | 'Free'
  | 'Available'
  | 'At capacity'
  | 'Overloaded'
  | 'Busy';

export interface ResourceLeave {
  from: string;
  to: string;
  type: string;
}

export interface ResourcePerson {
  /** `${primaryDivision}|${name}` — stable across requests, used for profiles. */
  key: string;
  name: string;
  primaryDivision: string;
  subFeed: string;
  /** Explicit, from the schedule workbook. */
  secondaryDivisions: string[];
  /** Inferred from content: every division they have a piece in. */
  workedDivisions: { division: string; pieces: number }[];
  role: string;
  roleGroup: string;
  pod: string;
  shift: string;
  shiftClock: string;
  weekoff: string;
  status: ResourceStatus;
  statusReason: string;
  offToday: boolean;
  /** "Weekly off" | "Scheduled off" | "On leave (Sick) until 2026-09-16" | '' */
  offReason: string;
  onLeave: ResourceLeave | null;
  /** Who the schedule says covers them today, if off. */
  coveredBy: string;
  /** Standing backup from Editor Info. */
  backup: string;
  /** Writers: submitted today. Editors: published today. Both pipelines. */
  doneToday: number;
  /** The part of doneToday that went through the Yahoo sheet. */
  doneYahoo: number;
  /** Editors only: pieces they verified today, as a secondary output signal. */
  verifiedToday: number;
  quota: number | null;
  /** Writers: allotted + sent back, not yet submitted. */
  inFlight: number;
  /** Editors: pieces awaiting their editorial pass. */
  queue: number;
  /** The part of inFlight (writers) or queue (editors) on the Yahoo sheet. */
  loadYahoo: number;
  /** quota − done − inFlight, or null without a quota. */
  remaining: number | null;
  /** Pieces with no timestamps at all — output that cannot be dated. */
  undatedPieces: number;
  lastActive: string | null;
  /** schedule | content */
  sources: string[];
  flags: string[];
  /** Active | On notice | Exited | '' from Roles & Contact. */
  employment: string;
  notes: string;
}

export interface ResourceBoardResult {
  date: string;
  weekday: string;
  currentShift: string;
  people: ResourcePerson[];
  counts: Record<ResourceStatus, number>;
}

export interface SubFeedProgress {
  subFeed: string;
  quota: number;
  submitted: number;
}

export interface DivisionResourceSummary {
  division: string;
  poc: string;
  architecture: string;
  quotaEmp: number;
  quotaLnp: number;
  quotaTotal: number;
  /** True when the workbook never gives this division a quota. */
  quotaMissing: boolean;
  /** Editorial Chart figure when it disagrees with DailyDynamics, else null. */
  quotaConflict: number | null;
  /** Critical Flow submissions, measured against the DailyDynamics quota. */
  submittedEmp: number;
  submittedLnp: number;
  submittedTotal: number;
  publishedToday: number;
  /** Shortfall against the shift currently running. */
  gapCurrentShift: number;
  /** Shortfall against the whole day. */
  gapDay: number;
  /** Yahoo's own daily quota for this division, when its sheet sets one. */
  yahooQuota: number | null;
  yahooSubmitted: number;
  yahooPublished: number;
  /** Both pipelines. */
  awaitingEditorial: number;
  awaitingSubmission: number;
  unassignedEditorial: number;
  openSendBacks: number;
  writersTotal: number;
  writersOff: number;
  writersFree: number;
  writersAvailable: number;
  editorsTotal: number;
  editorsOff: number;
  editorsFree: number;
  undatedPieces: number;
  subFeeds: SubFeedProgress[];
}

export interface ResourceSummaryResult {
  date: string;
  weekday: string;
  currentShift: string;
  divisions: DivisionResourceSummary[];
  totals: {
    quota: number;
    submitted: number;
    published: number;
    gapDay: number;
    yahooPublished: number;
    awaitingEditorial: number;
    writersFree: number;
    editorsFree: number;
    onLeave: number;
  };
}

export interface SuggestCandidate {
  person: ResourcePerson;
  score: number;
  reasons: string[];
}

export interface SuggestResult {
  date: string;
  division: string;
  role: string;
  forPerson: string | null;
  candidates: SuggestCandidate[];
}

export interface ResourceProfile {
  key: string;
  division: string;
  name: string;
  dailyQuota: number | null;
  notes: string;
  updatedAt: string | null;
}

export interface ScheduleHealthFlag {
  issue: string;
  count: number;
  detail: string;
  items: string[];
}

export interface ScheduleHealthResult {
  /** A spreadsheet id is configured for the People / Leaves / Quotas tabs. */
  sheetConfigured: boolean;
  lastSyncTime: string | null;
  syncError: string | null;
  people: number;
  leaves: number;
  quotas: number;
  flags: ScheduleHealthFlag[];
}
