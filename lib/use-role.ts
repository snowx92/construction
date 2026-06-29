"use client";

import { useAuth } from "./auth-context";
import type { UserRole } from "./api/types";

const RANK: Record<UserRole, number> = {
  company_owner:  100,
  admin:          90,
  tender_manager: 70,
  estimator:      60,
  finance:        60,
  legal:          60,
};

/** Returns true if the current user's role is at least the given role's rank. */
export function useHasRole(min: UserRole): boolean {
  const { role } = useAuth();
  if (!role) return false;
  return RANK[role] >= RANK[min];
}

/** Returns true if user has exactly any of the listed roles. */
export function useIsOneOf(...roles: UserRole[]): boolean {
  const { role } = useAuth();
  return role ? roles.includes(role) : false;
}

/** Owner/admin gate — used for settings & operations surfaces. */
export function useIsAdmin(): boolean {
  return useIsOneOf("company_owner", "admin");
}
