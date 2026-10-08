// Colours for the Stable views. Every event keeps one colour on every surface
// (cards, tables, chips, mix bars), so an event can be followed by eye across
// the page; stages have their own fixed colours.

const EVENT_COLORS = [
  "#6366f1", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6",
  "#14b8a6", "#f97316", "#ec4899", "#84cc16", "#06b6d4", "#a855f7",
  "#eab308", "#3b82f6", "#22c55e", "#e11d48", "#0d9488", "#c026d3",
  "#ca8a04", "#2563eb", "#7c3aed", "#dc2626", "#059669", "#d97706",
];

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

/**
 * Event → colour. Seeded from the event's own name rather than its position,
 * so a new tab added to the workbook does not repaint every existing event;
 * collisions step to the next free colour while any remain.
 */
export function eventColorMap(events: string[]): Map<string, string> {
  const out = new Map<string, string>();
  const used = new Set<number>();
  for (const e of [...new Set(events)].sort()) {
    let slot = hash(e) % EVENT_COLORS.length;
    if (used.size < EVENT_COLORS.length) {
      while (used.has(slot)) slot = (slot + 1) % EVENT_COLORS.length;
    }
    used.add(slot);
    out.set(e, EVENT_COLORS[slot]);
  }
  return out;
}

export const FALLBACK_EVENT_COLOR = "#94a3b8";

export const STAGE_STYLE: Record<string, { color: string; short: string }> = {
  "Awaiting Submission": { color: "#94a3b8", short: "To write" },
  "Awaiting Editorial": { color: "#f59e0b", short: "To edit" },
  "In Editorial": { color: "#0ea5e9", short: "Editing" },
  "Sent Back": { color: "#f43f5e", short: "Sent back" },
  Verified: { color: "#8b5cf6", short: "Verified" },
  Published: { color: "#10b981", short: "Scheduled / live" },
  "On Hold": { color: "#f97316", short: "On hold" },
  Trashed: { color: "#475569", short: "Trashed" },
};

export const STAGE_ORDER = Object.keys(STAGE_STYLE);

/** The stage counts a StageTotals carries, in lifecycle order. */
export function stageSegments(t: {
  awaitingSubmission: number;
  awaitingEditorial: number;
  inEditorial: number;
  sentBack: number;
  verifiedUnpublished: number;
  published: number;
  onHold: number;
  trashed: number;
}): { stage: string; count: number }[] {
  return [
    { stage: "Awaiting Submission", count: t.awaitingSubmission },
    { stage: "Awaiting Editorial", count: t.awaitingEditorial },
    { stage: "In Editorial", count: t.inEditorial },
    { stage: "Sent Back", count: t.sentBack },
    { stage: "Verified", count: t.verifiedUnpublished },
    { stage: "Published", count: t.published },
    { stage: "On Hold", count: t.onHold },
    { stage: "Trashed", count: t.trashed },
  ];
}
