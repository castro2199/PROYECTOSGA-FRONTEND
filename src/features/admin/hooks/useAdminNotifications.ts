import { useCallback, useEffect, useState } from "react";
import {
  createAdminNotification,
  getAdminNotifications,
  resendAdminNotification,
} from "../services/notificationsService";
import type {
  AdminNotification,
  AdminNotificationPayload,
} from "../types/notification.types";

export function useAdminNotifications(token: string) {
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const reload = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setNotifications(await getAdminNotifications(token));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "No se pudo cargar las notificaciones.");
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const send = async (payload: AdminNotificationPayload) => {
    setIsSaving(true);
    setError(null);
    try {
      const notification = await createAdminNotification(token, payload);
      await reload();
      return notification;
    } catch (sendError) {
      const message = sendError instanceof Error ? sendError.message : "No se pudo enviar la notificacion.";
      setError(message);
      throw new Error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const resend = async (id: number) => {
    setIsSaving(true);
    setError(null);
    try {
      const notification = await resendAdminNotification(token, id);
      await reload();
      return notification;
    } catch (sendError) {
      const message = sendError instanceof Error ? sendError.message : "No se pudo reenviar la notificacion.";
      setError(message);
      throw new Error(message);
    } finally {
      setIsSaving(false);
    }
  };

  return { error, isLoading, isSaving, notifications, reload, resend, send };
}
