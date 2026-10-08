"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BarChart2,
  BarChart3,
  DollarSign,
  Workflow,
  Users,
  Share2,
  GaugeCircle,
  // Newspaper,
  // FileBarChart,
  Settings,
  ShieldCheck,
  Sparkles,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useRole, type UserRole } from "@/hooks/useRole";

type Icon = typeof LayoutDashboard;

interface NavLink {
  kind: "link";
  name: string;
  href: string;
  icon: Icon;
  minRole: UserRole;
}

interface NavGroup {
  kind: "group";
  name: string;
  icon: Icon;
  children: NavLink[];
}

type NavEntry = NavLink | NavGroup;

const link = (
  name: string,
  href: string,
  icon: Icon,
  minRole: UserRole = "user",
): NavLink => ({ kind: "link", name, href, icon, minRole });

const nav: NavEntry[] = [
  link("Dashboard", "/dashboard", LayoutDashboard),
  {
    kind: "group",
    name: "Social Media",
    icon: Share2,
    children: [
      link("Web Traffic", "/traffic", BarChart3),
      link("Reports", "/reports", BarChart2),
      link("Revenue", "/revenue", DollarSign),
      // Temporarily hidden:
      // link("MSN Production", "/msn-production", Newspaper),
      // link("MSN Reports", "/msn-reports", FileBarChart),
    ],
  },
  {
    kind: "group",
    name: "Critical Flow",
    icon: Workflow,
    children: [
      link("Production", "/critical-flow", GaugeCircle),
      link("Yahoo Production", "/yahoo-production", GaugeCircle),
      link("Stable Production", "/stable-production", GaugeCircle),
      link("Resources", "/cf-resources", Users),
    ],
  },
  link("Access", "/users", ShieldCheck, "superadmin"),
  link("Settings", "/settings", Settings),
];

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (val: boolean) => void;
}

export default function Sidebar({ isCollapsed, setIsCollapsed }: SidebarProps) {
  const pathname = usePathname();
  const { canAccess } = useRole();

  const isLinkActive = (href: string) => pathname.startsWith(href);

  const visible: NavEntry[] = nav
    .map((entry) =>
      entry.kind === "link"
        ? entry
        : { ...entry, children: entry.children.filter((c) => canAccess(c.minRole)) },
    )
    .filter((entry) =>
      entry.kind === "link" ? canAccess(entry.minRole) : entry.children.length > 0,
    );

  // A group opens when the current page is inside it, and otherwise remembers
  // whatever the user last did — so navigating never collapses the section you
  // are standing in, but closing one stays closed while you work elsewhere.
  const [open, setOpen] = useState<Record<string, boolean>>({});
  useEffect(() => {
    const active = nav.find(
      (e) => e.kind === "group" && e.children.some((c) => isLinkActive(c.href)),
    );
    if (active) setOpen((prev) => ({ ...prev, [active.name]: true }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const isGroupOpen = (g: NavGroup) =>
    open[g.name] ?? g.children.some((c) => isLinkActive(c.href));

  const rowBase =
    "flex items-center rounded-xl text-sm font-medium transition-colors";
  const rowIdle =
    "text-gray-500 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white";
  const rowActive =
    "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400";

  /** Collapsed rail shows every destination as an icon — groups would have
   *  nowhere to expand into, so their children are surfaced directly. */
  const railLinks: NavLink[] = visible.flatMap((e) =>
    e.kind === "link" ? [e] : e.children,
  );

  return (
    <aside
      className={`fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 transition-all duration-300 ${isCollapsed ? "w-16" : "w-56"}`}
    >
      {/* Logo Area */}
      <div className="flex h-16 items-center px-4 overflow-hidden">
        <div className={`flex items-center gap-2 ${isCollapsed ? "w-full justify-center" : ""}`}>
          <div className="flex h-8 w-8 min-w-[32px] items-center justify-center rounded-lg bg-indigo-600 text-white shadow-sm">
            <Sparkles size={18} />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col leading-tight">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-indigo-500 dark:text-indigo-400">
                Essentially
              </span>
              <span className="text-base font-extrabold tracking-tight text-gray-900 dark:text-white">
                Analytics
              </span>
            </div>
          )}
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto overflow-x-hidden px-3 py-6">
        {isCollapsed
          ? railLinks.map((item) => {
              const active = isLinkActive(item.href);
              const ItemIcon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={item.name}
                  className={`${rowBase} justify-center px-0 py-3 ${active ? rowActive : rowIdle}`}
                >
                  <ItemIcon size={20} className="min-w-[20px]" />
                </Link>
              );
            })
          : visible.map((entry) => {
              if (entry.kind === "link") {
                const active = isLinkActive(entry.href);
                const ItemIcon = entry.icon;
                return (
                  <Link
                    key={entry.href}
                    href={entry.href}
                    className={`${rowBase} gap-3 px-4 py-3 ${active ? rowActive : rowIdle}`}
                  >
                    <ItemIcon size={20} className="min-w-[20px]" />
                    <span className="whitespace-nowrap">{entry.name}</span>
                  </Link>
                );
              }

              const expanded = isGroupOpen(entry);
              const hasActiveChild = entry.children.some((c) => isLinkActive(c.href));
              const GroupIcon = entry.icon;

              return (
                <div key={entry.name}>
                  <button
                    type="button"
                    aria-expanded={expanded}
                    onClick={() =>
                      setOpen((prev) => ({ ...prev, [entry.name]: !expanded }))
                    }
                    className={`${rowBase} w-full gap-3 px-4 py-3 ${
                      hasActiveChild && !expanded ? rowActive : rowIdle
                    }`}
                  >
                    <GroupIcon size={20} className="min-w-[20px]" />
                    <span className="flex-1 whitespace-nowrap text-left">{entry.name}</span>
                    <ChevronDown
                      size={14}
                      className={`min-w-[14px] transition-transform duration-200 ${
                        expanded ? "" : "-rotate-90"
                      }`}
                    />
                  </button>

                  {expanded && (
                    <div className="mt-0.5 space-y-0.5 border-l border-gray-200 pb-1 pl-3 ml-[26px] dark:border-gray-800">
                      {entry.children.map((child) => {
                        const active = isLinkActive(child.href);
                        const ChildIcon = child.icon;
                        return (
                          <Link
                            key={child.href}
                            href={child.href}
                            className={`${rowBase} gap-2.5 px-3 py-2 ${active ? rowActive : rowIdle}`}
                          >
                            <ChildIcon size={16} className="min-w-[16px]" />
                            <span className="whitespace-nowrap">{child.name}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
      </nav>

      {/* Collapse Toggle */}
      <div className="border-t border-gray-200 p-4 dark:border-gray-800">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="flex w-full items-center justify-center rounded-xl p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
        >
          {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>
    </aside>
  );
}
