import { createContext } from "react";
import type { NotificationSettings, SgaNotification } from "../types/notification.types";

export type NotificationContextValue = {
  error: string | null;
  isLoading: boolean;
  isRefreshing: boolean;
  isOffline: boolean;
  markAllRead: () => Promise<void>;
  markRead: (id: number) => Promise<void>;
  notifications: SgaNotification[];
  refresh: (limit?: number) => Promise<void>;
  settings: NotificationSettings;
  toasts: SgaNotification[];
  dismissToast: (id: number) => void;
  setSoundEnabled: (enabled: boolean) => void;
  requestBrowserNotifications: () => Promise<NotificationPermission | "unsupported">;
  unreadCount: number;
};

export const NotificationContext = createContext<NotificationContextValue | null>(null);
