"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loader2, LogOut, ShieldCheck } from "lucide-react";
import { useRole } from "@/hooks/useRole";
import { homeFor } from "@/lib/access";
import { logoutUser } from "@/lib/api";

/**
 * Keeps a page from mounting for someone whose role does not cover it — the
 * API would refuse every request the page makes anyway. They are sent to their
 * own section, or told to wait if they have not been given one.
 */
export default function AccessGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { role, email, loading, known, canView } = useRole();
  const [signingOut, setSigningOut] = useState(false);

  const allowed = canView(pathname);
  const home = known ? homeFor(role) : null;

  useEffect(() => {
    if (!loading && !allowed && home) router.replace(home);
  }, [loading, allowed, home, router]);

  if (loading) return null;
  if (allowed) return <>{children}</>;
  if (home) return null;

  const signOut = async () => {
    setSigningOut(true);
    try {
      await logoutUser();
      router.push("/login");
      router.refresh();
    } catch {
      setSigningOut(false);
    }
  };

  return (
    <div className="mx-auto mt-16 max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-center dark:border-gray-800 dark:bg-gray-900">
      <ShieldCheck className="mx-auto mb-3 h-8 w-8 text-gray-300 dark:text-gray-600" />
      <h2 className="text-sm font-semibold text-gray-900 dark:text-white">No access yet</h2>
      <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
        {email ? `${email} is signed in, but` : "You are signed in, but"} this account has not been added to
        Social Media or Critical Flow. Ask the super user to give you access, then reload this page.
      </p>
      <button
        onClick={signOut}
        disabled={signingOut}
        className="mt-5 inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-bold text-gray-700 shadow-sm transition-all hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
      >
        {signingOut ? <Loader2 size={16} className="animate-spin" /> : <LogOut size={16} />}
        Sign Out
      </button>
    </div>
  );
}
