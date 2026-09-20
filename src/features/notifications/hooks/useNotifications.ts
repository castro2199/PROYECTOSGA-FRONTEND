import { useContext } from "react";
import { NotificationContext } from "../context/notificationContextValue";

export function useNotifications() {
  const value = useContext(NotificationContext);
  if (!value) throw new Error("useNotifications debe usarse dentro de NotificationProvider.");
  return value;
}
