"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import GlobalSyncScreen from "./GlobalSyncScreen";
import { useAuth } from "@/hooks/useAuth";
import { RoleProvider } from "@/hooks/useRole";
import { isPublicRoute } from "@/lib/public-routes";

export default function AppLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  // Legal/compliance pages and login are public — no auth or app chrome.
  const isPublicPage = isPublicRoute(pathname);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useAuth();

  if (isPublicPage) {
    return (
      <main className="min-h-screen bg-gray-50 dark:bg-gray-950">
        {children}
      </main>
    );
  }

  return (
    <RoleProvider>
      <div className="flex h-screen overflow-hidden bg-[#f8f9fa] dark:bg-gray-950 transition-colors">
        <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />

        <div
          className={`flex flex-1 flex-col h-screen min-w-0 transition-all duration-300 ${isCollapsed ? "ml-16" : "ml-56"}`}
        >
          <main className="flex-1 overflow-y-auto overflow-x-hidden px-3 pb-3 pt-5 md:px-5 md:pb-5 xl:px-8 xl:pb-8">
            <Topbar />
            <GlobalSyncScreen>{children}</GlobalSyncScreen>
          </main>
        </div>
      </div>
    </RoleProvider>
  );
}
