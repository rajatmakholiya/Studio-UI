// Stable Production types. Mirrors the API at
// src/modules/stable-production/types.ts — keep the two in step.

export interface StableFilterParams {
  events?: string[];
  sports?: string[];
  writers?: string[];
  editors?: string[];
  stableTypes?: string[];
  stages?: string[];
  kinds?: string[];
}

export interface StableSyncStatus {
  lastSyncTime: string | null;
  rowCount: number;
  eventCount: number;
  rosterCount: number;
  syncing: boolean;
  error: string | null;
  skippedTabs: string[];
}

export interface StableEventOption {
  event: string;
  sport: string;
  order: number;
  pieces: number;
  open: number;
}

export interface StableFilterOptions {
  events: StableEventOption[];
  sports: string[];
  writers: string[];
  editors: string[];
  stableTypes: string[];
  stages: string[];
  kinds: string[];
}

export interface StageCount {
  stage: string;
  count: number;
}

export interface StageTotals {
  allotted: number;
  submitted: number;
  verified: number;
  published: number;
  sentBack: number;
  onHold: number;
  trashed: number;
  awaitingSubmission: number;
  awaitingEditorial: number;
  inEditorial: number;
  verifiedUnpublished: number;
  open: number;
  completionRate: number;
}

export interface StableOverview extends StageTotals {
  events: number;
  writers: number;
  editors: number;
  newCount: number;
  updateCount: number;
  stages: StageCount[];
}

export interface NamedCount {
  name: string;
  count: number;
}

export interface StableEventStats extends StageTotals {
  event: string;
  sport: string;
  order: number;
  newCount: number;
  updateCount: number;
  writers: NamedCount[];
  editors: NamedCount[];
  stableTypes: NamedCount[];
}

export interface StableWriterStats extends StageTotals {
  writer: string;
  onRoster: boolean;
  dailyTarget: number | null;
  shift: string;
  events: NamedCount[];
}

export interface StableEditorStats {
  editor: string;
  onRoster: boolean;
  handled: number;
  verified: number;
  published: number;
  sentBack: number;
  inEditorial: number;
  onHold: number;
  trashed: number;
  events: NamedCount[];
}

export interface StableTypeStats {
  stableType: string;
  count: number;
  verified: number;
  published: number;
  open: number;
}

export interface StableTypeMatrix {
  types: string[];
  rows: { event: string; sport: string; order: number; total: number; cells: Record<string, number> }[];
  totals: StableTypeStats[];
}

export interface StableQueueItem {
  id: string;
  event: string;
  sport: string;
  sheetRow: number;
  player: string;
  title: string;
  stableType: string;
  pieceKind: string;
  writer: string;
  editor: string;
  stage: string;
  editingStatus: string;
  stagingLink: string;
  researchDoc: string;
  editorComments: string;
}

export interface StableQueue {
  stages: StageCount[];
  items: StableQueueItem[];
  total: number;
}

export interface StableRosterEntry {
  name: string;
  position: string;
  roleGroup: string;
  dailyTarget: number | null;
  bandwidthNote: string;
  timings: string;
  shift: string;
  weekoff: string;
  offToday: boolean;
  open: number;
  total: number;
}

export interface StableQualityIssue {
  issue: string;
  count: number;
  detail: string;
}

export interface StableQuality {
  issues: StableQualityIssue[];
  nameMerges: { name: string; spellings: { spelling: string; pieces: number }[] }[];
  unrostered: { name: string; role: string; pieces: number }[];
  duplicates: {
    player: string;
    stableType: string;
    count: number;
    sameEvent: boolean;
    events: string[];
    writers: string[];
  }[];
}
