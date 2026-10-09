"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { apiClient } from "@/lib/api";
import {
  canView as roleCanView,
  hasRole,
  inSection,
  isRole,
  type AppSection,
  type UserRole,
} from "@/lib/access";

export type { UserRole } from "@/lib/access";

interface RoleContextValue {
  role: UserRole;
  /** Signed-in address, once /api/auth/me has answered. */
  email: string;
  loading: boolean;
  /** False when neither the cookie nor the API could say who this is. */
  known: boolean;
  canAccess: (minRole: UserRole) => boolean;
  /** Whether this person works in the Social Media or Critical Flow half of the app. */
  canUse: (section: AppSection) => boolean;
  canView: (pathname: string) => boolean;
}

const RoleContext = createContext<RoleContextValue>({
  role: "user",
  email: "",
  loading: true,
  known: false,
  canAccess: () => false,
  canUse: () => false,
  canView: () => false,
});

export function RoleProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<UserRole>("user");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [known, setKnown] = useState(false);

  useEffect(() => {
    // Read role from cookie first for instant hydration
    const cookieRole = document.cookie
      .split("; ")
      .find((c) => c.startsWith("user_role="))
      ?.split("=")[1];

    if (isRole(cookieRole)) {
      setRole(cookieRole);
      setKnown(true);
      setLoading(false);
    }

    apiClient
      .get("/api/auth/me")
      .then((res) => {
        if (isRole(res.data.role)) {
          setRole(res.data.role);
          setKnown(true);
        }
        if (typeof res.data.email === "string") setEmail(res.data.email);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const canAccess = (minRole: UserRole) => hasRole(role, minRole);
  const canUse = (section: AppSection) => inSection(role, section);
  // With the API unreachable there is no role to filter by. Pages are left
  // visible so each shows its own error, rather than a false "no access".
  const canView = (pathname: string) => (known ? roleCanView(role, pathname) : !loading);

  return (
    <RoleContext.Provider value={{ role, email, loading, known, canAccess, canUse, canView }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  return useContext(RoleContext);
}
