// Mirrors the API's modules/auth/roles.ts, which is what actually enforces
// this — everything here only decides what the UI bothers to show.

export type UserRole =
  | "superadmin"
  | "admin"
  | "sm_manager"
  | "sm_user"
  | "cf_manager"
  | "cf_user"
  | "management"
  | "user";

/** The two halves of the app a manager or user is confined to. */
export type AppSection = "sm" | "cf";

const RANK: Record<UserRole, number> = {
  user: 1,
  sm_user: 1,
  cf_user: 1,
  management: 2,
  sm_manager: 2,
  cf_manager: 2,
  admin: 3,
  superadmin: 4,
};

const SECTION: Partial<Record<UserRole, AppSection>> = {
  sm_user: "sm",
  sm_manager: "sm",
  cf_user: "cf",
  cf_manager: "cf",
};

export const ROLE_LABEL: Record<UserRole, string> = {
  superadmin: "Super user",
  admin: "Admin",
  sm_manager: "SM Manager",
  sm_user: "SM User",
  cf_manager: "CF Manager",
  cf_user: "CF User",
  // Left over from before sections existed; the Access page can only move people off it.
  management: "Manager, no team",
  user: "No access yet",
};

/** What the super user can hand out, in the order the Access page lists it. */
export const ASSIGNABLE_ROLES: UserRole[] = [
  "user",
  "sm_user",
  "sm_manager",
  "cf_user",
  "cf_manager",
  "admin",
];

export function isRole(value: unknown): value is UserRole {
  return typeof value === "string" && value in RANK;
}

/** As a minimum, "management" means any manager and "user" anyone signed in. */
export function hasRole(role: UserRole, min: UserRole): boolean {
  return RANK[role] >= RANK[min];
}

export function inSection(role: UserRole, section: AppSection): boolean {
  return hasRole(role, "admin") || SECTION[role] === section;
}

interface RouteRule {
  match: string;
  section?: AppSection;
  minRole?: UserRole;
}

// Anything not listed (Settings, the 404) is open to everyone signed in.
const ROUTE_RULES: RouteRule[] = [
  { match: "/dashboard", section: "sm" },
  { match: "/traffic", section: "sm" },
  { match: "/reports", section: "sm" },
  { match: "/revenue", section: "sm", minRole: "management" },
  { match: "/msn-production", section: "sm" },
  { match: "/msn-reports", section: "sm" },
  { match: "/schedule", section: "sm" },
  { match: "/smart-box", section: "sm" },
  { match: "/debug", section: "sm" },
  { match: "/critical-flow", section: "cf" },
  { match: "/yahoo-production", section: "cf" },
  { match: "/stable-production", section: "cf" },
  { match: "/cf-weekly-report", section: "cf" },
  { match: "/cf-resources", section: "cf" },
  { match: "/users", minRole: "superadmin" },
];

export function canView(role: UserRole, pathname: string): boolean {
  const rule = ROUTE_RULES.find(
    (r) => pathname === r.match || pathname.startsWith(`${r.match}/`),
  );
  if (!rule) return true;
  if (rule.section && !inSection(role, rule.section)) return false;
  return !rule.minRole || hasRole(role, rule.minRole);
}

/** Where someone lands after signing in; null when they have no section yet. */
export function homeFor(role: UserRole): string | null {
  if (inSection(role, "sm")) return "/dashboard";
  if (inSection(role, "cf")) return "/critical-flow";
  return null;
}

/** For the sign-in pages, which get the role as untyped JSON. */
export function landingPath(role: unknown): string {
  return (isRole(role) && homeFor(role)) || "/dashboard";
}
