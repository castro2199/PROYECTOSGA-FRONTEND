import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useAuth } from "../../auth/hooks/useAuth";
import { getMyNotifications, markAllNotificationsRead, markNotificationRead, NotificationRequestError } from "../services/notificationService";
import type { NotificationSettings, SgaNotification } from "../types/notification.types";
import { NotificationContext, type NotificationContextValue } from "./notificationContextValue";

const POLLING_DELAY_MS = 20_000;
const SETTINGS_PREFIX = "sga.notifications.settings.";
function settingsKey(userId: number) { return `${SETTINGS_PREFIX}${userId}`; }
function readSettings(userId: number): NotificationSettings { try { const value = JSON.parse(localStorage.getItem(settingsKey(userId)) ?? "{}") as Partial<NotificationSettings>; return { browserEnabled: Boolean(value.browserEnabled), soundEnabled: value.soundEnabled !== false }; } catch { return { browserEnabled: false, soundEnabled: true }; } }
function sortNotifications(items: SgaNotification[]) { return [...items].sort((left, right) => new Date(right.fecha_envio ?? right.creado_en ?? 0).getTime() - new Date(left.fecha_envio ?? left.creado_en ?? 0).getTime()); }

function playTone(urgent: boolean) {
  const Constructor = window.AudioContext ?? window.webkitAudioContext;
  if (!Constructor) return;
  const context = new Constructor(); const oscillator = context.createOscillator(); const gain = context.createGain();
  oscillator.type = "sine"; oscillator.frequency.setValueAtTime(urgent ? 660 : 520, context.currentTime);
  if (urgent) oscillator.frequency.linearRampToValueAtTime(780, context.currentTime + 0.16);
  gain.gain.setValueAtTime(0.0001, context.currentTime); gain.gain.exponentialRampToValueAtTime(0.045, context.currentTime + 0.02); gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + (urgent ? 0.34 : 0.22));
  oscillator.connect(gain).connect(context.destination); oscillator.start(); oscillator.stop(context.currentTime + (urgent ? 0.36 : 0.24)); oscillator.addEventListener("ended", () => { void context.close(); });
}
declare global { interface Window { webkitAudioContext?: typeof AudioContext; } }

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, user } = useAuth(); const userId = user?.id;
  const [notifications, setNotifications] = useState<SgaNotification[]>([]); const [isLoading, setIsLoading] = useState(true); const [isRefreshing, setIsRefreshing] = useState(false); const [isOffline, setIsOffline] = useState(() => !navigator.onLine); const [error, setError] = useState<string | null>(null); const [toasts, setToasts] = useState<SgaNotification[]>([]); const [settings, setSettings] = useState<NotificationSettings>(() => userId ? readSettings(userId) : { browserEnabled: false, soundEnabled: true });
  const notificationsRef = useRef<SgaNotification[]>([]); const ultimoIdRef = useRef<number | null>(null); const controllerRef = useRef<AbortController | null>(null); const timerRef = useRef<number | null>(null); const sessionRef = useRef(0); const activeUserRef = useRef<number | null>(null); const refreshingRef = useRef(false); const settingsRef = useRef(settings);
  useEffect(() => { settingsRef.current = settings; }, [settings]);
  const replaceNotifications = useCallback((items: SgaNotification[]) => { const next = sortNotifications(items); notificationsRef.current = next; setNotifications(next); }, []);
  const cancelPending = useCallback(() => { if (timerRef.current !== null) window.clearTimeout(timerRef.current); timerRef.current = null; controllerRef.current?.abort(); controllerRef.current = null; refreshingRef.current = false; }, []);
  const persistSettings = useCallback((next: NotificationSettings) => { setSettings(next); if (userId) localStorage.setItem(settingsKey(userId), JSON.stringify(next)); }, [userId]);
  const announce = useCallback((items: SgaNotification[]) => { if (!items.length) return; setToasts((current) => sortNotifications([...items, ...current.filter((item) => !items.some((next) => next.id === item.id))])); const currentSettings = settingsRef.current; if (currentSettings.soundEnabled) playTone(items.some((item) => item.prioridad === "URGENTE")); if (currentSettings.browserEnabled && "Notification" in window && Notification.permission === "granted") new Notification("Nueva notificacion del SGA", { body: "Tienes una notificacion nueva en el sistema.", tag: `sga-${items[items.length - 1].id}` }); }, []);

  const refreshNow = useCallback(async () => {
    if (!isAuthenticated || !navigator.onLine || refreshingRef.current || !ultimoIdRef.current) return;
    const requestSession = sessionRef.current; const controller = new AbortController(); controllerRef.current = controller; refreshingRef.current = true; setIsRefreshing(true);
    try {
      const response = await getMyNotifications({ desdeId: ultimoIdRef.current, limite: 100, signal: controller.signal });
      if (controller.signal.aborted || requestSession !== sessionRef.current || response.items.length === 0) return;
      const known = new Set(notificationsRef.current.map((item) => item.id)); const incoming = response.items.filter((item) => !known.has(item.id));
      if (incoming.length === 0) return;
      const next = [...sortNotifications(incoming), ...notificationsRef.current]; notificationsRef.current = next; setNotifications(next);
      if (response.meta.ultimo_id !== null) ultimoIdRef.current = response.meta.ultimo_id;
      announce(incoming); setError(null);
    } catch (requestError) {
      if (controller.signal.aborted) return;
      if (requestError instanceof NotificationRequestError && requestError.status === 401) setError("Tu sesion expiro. Inicia sesion nuevamente."); else setError(requestError instanceof Error ? requestError.message : "No se pudieron actualizar las notificaciones. Reintentando...");
    } finally { if (controllerRef.current === controller) controllerRef.current = null; refreshingRef.current = false; if (requestSession === sessionRef.current) setIsRefreshing(false); }
  }, [announce, isAuthenticated]);
  const refreshRef = useRef(refreshNow); useEffect(() => { refreshRef.current = refreshNow; }, [refreshNow]);
  const scheduleNext = useCallback(() => { if (!isAuthenticated || !navigator.onLine || timerRef.current !== null) return; timerRef.current = window.setTimeout(async () => { timerRef.current = null; await refreshRef.current(); scheduleNext(); }, POLLING_DELAY_MS); }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated || !userId) return; const requestSession = sessionRef.current + 1; const userChanged = activeUserRef.current !== userId; activeUserRef.current = userId; sessionRef.current = requestSession; cancelPending(); ultimoIdRef.current = null; setToasts([]); setSettings(readSettings(userId)); setError(null); if (userChanged) replaceNotifications([]); setIsLoading(userChanged || notificationsRef.current.length === 0);
    if (!navigator.onLine) { setIsLoading(false); return cancelPending; }
    const controller = new AbortController(); controllerRef.current = controller;
    void getMyNotifications({ limite: 30, signal: controller.signal }).then((response) => { if (controller.signal.aborted || requestSession !== sessionRef.current) return; replaceNotifications(response.items); ultimoIdRef.current = response.meta.ultimo_id; setError(null); }).catch((requestError: unknown) => { if (controller.signal.aborted || requestSession !== sessionRef.current) return; if (requestError instanceof NotificationRequestError && requestError.status === 401) setError("Tu sesion expiro. Inicia sesion nuevamente."); else setError(requestError instanceof Error ? requestError.message : "No se pudieron cargar las notificaciones."); }).finally(() => { if (controllerRef.current === controller) controllerRef.current = null; if (requestSession === sessionRef.current) { setIsLoading(false); scheduleNext(); } });
    return cancelPending;
  }, [cancelPending, isAuthenticated, replaceNotifications, scheduleNext, userId]);
  useEffect(() => { const online = () => { setIsOffline(false); void refreshNow().finally(scheduleNext); }; const offline = () => { setIsOffline(true); if (timerRef.current !== null) window.clearTimeout(timerRef.current); timerRef.current = null; }; const focus = () => { if (navigator.onLine) void refreshNow().finally(scheduleNext); }; window.addEventListener("online", online); window.addEventListener("offline", offline); window.addEventListener("focus", focus); return () => { window.removeEventListener("online", online); window.removeEventListener("offline", offline); window.removeEventListener("focus", focus); }; }, [refreshNow, scheduleNext]);
  const markRead = useCallback(async (id: number) => { await markNotificationRead(id); const next = notificationsRef.current.map((item) => item.id === id ? { ...item, leida: true, fecha_lectura: item.fecha_lectura ?? new Date().toISOString() } : item); notificationsRef.current = next; setNotifications(next); }, []);
  const markAllRead = useCallback(async () => { await markAllNotificationsRead(); const date = new Date().toISOString(); const next = notificationsRef.current.map((item) => ({ ...item, leida: true, fecha_lectura: item.fecha_lectura ?? date })); notificationsRef.current = next; setNotifications(next); }, []);
  const requestBrowserNotifications = useCallback(async (): Promise<NotificationPermission | "unsupported"> => { if (!("Notification" in window)) return "unsupported"; const permission = await Notification.requestPermission(); persistSettings({ ...settingsRef.current, browserEnabled: permission === "granted" }); return permission; }, [persistSettings]);
  const value = useMemo<NotificationContextValue>(() => ({ error, isLoading, isRefreshing, isOffline, markAllRead, markRead, notifications, refresh: refreshNow, settings, toasts, unreadCount: notifications.filter((item) => !item.leida).length, dismissToast: (id) => setToasts((current) => current.filter((item) => item.id !== id)), setSoundEnabled: (enabled) => persistSettings({ ...settingsRef.current, soundEnabled: enabled }), requestBrowserNotifications }), [error, isLoading, isRefreshing, isOffline, markAllRead, markRead, notifications, persistSettings, refreshNow, requestBrowserNotifications, settings, toasts]);
  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}
