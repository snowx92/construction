"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "./firebase";
import { getMyProfile } from "./api/users";
import type { UserProfile, UserRole } from "./api/types";

interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  /** Active-company role pulled from Firebase custom claims, if present. */
  role: UserRole | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  refreshClaims: () => Promise<void>;
  setProfile: (p: UserProfile | null) => void;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  profile: null,
  role: null,
  loading: true,
  refreshProfile: async () => {},
  refreshClaims: async () => {},
  setProfile: () => {},
});

function extractRole(claims: Record<string, unknown>, activeCompanyId?: string | null): UserRole | null {
  if (!claims) return null;
  // Try common shapes the backend might use
  const direct = claims.role as UserRole | undefined;
  if (direct && typeof direct === "string") return direct;
  const companies = claims.companies as Record<string, { role?: UserRole }> | undefined;
  if (companies && activeCompanyId && companies[activeCompanyId]?.role) {
    return companies[activeCompanyId].role as UserRole;
  }
  const roles = claims.roles as Record<string, UserRole> | undefined;
  if (roles && activeCompanyId && roles[activeCompanyId]) return roles[activeCompanyId];
  return null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = useCallback(async () => {
    try {
      const p = await getMyProfile();
      setProfile(p);
    } catch {
      setProfile(null);
    }
  }, []);

  const refreshClaims = useCallback(async () => {
    const u = auth.currentUser;
    if (!u) {
      setRole(null);
      return;
    }
    const res = await u.getIdTokenResult(true);
    setRole(extractRole(res.claims as Record<string, unknown>, profile?.activeCompanyId));
  }, [profile?.activeCompanyId]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        await refreshProfile();
        try {
          const res = await u.getIdTokenResult();
          setRole(extractRole(res.claims as Record<string, unknown>));
        } catch {
          setRole(null);
        }
      } else {
        setProfile(null);
        setRole(null);
      }
      setLoading(false);
    });
    return unsub;
  }, [refreshProfile]);

  // Recompute role when profile's activeCompanyId changes
  useEffect(() => {
    if (!user || !profile?.activeCompanyId) return;
    user.getIdTokenResult().then((res) => {
      setRole(extractRole(res.claims as Record<string, unknown>, profile.activeCompanyId));
    });
  }, [user, profile?.activeCompanyId]);

  return (
    <AuthContext.Provider value={{ user, profile, role, loading, refreshProfile, refreshClaims, setProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
