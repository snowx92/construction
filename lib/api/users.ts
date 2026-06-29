import { apiFetch } from "./client";
import type { UpdateUserProfileBody, UserProfile } from "./types";

export function getMyProfile() {
  return apiFetch<UserProfile>("/api/users/profile");
}

export function updateMyProfile(body: UpdateUserProfileBody) {
  return apiFetch<UserProfile>("/api/users/profile", { method: "PUT", body });
}
