import { authFetch } from "../../auth/services/authService";
import type {
  AdminNotification,
  AdminNotificationPayload,
} from "../types/notification.types";
import { formatApiObject } from "../utils/apiMessages";
import { fetchAllPages } from "../utils/pagination";

const NOTIFICATIONS_URL = "/api/notificaciones/";

async function readError(response: Response) {
  const data = await response.json().catch(() => null);
  if (data && typeof data === "object") {
    const message = formatApiObject(data as Record<string, unknown>);
    if (message) return message;
  }
  return "No se pudo completar la operacion de notificaciones.";
}

export function getAdminNotifications(token: string) {
  return fetchAllPages<AdminNotification>(NOTIFICATIONS_URL, token, readError);
}

export async function createAdminNotification(
  token: string,
  payload: AdminNotificationPayload,
) {
  const response = await authFetch(NOTIFICATIONS_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) throw new Error(await readError(response));
  return (await response.json()) as AdminNotification;
}

export async function resendAdminNotification(token: string, id: number) {
  const response = await authFetch(`${NOTIFICATIONS_URL}${id}/reenviar/`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) throw new Error(await readError(response));
  return (await response.json()) as AdminNotification;
}
