"use client";

import React, { useEffect, useState } from "react";
import { Loader2, CloudDownload } from "lucide-react";
import { usePathname } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useRole } from "@/hooks/useRole";

export default function GlobalSyncScreen({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [jobsRemaining, setJobsRemaining] = useState(0);
  const [initialJobs, setInitialJobs] = useState<number | null>(null);
  const pathname = usePathname();
  const queryClient = useQueryClient();

  const initialJobsRef = React.useRef<number | null>(null);

  // The Meta sync only concerns Social Media; the API refuses everyone else.
  const { canUse } = useRole();
  const watchesSync = canUse("sm");

  useEffect(() => {
    if (!watchesSync) return;

    const checkSyncStatus = async () => {
      const BACKEND_URL =
        process.env.NEXT_PUBLIC_API_URL || "";
      try {
        const res = await fetch(`${BACKEND_URL}/api/auth/meta/sync-status`, {
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          setIsSyncing(data.isSyncing);
          setJobsRemaining(data.jobsRemaining);

          if (
            data.isSyncing &&
            initialJobsRef.current === null &&
            data.jobsRemaining > 0
          ) {
            initialJobsRef.current = data.jobsRemaining;
            setInitialJobs(data.jobsRemaining);
          } else if (!data.isSyncing && initialJobsRef.current !== null) {
            initialJobsRef.current = null;
            setInitialJobs(null);

            queryClient.invalidateQueries({ queryKey: ["aggregate"] });
            queryClient.invalidateQueries({
              queryKey: ["demographics-aggregated"],
            });
            queryClient.invalidateQueries({
              queryKey: ["demographics-profile"],
            });
            queryClient.invalidateQueries({ queryKey: ["per-page-aggregate"] });
            queryClient.invalidateQueries({ queryKey: ["posts"] });
            queryClient.invalidateQueries({ queryKey: ["smart-analytics"] });
          } else if (!data.isSyncing) {
            initialJobsRef.current = null;
            setInitialJobs(null);
          }
        }
      } catch (err) {}
    };

    checkSyncStatus();
    const interval = setInterval(checkSyncStatus, 5000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchesSync]);

  const isRestrictedPage =
    pathname?.startsWith("/reports") || pathname?.startsWith("/settings");

  const estimatedSeconds = jobsRemaining * 360;
  const etaMinutes = Math.max(1, Math.ceil(estimatedSeconds / 60));

  return (
    <>
      {children}

      {isSyncing && isRestrictedPage && (
        <div className="fixed bottom-6 right-8 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-blue-100 dark:border-blue-900/30 p-4 w-[320px] flex items-center gap-4">
            <div className="relative flex shrink-0 h-12 w-12 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600">
              <CloudDownload size={24} className="animate-pulse" />
              <div className="absolute -bottom-1 -right-1 bg-indigo-600 text-white rounded-full p-0.5 shadow-sm">
                <Loader2 size={12} className="animate-spin" />
              </div>
            </div>

            <div className="flex-1">
              <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-0.5">
                Syncing Background Data
              </h4>
              <div className="flex items-center justify-between text-xs font-medium text-gray-500 dark:text-gray-400">
                <span>{jobsRemaining} tasks left</span>
                <span>~{etaMinutes}m ETA</span>
              </div>

              <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1.5 mt-2 overflow-hidden">
                <div
                  className="bg-blue-600 h-1.5 rounded-full animate-pulse origin-left"
                  style={{ width: "100%", animationDuration: "2s" }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
