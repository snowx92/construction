import { apiFetch } from "./client";

export interface AppNotification {
  id: string;
  type?: string;
  severity?: string;
  title?: string;
  message?: string;
  projectId?: string;
  relatedEntityRef?: string;
  read?: boolean;
  createdAt?: { _seconds: number; _nanoseconds: number } | string;
}

export function listNotifications(companyId: string, limit = 50) {
  return apiFetch<{ notifications: AppNotification[] }>("/api/users/notifications", {
    query: { companyId, limit },
  }).then((d) => d.notifications ?? []);
}

export function markNotificationRead(notificationId: string, companyId: string) {
  return apiFetch<{ notificationId: string }>(
    `/api/users/notifications/${notificationId}/read`,
    { method: "POST", body: { companyId } },
  );
}

export function markAllNotificationsRead(companyId: string) {
  return apiFetch<{ count: number }>("/api/users/notifications/read-all", {
    method: "POST",
    body: { companyId },
  });
}
