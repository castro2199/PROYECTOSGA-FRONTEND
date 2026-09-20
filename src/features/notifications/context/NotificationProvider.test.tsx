import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { NotificationProvider } from "./NotificationProvider";
import { useNotifications } from "../hooks/useNotifications";

const mocks = vi.hoisted(() => ({
  getMyNotifications: vi.fn(),
  markNotificationRead: vi.fn(),
  markAllNotificationsRead: vi.fn(),
}));
const { getMyNotifications, markNotificationRead, markAllNotificationsRead } = mocks;

vi.mock("../../auth/hooks/useAuth", () => ({
  useAuth: () => ({ isAuthenticated: true, user: { id: 7 } }),
}));
vi.mock("../services/notificationService", async (importOriginal) => {
  const original = await importOriginal<typeof import("../services/notificationService")>();
  return { ...original, getMyNotifications: mocks.getMyNotifications, markNotificationRead: mocks.markNotificationRead, markAllNotificationsRead: mocks.markAllNotificationsRead };
});

function item(id: number, priority = "MEDIA") {
  return { id, destinatario_label: "Usuario", destinatario_rol: "Docente", enviado_por_label: "SGA", tipo: "GENERAL", tipo_label: "General", prioridad: priority, prioridad_label: priority, titulo: `Aviso ${id}`, mensaje: "Mensaje", accion_url: null, estado_envio: "ENVIADA", fecha_envio: "2026-01-01T10:00:00Z", fecha_lectura: null, leida: false, creado_en: null, detalle_error: null };
}

function Probe() {
  const notifications = useNotifications();
  return <><p data-testid="count">{notifications.unreadCount}</p><p data-testid="toasts">{notifications.toasts.length}</p><button onClick={() => void notifications.markRead(1)} type="button">read</button><button onClick={() => void notifications.markAllRead()} type="button">all</button><button onClick={() => void notifications.requestBrowserNotifications()} type="button">permission</button></>;
}

describe("NotificationProvider", () => {
  afterEach(() => { cleanup(); vi.useRealTimers(); vi.clearAllMocks(); localStorage.clear(); });

  it("deduplicates polling results and keeps the unread counter accurate", async () => {
    vi.useFakeTimers();
    getMyNotifications.mockResolvedValueOnce({ items: [item(1)], meta: { ultimo_id: 1, intervalo_polling_segundos: 10 } }).mockResolvedValueOnce({ items: [item(1), item(2)], meta: { ultimo_id: 2, intervalo_polling_segundos: 10 } });
    render(<NotificationProvider><Probe /></NotificationProvider>);
    await act(async () => { await Promise.resolve(); });
    expect(screen.getByTestId("count").textContent).toBe("1");
    await act(async () => { vi.advanceTimersByTime(20_000); await Promise.resolve(); });
    expect(screen.getByTestId("count").textContent).toBe("2");
    expect(screen.getByTestId("toasts").textContent).toBe("1");
  });

  it("marks individual and all notifications as read", async () => {
    getMyNotifications.mockResolvedValue({ items: [item(1), item(2)], meta: { ultimo_id: 2, intervalo_polling_segundos: 60 } });
    markNotificationRead.mockResolvedValue({}); markAllNotificationsRead.mockResolvedValue({});
    render(<NotificationProvider><Probe /></NotificationProvider>);
    await act(async () => { await Promise.resolve(); });
    await act(async () => { screen.getByText("read").click(); await Promise.resolve(); });
    expect(markNotificationRead).toHaveBeenCalledWith(1);
    expect(screen.getByTestId("count").textContent).toBe("1");
    await act(async () => { screen.getByText("all").click(); await Promise.resolve(); });
    expect(markAllNotificationsRead).toHaveBeenCalledOnce();
    expect(screen.getByTestId("count").textContent).toBe("0");
  });

  it("requests browser permission only after an explicit action", async () => {
    const requestPermission = vi.fn().mockResolvedValue("granted");
    Object.defineProperty(window, "Notification", { configurable: true, value: { permission: "default", requestPermission } });
    getMyNotifications.mockResolvedValue({ items: [], meta: { ultimo_id: null, intervalo_polling_segundos: 60 } });
    render(<NotificationProvider><Probe /></NotificationProvider>);
    await act(async () => { await Promise.resolve(); });
    expect(requestPermission).not.toHaveBeenCalled();
    await act(async () => { screen.getByText("permission").click(); await Promise.resolve(); });
    expect(requestPermission).toHaveBeenCalledOnce();
  });
});
