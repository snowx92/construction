import { apiFetch } from "./client";
import type { ChangePasswordBody, UpdateUserProfileBody, UserProfile } from "./types";

export function getMyProfile() {
  return apiFetch<UserProfile>("/api/users/profile");
}

export function updateMyProfile(body: UpdateUserProfileBody) {
  return apiFetch<UserProfile>("/api/users/profile", { method: "PUT", body });
}

export function changeMyPassword(body: ChangePasswordBody) {
  return apiFetch<{ updated: boolean }>("/api/users/profile/password", {
    method: "PUT",
    body,
  });
}
