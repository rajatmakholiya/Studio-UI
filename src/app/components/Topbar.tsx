'use client';

import { usePathname } from 'next/navigation';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { useRole, type UserRole } from '@/hooks/useRole';

const ROLE_LABEL: Record<UserRole, string> = {
  superadmin: 'SUPER USER',
  admin: 'ADMIN',
  management: 'MANAGER',
  user: 'USER',
};

const PAGE_TITLES: { match: string; title: string; subtitle?: string }[] = [
  { match: '/revenue/mappings', title: 'Revenue Page Mappings',  subtitle: 'Manage teams and page assignments' },
  { match: '/revenue',          title: 'Revenue Dashboard',       subtitle: 'Content Monetization — Team & Page Breakdown' },
  { match: '/traffic/mappings', title: 'UTM Settings & Mappings' },
  { match: '/traffic',          title: 'Web Traffic Analytics',   subtitle: 'Real-time cross-channel traffic and engagement metrics' },
  { match: '/reports',          title: 'Reports',                 subtitle: 'Cross-channel social media performance' },
  { match: '/cf-resources',     title: 'Resource Management',     subtitle: 'Who is free, who is loaded, and who can cover — Critical Flow and Yahoo' },
  { match: '/critical-flow',    title: 'Critical Flow Production', subtitle: 'Allotment to publication across every division' },
  { match: '/yahoo-production', title: 'Yahoo Production',        subtitle: 'Allotment to publication across the Yahoo desk' },
  { match: '/stable-production', title: 'Stable Production',      subtitle: 'Where every stable piece stands, event by event' },
  { match: '/cf-weekly-report', title: 'Weekly Report',          subtitle: 'Week on week efficiency of every Critical Flow division' },
  // Temporarily hidden:
  // { match: '/msn-reports',      title: 'MSN Reports',             subtitle: 'Syndication numbers from the MSN Partner Hub — EOD, EOW and MTD' },
  // { match: '/msn-production',   title: 'MSN Production',          subtitle: 'Editorial pipeline and team performance' },
  { match: '/schedule',         title: 'Schedule' },
  { match: '/smart-box',        title: 'Smart Box' },
  { match: '/users',            title: 'Access',                  subtitle: 'Who can use EssentiallyAnalytics, and at what level' },
  { match: '/settings',         title: 'Settings' },
  { match: '/debug',            title: 'Debug' },
  { match: '/dashboard',        title: 'Dashboard Overview',      subtitle: 'Real-time performance across connected platforms' },
];

export default function Topbar() {
  const pathname = usePathname();
  const page = PAGE_TITLES.find(p => pathname.startsWith(p.match));
  const { role, email } = useRole();

  return (
    <div className="flex items-center justify-between gap-6 pb-6">
      {/* Left: page title */}
      {page ? (
        <div className="flex items-center gap-3 min-w-0">
          <div aria-hidden className="h-8 w-0.5 shrink-0 rounded-full bg-indigo-500" />
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-bold leading-tight text-gray-900 dark:text-white">
              {page.title}
            </h1>
            {page.subtitle && (
              <p className="mt-px hidden truncate text-sm leading-tight text-gray-400 dark:text-gray-500 sm:block">
                {page.subtitle}
              </p>
            )}
          </div>
        </div>
      ) : <div />}

      {/* Right: theme toggle + user chip */}
      <div className="flex shrink-0 items-center gap-6">
        <ThemeToggle />
        <div className="flex items-center gap-3 border-l border-gray-200 dark:border-gray-700 pl-4 transition-colors">
          <div className="text-right">
            <p className="max-w-[180px] truncate text-sm font-semibold text-gray-900 dark:text-white" title={email}>
              {email ? email.split('@')[0] : 'User'}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{ROLE_LABEL[role]}</p>
          </div>
          <div className="h-9 w-9 overflow-hidden rounded-full bg-orange-100 dark:bg-orange-900/30">
            <img
              src="https://api.dicebear.com/7.x/notionists/svg?seed=Alex&backgroundColor=ffd5dc"
              alt="User Avatar"
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
