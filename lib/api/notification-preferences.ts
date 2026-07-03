import { apiFetch } from "./client";

export interface NotificationPreferences {
  email?: Record<string, boolean>;
  inApp?: Record<string, boolean>;
  digestFrequency?: "off" | "daily" | "weekly";
}

export function getNotificationPreferences() {
  return apiFetch<{ preferences: NotificationPreferences }>("/api/notifications/preferences");
}

export function updateNotificationPreferences(preferences: NotificationPreferences) {
  return apiFetch<{ preferences: NotificationPreferences; updated: boolean }>(
    "/api/notifications/preferences",
    { method: "PUT", body: preferences },
  );
}
