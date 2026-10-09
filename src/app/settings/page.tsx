"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { logoutUser } from "@/lib/api";
import { useRole } from "@/hooks/useRole";
import {
  Facebook,
  Instagram,
  CheckCircle2,
  AlertCircle,
  X,
  CheckSquare,
  Square,
  Search,
  Loader2,
  Clock,
  RefreshCw,
  LogOut,
  Mail,
  Trash2,
  Plus,
  Send,
} from "lucide-react";

declare global {
  interface Window {
    fbAsyncInit: () => void;
    FB: any;
  }
}

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "";

// Grantor key the API uses for profiles connected before it recorded which
// Facebook account added them.
const LEGACY_GRANTOR = "legacy";

type Grantor = { id: string; name: string };

type SourceAccount = {
  id: string;
  name: string;
  pages: number;
  igAccounts: number;
  failing: number;
};

async function fetchActiveProfiles(): Promise<any[] | null> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/analytics/profiles/list`, {
      credentials: "include",
    });
    if (!res.ok) return null;
    const profiles = await res.json();
    return Array.isArray(profiles) ? profiles : null;
  } catch {
    return null;
  }
}

export default function SettingsPage() {
  const { canAccess, canUse } = useRole();
  // Connected accounts and email reports belong to Social Media managers.
  const managesSm = canAccess("management") && canUse("sm");
  const router = useRouter();

  const [isSdkLoaded, setIsSdkLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isManualSyncing, setIsManualSyncing] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const [syncStatus, setSyncStatus] = useState<{
    isSyncing: boolean;
    etaMinutes: number;
    pageCount: number;
  } | null>(null);

  const [activeProfiles, setActiveProfiles] = useState<any[]>([]);
  
  // Facebook states
  const [availablePages, setAvailablePages] = useState<any[]>([]);
  const [selectedPages, setSelectedPages] = useState<any[]>([]);
  
  // Instagram states
  const [availableIgAccounts, setAvailableIgAccounts] = useState<any[]>([]);
  const [selectedIgAccounts, setSelectedIgAccounts] = useState<any[]>([]);

  // The Facebook user the open import modal was fetched for.
  const [grantor, setGrantor] = useState<Grantor | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showDisconnectModal, setShowDisconnectModal] = useState(false);
  // null disconnects everything; otherwise only the pages that account granted.
  const [disconnectTarget, setDisconnectTarget] = useState<SourceAccount | null>(null);
  const [deleteDataOnDisconnect, setDeleteDataOnDisconnect] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  // Email report recipients
  const [recipients, setRecipients] = useState<{ id: number; email: string; isActive: boolean; createdAt: string }[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [isAddingEmail, setIsAddingEmail] = useState(false);
  const [removingId, setRemovingId] = useState<number | null>(null);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.fbAsyncInit = function () {
        window.FB.init({
          appId: process.env.NEXT_PUBLIC_META_APP_ID,
          cookie: true,
          xfbml: true,
          version: "v18.0",
        });
        setIsSdkLoaded(true);
      };

      (function (d, s, id) {
        let js: any,
          fjs = d.getElementsByTagName(s)[0];
        if (d.getElementById(id)) {
          return;
        }
        js = d.createElement(s);
        js.id = id;
        js.src = "https://connect.facebook.net/en_US/sdk.js";
        fjs?.parentNode?.insertBefore(js, fjs);
      })(document, "script", "facebook-jssdk");
    }
  }, []);

  const reloadProfiles = async () => {
    const profiles = await fetchActiveProfiles();
    if (profiles) setActiveProfiles(profiles);
  };

  useEffect(() => {
    if (!managesSm) return;
    fetchActiveProfiles().then((profiles) => {
      if (profiles) setActiveProfiles(profiles);
    });
  }, [managesSm]);

  // Fetch email report recipients
  useEffect(() => {
    const fetchRecipients = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/v1/email-reports/recipients`, {
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) setRecipients(data);
        }
      } catch (err) {}
    };
    if (managesSm) fetchRecipients();
  }, [managesSm]);

  const handleAddRecipient = async () => {
    const email = newEmail.trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;
    setIsAddingEmail(true);
    try {
      const res = await fetch(`${BACKEND_URL}/v1/email-reports/recipients`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        const added = await res.json();
        setRecipients((prev) => {
          const exists = prev.find((r) => r.id === added.id);
          if (exists) return prev.map((r) => (r.id === added.id ? added : r));
          return [...prev, added];
        });
        setNewEmail("");
      }
    } catch (err) {}
    setIsAddingEmail(false);
  };

  const handleRemoveRecipient = async (id: number) => {
    setRemovingId(id);
    try {
      const res = await fetch(`${BACKEND_URL}/v1/email-reports/recipients/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        setRecipients((prev) => prev.filter((r) => r.id !== id));
      }
    } catch (err) {}
    setRemovingId(null);
  };

  const handleSendTestReport = async () => {
    setIsSendingTest(true);
    setTestResult(null);
    try {
      const res = await fetch(`${BACKEND_URL}/v1/email-reports/send-test`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      setTestResult(data);
    } catch (err) {
      setTestResult({ success: false, message: "Failed to send test report" });
    }
    setIsSendingTest(false);
  };

  // switchAccount forces Facebook's credential screen, which is the only way to
  // reach a different profile than the one the browser is already signed into
  // — without it FB.login silently reuses that session.
  const handleConnect = (switchAccount = false) => {
    if (!isSdkLoaded) return;
    setIsLoading(true);

    window.FB.login(
      (response: any) => {
        if (response.authResponse) {
          const { accessToken: shortLivedToken } = response.authResponse;

          fetch(`${BACKEND_URL}/api/auth/meta/fetch-pages`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ shortLivedToken }),
          })
            .then((res) => res.json())
            .then((data) => {
              setGrantor(data.grantor ?? null);
              if (data.pages) {
                setAvailablePages(data.pages);
                setSelectedPages(data.pages);
              }
              if (data.igAccounts) {
                setAvailableIgAccounts(data.igAccounts);
                setSelectedIgAccounts(data.igAccounts);
              }
              
              if (data.pages?.length > 0 || data.igAccounts?.length > 0) {
                setShowModal(true);
              }
              setIsLoading(false);
            })
            .catch((err) => {
              setIsLoading(false);
            });
        } else {
          setIsLoading(false);
        }
      },
      {
        // Read-only scopes only — every one maps to a call we actually make, so
        // each can be demonstrated in App Review. Do not add write permissions
        // (pages_manage_*, instagram_content_publish) until the feature exists:
        //   pages_show_list          -> GET /me/accounts
        //   pages_read_engagement    -> GET /{page}, /{page}/feed
        //   pages_read_user_content  -> GET /{post}/comments (comment-links)
        //   read_insights            -> GET /{page|post}/insights, monetization
        //   instagram_basic          -> GET /{page}?fields=instagram_business_account, /{ig}/media
        //   instagram_manage_insights-> GET /{ig}/insights, follower_demographics
        //   instagram_manage_comments-> GET /{ig-media}/comments
        scope:
          "public_profile,pages_show_list,pages_read_engagement,pages_read_user_content,read_insights,instagram_basic,instagram_manage_insights,instagram_manage_comments",
        ...(switchAccount ? { auth_type: "reauthenticate" } : {}),
      },
    );
  };

  const handleConfirmSelection = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `${BACKEND_URL}/api/auth/meta/confirm-pages`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ selectedPages, selectedIgAccounts, grantor }),
        },
      );

      if (response.ok) {
        const totalAccounts = selectedPages.length + selectedIgAccounts.length;
        const totalEstimatedSeconds = totalAccounts * 3 * 6;
        const etaMinutes = Math.max(1, Math.ceil(totalEstimatedSeconds / 60));

        setSyncStatus({
          isSyncing: true,
          etaMinutes,
          pageCount: totalAccounts,
        });
        
        setAvailablePages([]);
        setSelectedPages([]);
        setAvailableIgAccounts([]);
        setSelectedIgAccounts([]);
        setGrantor(null);
        setShowModal(false);

        await reloadProfiles();
      }
    } catch (error) {}
    setIsLoading(false);
  };

  const handleManualSync = async () => {
    setIsManualSyncing(true);
    try {
      for (const profile of activeProfiles) {
        await fetch(
          `${BACKEND_URL}/api/analytics/profiles/${profile.profileId}/sync`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({}), 
          },
        );
      }
      const etaMinutes = Math.max(
        1,
        Math.ceil((activeProfiles.length * 3 * 2) / 60),
      );
      setSyncStatus({
        isSyncing: true,
        etaMinutes,
        pageCount: activeProfiles.length,
      });
    } catch (e) {}
    setIsManualSyncing(false);
  };

  const handleDisconnect = async () => {
    setIsDisconnecting(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/meta/disconnect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          deleteData: deleteDataOnDisconnect,
          platform: "all",
          ...(disconnectTarget ? { connectedViaId: disconnectTarget.id } : {}),
        }),
      });

      if (response.ok) {
        if (disconnectTarget) await reloadProfiles();
        else setActiveProfiles([]);
        closeDisconnectModal();
      }
    } catch (error) {
      console.error("Failed to disconnect:", error);
    }
    setIsDisconnecting(false);
  };

  const openDisconnectModal = (target: SourceAccount | null) => {
    setDisconnectTarget(target);
    setShowDisconnectModal(true);
  };

  const closeDisconnectModal = () => {
    setShowDisconnectModal(false);
    setDeleteDataOnDisconnect(false);
    setDisconnectTarget(null);
  };

  const handleAppLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logoutUser();
      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("Logout failed:", error);
      setIsLoggingOut(false);
    }
  };

  const toggleSelection = (page: any) => {
    setSelectedPages((prev) => {
      const exists = prev.find((p) => p.id === page.id);
      return exists ? prev.filter((p) => p.id !== page.id) : [...prev, page];
    });
  };

  const toggleIgSelection = (account: any) => {
    setSelectedIgAccounts((prev) => {
      const exists = prev.find((p) => p.id === account.id);
      return exists ? prev.filter((p) => p.id !== account.id) : [...prev, account];
    });
  };

  const handleSelectAll = () => {
    const allSelected = 
      selectedPages.length === availablePages.length && 
      selectedIgAccounts.length === availableIgAccounts.length;

    if (allSelected) {
      setSelectedPages([]);
      setSelectedIgAccounts([]);
    } else {
      setSelectedPages([...availablePages]);
      setSelectedIgAccounts([...availableIgAccounts]);
    }
  };

  const filteredPages = availablePages.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );
  
  const filteredIgAccounts = availableIgAccounts.filter((p) =>
    (p.name?.toLowerCase() || "").includes(searchQuery.toLowerCase()) || 
    (p.username?.toLowerCase() || "").includes(searchQuery.toLowerCase())
  );

  const totalSelected = selectedPages.length + selectedIgAccounts.length;

  const errorProfiles = activeProfiles.filter(
    (p) => p.syncState === "FAILED" && p.lastSyncError,
  );

  const connected = {
    meta: activeProfiles.some((p) => p.platform === "facebook"),
    instagram: activeProfiles.some((p) => p.platform === "instagram"),
  };

  const sourceById = new Map<string, SourceAccount>();
  for (const p of activeProfiles) {
    const id = p.connectedViaId || LEGACY_GRANTOR;
    let src = sourceById.get(id);
    if (!src) {
      src = { id, name: p.connectedViaName || "Earlier connection", pages: 0, igAccounts: 0, failing: 0 };
      sourceById.set(id, src);
    }
    if (p.platform === "facebook") src.pages++;
    else if (p.platform === "instagram") src.igAccounts++;
    if (p.syncState === "FAILED") src.failing++;
  }
  const sourceAccounts = [...sourceById.values()].sort(
    (a, b) => Number(a.id === LEGACY_GRANTOR) - Number(b.id === LEGACY_GRANTOR),
  );

  const profileById = new Map(activeProfiles.map((p) => [p.profileId, p]));
  const grantorAlreadyConnected = !!grantor && sourceById.has(grantor.id);

  // Shown beside a page in the import modal when it is already being synced, so
  // it is clear that keeping it ticked moves it onto the account signing in now.
  const trackedLabel = (id: string) => {
    const existing = profileById.get(id);
    if (!existing) return null;
    if (grantor && existing.connectedViaId === grantor.id) return "Tracked";
    return `Tracked via ${existing.connectedViaName || "an earlier connection"}`;
  };

 return (
    <div className="max-w-4xl space-y-6 pb-12">
      <div className="border-b border-gray-100 dark:border-gray-800 pb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Manage your connected social accounts and workspace preferences.</p>
      </div>

      {managesSm && syncStatus?.isSyncing && (
        <div className="rounded-xl border border-blue-100 dark:border-blue-900/30 bg-blue-50 dark:bg-blue-900/10 p-4 flex items-start gap-4 shadow-sm animate-in fade-in slide-in-from-top-4">
          <div className="mt-0.5 rounded-full bg-blue-100 dark:bg-blue-900/50 p-2 text-blue-600 dark:text-blue-400">
            <Clock size={20} className="animate-pulse" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-bold text-blue-900 dark:text-blue-300">Data Sync in Progress</h3>
            <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
              We are currently downloading historical data for {syncStatus.pageCount} account(s). 
              This happens in the background to respect platform rate limits.
            </p>
            <p className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-500 mt-3">
              Estimated wait time: ~{syncStatus.etaMinutes} Minute(s)
            </p>
          </div>
          <button onClick={() => setSyncStatus(null)} className="text-blue-400 hover:text-blue-600 dark:hover:text-blue-300">
            <X size={18} />
          </button>
        </div>
      )}

      {managesSm && errorProfiles.length > 0 && (
        <div className="rounded-xl border border-red-200 dark:border-red-900/30 bg-red-50 dark:bg-red-900/10 p-4 shadow-sm animate-in fade-in slide-in-from-top-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 text-red-600 dark:text-red-400">
              <AlertCircle size={20} />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-bold text-red-900 dark:text-red-300">Action Required: API Issues</h3>
              <p className="text-xs text-red-700 dark:text-red-400 mt-1 mb-3">
                Meta blocked us from fetching data for the following pages. This usually happens if Two-Factor Authentication (2FA) is required, or if you lack sufficient Admin permissions.
              </p>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                {errorProfiles.map(profile => (
                  <div key={profile.profileId} className="bg-white dark:bg-gray-800 rounded border border-red-100 dark:border-red-900/30 p-2.5 shadow-sm">
                    <span className="font-bold text-gray-900 dark:text-white text-xs block mb-0.5">{profile.name}</span>
                    <span className="text-xs text-red-600 dark:text-red-400 font-mono bg-red-50 dark:bg-red-900/20 px-1.5 py-0.5 rounded break-words">
                      {profile.lastSyncError}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {managesSm && (<div>
        <h2 className="mb-4 text-base font-bold text-gray-900 dark:text-white">Connected Accounts</h2>
        <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm overflow-hidden">
          <div className="flex flex-col divide-y divide-gray-50 dark:divide-gray-800/50">

            {/* FACEBOOK SECTION */}
            <div className={`p-6 transition-colors ${connected.meta ? 'bg-blue-50/30 dark:bg-blue-900/10' : 'bg-white dark:bg-gray-900'}`}>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#1877F2] text-white shadow-md shrink-0">
                    <Facebook size={24} fill="currentColor" className="text-white" />
                  </div>
                  <div className="w-full max-w-lg">
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white">Facebook Pages & Groups</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Publish posts, track engagement, and manage messages.</p>
                    
                    {connected.meta ? (
                      <span className="mt-2 flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-green-600 dark:text-green-500">
                        <CheckCircle2 size={14} /> Tracking {activeProfiles.filter(p => p.platform === 'facebook').length} Page(s)
                      </span>
                    ) : (
                      <span className="mt-2 flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-amber-500">
                        <AlertCircle size={14} /> Not Connected
                      </span>
                    )}
                  </div>
                </div>

                {!connected.meta && !connected.instagram ? (
                  <button
                    onClick={() => handleConnect()}
                    disabled={!isSdkLoaded || isLoading}
                    className="group relative flex items-center gap-2 overflow-hidden rounded-full bg-[#1877F2] px-6 py-2.5 text-sm font-bold text-white shadow-md transition-all hover:bg-[#166fe5] disabled:opacity-50"
                  >
                    {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Facebook size={18} fill="currentColor" />}
                    <span>{isLoading ? "Loading..." : "Connect to Meta"}</span>
                  </button>
                ) : (
                  <div className="flex flex-wrap items-center justify-end gap-3">
                    <button
                      onClick={() => handleConnect(true)}
                      disabled={!isSdkLoaded || isLoading}
                      title="Sign in to Facebook as a different profile and add its pages"
                      className="flex items-center gap-2 rounded-xl bg-[#1877F2] px-5 py-2 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#166fe5] disabled:opacity-50"
                    >
                      {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                      {isLoading ? "Loading..." : "Connect another account"}
                    </button>
                    <button
                      onClick={() => openDisconnectModal(null)}
                      className="rounded-xl border border-red-200 dark:border-red-900/30 bg-white dark:bg-gray-800 px-5 py-2 text-sm font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 shadow-sm transition-colors flex items-center gap-2"
                    >
                      Disconnect All
                    </button>
                  </div>
                )}
              </div>

              {sourceAccounts.length > 0 && (
                <div className="mt-5 sm:ml-16 rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
                  <div className="px-4 py-2.5 border-b border-gray-100 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-800/40 text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Connected Facebook Accounts
                  </div>
                  <div className="divide-y divide-gray-100 dark:divide-gray-800">
                    {sourceAccounts.map((src) => (
                      <div key={src.id} className="flex items-center gap-3 px-4 py-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30 text-sm font-bold text-[#1877F2] dark:text-blue-400">
                          {src.id === LEGACY_GRANTOR ? <Clock size={16} /> : src.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">{src.name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {src.pages} page{src.pages === 1 ? "" : "s"}
                            {src.igAccounts > 0 && ` · ${src.igAccounts} Instagram`}
                            {src.id === LEGACY_GRANTOR && " · reconnect the Facebook account that added these to label them"}
                          </p>
                          {src.failing > 0 && (
                            <p className="mt-0.5 text-xs font-medium text-red-600 dark:text-red-400">
                              {src.failing} failing to sync
                            </p>
                          )}
                        </div>
                        {src.failing > 0 && (
                          <button
                            onClick={() => handleConnect(true)}
                            disabled={!isSdkLoaded || isLoading}
                            title={src.id === LEGACY_GRANTOR ? "Sign in again to refresh page tokens" : `Sign in as ${src.name} again to refresh its page tokens`}
                            className="shrink-0 rounded-lg border border-blue-200 dark:border-blue-900/40 bg-blue-50 dark:bg-blue-900/20 px-3 py-1.5 text-xs font-bold text-[#1877F2] dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors disabled:opacity-50"
                          >
                            Reconnect
                          </button>
                        )}
                        <button
                          onClick={() => openDisconnectModal(src)}
                          className="shrink-0 rounded-lg border border-red-200 dark:border-red-900/30 px-3 py-1.5 text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        >
                          Disconnect
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* INSTAGRAM SECTION */}
            <div className={`p-6 transition-colors ${connected.instagram ? 'bg-fuchsia-50/30 dark:bg-fuchsia-900/10' : 'bg-white dark:bg-gray-900'}`}>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-tr from-[#f09433] via-[#e6683c] to-[#bc1888] text-white shadow-sm shrink-0">
                    <Instagram size={24} />
                  </div>
                  <div className="w-full max-w-lg">
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white">Instagram Professional</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Track followers, reach, and profile views.</p>
                    
                    {connected.instagram ? (
                      <span className="mt-2 flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-green-600 dark:text-green-500">
                        <CheckCircle2 size={14} /> Tracking {activeProfiles.filter(p => p.platform === 'instagram').length} Account(s)
                      </span>
                    ) : (
                      <span className="mt-2 flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-amber-500">
                        <AlertCircle size={14} /> Not Connected
                      </span>
                    )}
                  </div>
                </div>

                {!connected.meta && !connected.instagram && (
                   <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full">
                     Connect via Meta
                   </span>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>)}

      {managesSm && (<>
      {/* Email Reports Section */}
      <div className="pt-4">
        <h2 className="mb-4 text-base font-bold text-gray-900 dark:text-white">Email Reports</h2>
        <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-50 dark:border-gray-800/50">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 shadow-sm shrink-0">
                <Mail size={24} />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">Automated Daily & Weekly Reports</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Daily reports are sent at 7:00 AM IST with yesterday's data. Weekly reports are sent every Monday with the previous week's data. Reports include Traffic, Revenue, and Meta Overview as CSV attachments.
                </p>
              </div>
            </div>
          </div>

          {/* Add email form */}
          <div className="p-6 border-b border-gray-50 dark:border-gray-800/50">
            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider block mb-3">Add Recipient</label>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2.5 flex-1">
                <Mail size={16} className="text-gray-400 dark:text-gray-500 shrink-0" />
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleAddRecipient(); }}
                  placeholder="Enter email address..."
                  className="w-full bg-transparent text-sm text-gray-900 dark:text-white outline-none placeholder:text-gray-400"
                />
              </div>
              <button
                onClick={handleAddRecipient}
                disabled={isAddingEmail || !newEmail.trim()}
                className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-indigo-700 transition-all disabled:opacity-50 shrink-0"
              >
                {isAddingEmail ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                Add
              </button>
            </div>
          </div>

          {/* Recipients list */}
          <div className="p-6 border-b border-gray-50 dark:border-gray-800/50">
            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider block mb-3">
              Recipients ({recipients.filter(r => r.isActive).length})
            </label>
            {recipients.length === 0 ? (
              <div className="text-center py-6 text-gray-400 dark:text-gray-500 text-sm">
                No recipients added yet. Add an email address above to start receiving reports.
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1 custom-scrollbar">
                {recipients.filter(r => r.isActive).map((recipient) => (
                  <div
                    key={recipient.id}
                    className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-3 border border-gray-100 dark:border-gray-700/50 group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 shrink-0">
                        <Mail size={14} />
                      </div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white truncate">{recipient.email}</span>
                    </div>
                    <button
                      onClick={() => handleRemoveRecipient(recipient.id)}
                      disabled={removingId === recipient.id}
                      className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-50 shrink-0"
                    >
                      {removingId === recipient.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Send test report */}
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">Send Test Report</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Send yesterday's report to all active recipients now.</p>
              </div>
              <button
                onClick={handleSendTestReport}
                disabled={isSendingTest || recipients.filter(r => r.isActive).length === 0}
                className="flex items-center gap-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-5 py-2.5 text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm transition-all disabled:opacity-50"
              >
                {isSendingTest ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                {isSendingTest ? "Sending..." : "Send Test"}
              </button>
            </div>
            {testResult && (
              <div className={`mt-3 rounded-lg px-4 py-2.5 text-xs font-medium ${testResult.success ? 'bg-green-50 dark:bg-green-900/10 text-green-700 dark:text-green-400 border border-green-100 dark:border-green-900/30' : 'bg-red-50 dark:bg-red-900/10 text-red-700 dark:text-red-400 border border-red-100 dark:border-red-900/30'}`}>
                {testResult.message}
              </div>
            )}
          </div>
        </div>
      </div>
      </>)}

      <div className="pt-4">
        <h2 className="mb-4 text-base font-bold text-gray-900 dark:text-white">Session Management</h2>
        <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">Sign Out</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Securely log out of your EssentiallyAnalytics workspace.</p>
            </div>
            <button 
              onClick={handleAppLogout}
              disabled={isLoggingOut}
              className="flex items-center gap-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-5 py-2.5 text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm transition-all disabled:opacity-50"
            >
              {isLoggingOut ? <Loader2 size={16} className="animate-spin" /> : <LogOut size={16} />}
              {isLoggingOut ? "Signing Out..." : "Sign Out"}
            </button>
          </div>
        </div>
      </div>

      {managesSm && showDisconnectModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50">
              <h3 className="font-bold text-xl text-gray-900 dark:text-white">
                {disconnectTarget ? `Disconnect ${disconnectTarget.name}` : "Disconnect Meta Accounts"}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                {disconnectTarget
                  ? `Automated data syncing will stop immediately for the ${disconnectTarget.pages + disconnectTarget.igAccounts} page(s) and account(s) connected through ${disconnectTarget.name}. Pages from other Facebook accounts keep syncing.`
                  : "Are you sure you want to disconnect? Your automated data syncing will stop immediately for all Facebook and Instagram pages."}
              </p>
            </div>
            
            <div className="p-6 bg-white dark:bg-gray-900 space-y-4">
              <label className="flex items-start gap-3 cursor-pointer group">
                <div className="mt-0.5">
                  <input 
                    type="checkbox" 
                    checked={deleteDataOnDisconnect}
                    onChange={(e) => setDeleteDataOnDisconnect(e.target.checked)}
                    className="w-4 h-4 text-red-600 border-gray-300 dark:border-gray-600 rounded focus:ring-red-600 dark:bg-gray-800 transition-colors cursor-pointer"
                  />
                </div>
                <div>
                  <span className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-red-600 transition-colors">Delete all historical data</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 block mt-1 leading-relaxed">
                    Checking this will permanently remove all downloaded posts and analytics {disconnectTarget ? "for these pages " : ""}from your database. Leave unchecked to save time if you plan to reconnect later.
                  </span>
                </div>
              </label>
            </div>
            
            <div className="p-6 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-800 flex items-center justify-end gap-3 shrink-0">
              <button
                onClick={closeDisconnectModal}
                disabled={isDisconnecting}
                className="px-4 py-2 text-sm font-bold text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleDisconnect} 
                disabled={isDisconnecting} 
                className="flex items-center gap-2 rounded-xl bg-red-600 px-6 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-red-700 transition-all disabled:opacity-50"
              >
                {isDisconnecting ? <Loader2 size={16} className="animate-spin" /> : disconnectTarget ? "Disconnect" : "Disconnect Accounts"}
              </button>
            </div>
          </div>
        </div>
      )}

      {managesSm && showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50">
              <div>
                <h3 className="font-bold text-xl text-gray-900 dark:text-white">Import Meta Pages</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Select the pages you want to track in your workspace.</p>
                {grantor && (
                  <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-[#1877F2] dark:text-blue-400">
                    <Facebook size={12} fill="currentColor" /> Signed in as {grantor.name}
                  </p>
                )}
                {grantorAlreadyConnected && (
                  <p className="mt-1 text-xs text-amber-600 dark:text-amber-500">
                    This account is already connected — pages from it that you untick will stop syncing. To add a different profile, use Connect another account.
                  </p>
                )}
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-3 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 sticky top-0 z-10 space-y-3">
              <div className="flex items-center gap-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2">
                <Search size={16} className="text-gray-400 dark:text-gray-500" />
                <input 
                  type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search pages..." className="w-full bg-transparent text-sm text-gray-900 dark:text-white outline-none placeholder:text-gray-400"
                />
              </div>
              <button onClick={handleSelectAll} className="flex items-center gap-2 w-full px-2 py-1 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                {selectedPages.length === availablePages.length && selectedIgAccounts.length === availableIgAccounts.length ? <CheckSquare size={16} className="text-blue-600 dark:text-blue-400"/> : <Square size={16} />}
                {selectedPages.length === availablePages.length && selectedIgAccounts.length === availableIgAccounts.length ? "Deselect All Accounts" : "Select All Accounts"}
              </button>
            </div>

            <div className="overflow-y-auto p-3 space-y-4 flex-1 custom-scrollbar bg-gray-50/30 dark:bg-gray-900">
              {filteredPages.length === 0 && filteredIgAccounts.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">No accounts found.</div>
              ) : (
                <>
                  {/* Facebook Pages Section */}
                  {filteredPages.length > 0 && (
                    <div className="space-y-1">
                      <h4 className="px-2 pb-1 text-xs font-bold text-gray-500 uppercase tracking-wider">Facebook Pages</h4>
                      {filteredPages.map((page) => {
                        const isSelected = selectedPages.some((p) => p.id === page.id);
                        const tracked = trackedLabel(page.id);
                        return (
                          <button key={page.id} onClick={() => toggleSelection(page)} className={`flex items-center gap-4 w-full text-left px-4 py-3 text-sm transition-all rounded-xl border ${isSelected ? 'bg-blue-50/50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-gray-900 dark:text-white shadow-sm' : 'bg-white dark:bg-gray-800 border-transparent text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-200 dark:hover:border-gray-600'}`}>
                            {isSelected ? <CheckSquare size={18} className="text-blue-600 flex-shrink-0"/> : <Square size={18} className="text-gray-300 flex-shrink-0"/>}
                            <div className="flex-1 truncate">
                              <span className={`block ${isSelected ? 'font-bold' : 'font-medium'}`}>{page.name}</span>
                              {tracked && <span className="block text-xs text-gray-500">{tracked}</span>}
                            </div>
                            <Facebook size={16} className="text-[#1877F2] opacity-70" />
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Instagram Accounts Section */}
                  {filteredIgAccounts.length > 0 && (
                    <div className="space-y-1 mt-4">
                      <h4 className="px-2 pb-1 text-xs font-bold text-gray-500 uppercase tracking-wider">Instagram Accounts</h4>
                      {filteredIgAccounts.map((ig) => {
                        const isSelected = selectedIgAccounts.some((p) => p.id === ig.id);
                        const tracked = trackedLabel(ig.id);
                        return (
                          <button key={ig.id} onClick={() => toggleIgSelection(ig)} className={`flex items-center gap-4 w-full text-left px-4 py-3 text-sm transition-all rounded-xl border ${isSelected ? 'bg-fuchsia-50/50 dark:bg-fuchsia-900/20 border-fuchsia-200 dark:border-fuchsia-800 text-gray-900 dark:text-white shadow-sm' : 'bg-white dark:bg-gray-800 border-transparent text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-200 dark:hover:border-gray-600'}`}>
                            {isSelected ? <CheckSquare size={18} className="text-fuchsia-600 flex-shrink-0"/> : <Square size={18} className="text-gray-300 flex-shrink-0"/>}
                            {ig.profile_picture_url ? (
                               <img src={ig.profile_picture_url} alt="" className="w-6 h-6 rounded-full border border-gray-200" />
                            ) : (
                               <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 flex-shrink-0"></div>
                            )}
                            <div className="flex-1 truncate">
                              <span className={`block ${isSelected ? 'font-bold' : 'font-medium'}`}>{ig.name || ig.username}</span>
                              <span className="text-xs text-gray-500">@{ig.username}{tracked && ` · ${tracked}`}</span>
                            </div>
                            <Instagram size={16} className="text-[#E1306C] opacity-70" />
                          </button>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </div>
            
            <div className="p-6 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between shrink-0">
              <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">{totalSelected} selected</span>
              <button onClick={handleConfirmSelection} disabled={totalSelected === 0 || isLoading} className="flex items-center gap-2 rounded-xl bg-[#1877F2] px-6 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-[#166fe5] transition-all disabled:opacity-50">
                {isLoading ? <Loader2 size={16} className="animate-spin" /> : "Import Selected"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Policy Links */}
      <div className="pt-8 mt-8 border-t border-gray-100 dark:border-gray-800 flex items-center justify-center gap-6 text-sm">
        <a href="/privacy" className="text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
          Privacy Policy
        </a>
        <span className="text-gray-300 dark:text-gray-700">•</span>
        <a href="/terms" className="text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
          Terms of Service
        </a>
        <span className="text-gray-300 dark:text-gray-700">•</span>
        <a href="/data-deletion" className="text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
          Data Deletion
        </a>
      </div>
    </div>
  );
}