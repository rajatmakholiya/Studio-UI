"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Search, ShieldCheck } from "lucide-react";
import { fetchUsers, updateUserRole, type AppUser } from "@/lib/api";
import { useRole } from "@/hooks/useRole";
import { ASSIGNABLE_ROLES, ROLE_LABEL, type UserRole as Role } from "@/lib/access";
import { fmtAgo } from "@/features/critical-flow/format";

const SM_CLASS = "bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-400";
const CF_CLASS = "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400";
const NO_ACCESS_CLASS = "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400";

const ROLE_CLASS: Record<Role, string> = {
  superadmin: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
  admin: "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400",
  sm_manager: SM_CLASS,
  sm_user: SM_CLASS,
  cf_manager: CF_CLASS,
  cf_user: CF_CLASS,
  management: NO_ACCESS_CLASS,
  user: NO_ACCESS_CLASS,
};

const FILTERS: { key: string; label: string; roles: Role[] }[] = [
  { key: "admin", label: "Admins", roles: ["admin"] },
  { key: "sm", label: "Social Media", roles: ["sm_manager", "sm_user"] },
  { key: "cf", label: "Critical Flow", roles: ["cf_manager", "cf_user"] },
  // The old team-less Manager opens no pages either, so it is counted here.
  { key: "none", label: "No access yet", roles: ["user", "management"] },
];

// An explicit locale, so server and browser render the same string.
const joinedFmt = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "Asia/Kolkata",
});

function errorMessage(err: unknown): string {
  const msg = (err as { response?: { data?: { message?: unknown } } })?.response?.data?.message;
  return Array.isArray(msg) ? msg.join(" ") : typeof msg === "string" ? msg : "Could not change the role.";
}

export default function UsersPage() {
  const { canAccess, loading: roleLoading } = useRole();
  const isSuper = canAccess("superadmin");
  const qc = useQueryClient();
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [flash, setFlash] = useState<{ id: string; text: string; ok: boolean } | null>(null);

  const users = useQuery({ queryKey: ["users"], queryFn: fetchUsers, enabled: isSuper });

  const mutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: Role }) => updateUserRole(id, role),
    onSuccess: (u) => {
      qc.setQueryData<AppUser[]>(["users"], (prev) => prev?.map((x) => (x.id === u.id ? u : x)));
      setFlash({ id: u.id, text: u.role === "user" ? "Access removed" : `Now ${ROLE_LABEL[u.role]}`, ok: true });
    },
    onError: (err, vars) => setFlash({ id: vars.id, text: errorMessage(err), ok: false }),
  });

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const f of FILTERS) {
      c[f.key] = (users.data ?? []).filter((u) => f.roles.includes(u.role)).length;
    }
    return c;
  }, [users.data]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const roles = FILTERS.find((f) => f.key === roleFilter)?.roles;
    return (users.data ?? [])
      .filter((u) => !roles || roles.includes(u.role))
      .filter((u) => !q || u.email.toLowerCase().includes(q));
  }, [users.data, query, roleFilter]);

  const change = (u: AppUser, role: Role) => {
    if (role === u.role) return;
    if (role === "admin" && !window.confirm(`Give ${u.email} admin access? Admins see every page, and can run syncs and change settings.`)) {
      return;
    }
    setFlash(null);
    mutation.mutate({ id: u.id, role });
  };

  if (roleLoading) return null;

  if (!isSuper) {
    return (
      <div className="mx-auto mt-16 max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-center dark:border-gray-800 dark:bg-gray-900">
        <ShieldCheck className="mx-auto mb-3 h-8 w-8 text-gray-300 dark:text-gray-600" />
        <p className="text-sm text-gray-600 dark:text-gray-300">Only the super user can change access levels.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen space-y-4 px-4 pb-6 pt-4 lg:px-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-1.5">
            {[{ key: "all", label: "Everyone" }, ...FILTERS].map((f) => (
              <button
                key={f.key}
                onClick={() => setRoleFilter(f.key)}
                className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                  roleFilter === f.key
                    ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300"
                }`}
              >
                {f.label} {f.key === "all" ? users.data?.length ?? "" : counts[f.key]}
              </button>
            ))}
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Find by email"
              className="w-full rounded-lg border border-gray-300 bg-transparent py-1.5 pl-8 pr-3 text-xs focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400 dark:border-gray-700 dark:text-white"
            />
          </div>
        </div>

        <p className="mt-3 text-[11px] text-gray-400 dark:text-gray-500">
          Everyone who signs up starts with no access, and sees no pages until given a role here.
          Social Media roles open the Dashboard, Web Traffic and Reports; an SM Manager also gets Revenue, connected accounts and email-report recipients.
          Critical Flow roles open every Critical Flow page; a CF Manager can also edit quotas.
          Admins see everything and can run syncs. A change applies on the person&apos;s next page load.
        </p>

        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[640px] text-xs">
            <thead className="text-gray-400 dark:text-gray-500">
              <tr className="border-b border-gray-100 dark:border-gray-800">
                <th className="px-3 py-2 text-left font-medium">Email</th>
                <th className="px-3 py-2 text-left font-medium">Access</th>
                <th className="px-3 py-2 text-right font-medium">Joined</th>
                <th className="px-3 py-2 text-right font-medium">Last sign-in</th>
              </tr>
            </thead>
            <tbody>
              {users.isLoading && (
                <tr>
                  <td colSpan={4} className="px-3 py-10 text-center text-gray-400">
                    <Loader2 className="mx-auto h-4 w-4 animate-spin" />
                  </td>
                </tr>
              )}
              {rows.map((u) => {
                const pending = mutation.isPending && mutation.variables?.id === u.id;
                return (
                  <tr key={u.id} className="border-b border-gray-50 last:border-0 dark:border-gray-800/50">
                    <td className="px-3 py-2 font-medium text-gray-900 dark:text-white">{u.email}</td>
                    <td className="px-3 py-2">
                      {u.role === "superadmin" ? (
                        <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${ROLE_CLASS.superadmin}`}>
                          {ROLE_LABEL.superadmin}
                        </span>
                      ) : (
                        <div className="flex items-center gap-2">
                          <select
                            value={u.role}
                            disabled={pending}
                            onChange={(e) => change(u, e.target.value as Role)}
                            className={`rounded-md border-0 px-1.5 py-0.5 text-[11px] font-medium focus:ring-1 focus:ring-blue-400 ${ROLE_CLASS[u.role]}`}
                          >
                            {!ASSIGNABLE_ROLES.includes(u.role) && (
                              <option value={u.role} disabled>{ROLE_LABEL[u.role]}</option>
                            )}
                            {ASSIGNABLE_ROLES.map((r) => (
                              <option key={r} value={r}>{ROLE_LABEL[r]}</option>
                            ))}
                          </select>
                          {pending && <Loader2 className="h-3 w-3 animate-spin text-gray-400" />}
                          {flash?.id === u.id && !pending && (
                            <span className={`text-[10px] ${flash.ok ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                              {flash.text}
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right text-gray-500 dark:text-gray-400">
                      {joinedFmt.format(new Date(u.createdAt))}
                    </td>
                    <td className="px-3 py-2 text-right text-gray-500 dark:text-gray-400">{fmtAgo(u.lastLoginAt)}</td>
                  </tr>
                );
              })}
              {!users.isLoading && rows.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-3 py-10 text-center text-gray-400">
                    {users.isError ? "Could not load users." : "No one matches."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
