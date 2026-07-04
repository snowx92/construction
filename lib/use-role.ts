"use client";

import { useAuth } from "./auth-context";
import { hasPermission, type PermissionKey } from "./permissions";
import type { UserRole } from "./api/types";

const RANK: Record<UserRole, number> = {
  company_owner:  100,
  admin:          90,
  tender_manager: 70,
  estimator:      60,
  finance:        60,
  legal:          60,
  planner:        60,
  read_only:      10,
};

/** Prefer membership/profile role over stale custom claims. */
export function useEffectiveRole(): UserRole | null {
  const { role, profile } = useAuth();
  return profile?.role ?? role ?? null;
}

/** Returns true if the current user's role is at least the given role's rank. */
export function useHasRole(min: UserRole): boolean {
  const effective = useEffectiveRole();
  if (!effective) return false;
  return (RANK[effective] ?? 0) >= (RANK[min] ?? 0);
}

/** Returns true if user has exactly any of the listed roles. */
export function useIsOneOf(...roles: UserRole[]): boolean {
  const effective = useEffectiveRole();
  return effective ? roles.includes(effective) : false;
}

/** Backend permission gate — mirrors permissionsHelper.js. */
export function usePermission(permission: PermissionKey): boolean {
  return hasPermission(useEffectiveRole(), permission);
}

/** Owner/admin gate — used for settings & operations surfaces. */
export function useIsAdmin(): boolean {
  return useIsOneOf("company_owner", "admin");
}
