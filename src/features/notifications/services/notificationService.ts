import { authFetch } from "../../auth/services/authService";
import type {
  NotificationRecipient,
  NotificationsResponse,
  SgaNotification,
} from "../types/notification.types";

export class NotificationRequestError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "NotificationRequestError";
    this.status = status;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function messageFrom(data: unknown, fallback: string) {
  if (!isRecord(data)) return fallback;
  for (const key of ["detail", "message", "error"]) {
    if (typeof data[key] === "string" && data[key].trim()) return data[key];
  }
  for (const value of Object.values(data)) {
    if (Array.isArray(value) && typeof value[0] === "string") return value[0];
    if (typeof value === "string" && value.trim()) return value;
  }
  return fallback;
}

function asNotification(value: unknown): SgaNotification | null {
  if (!isRecord(value) || !Number.isFinite(Number(value.id))) return null;
  return {
    id: Number(value.id),
    destinatario_label: String(value.destinatario_label ?? ""),
    destinatario_rol: String(value.destinatario_rol ?? ""),
    enviado_por_label: String(value.enviado_por_label ?? ""),
    tipo: String(value.tipo ?? ""),
    tipo_label: String(value.tipo_label ?? value.tipo ?? ""),
    prioridad: String(value.prioridad ?? "MEDIA"),
    prioridad_label: String(value.prioridad_label ?? value.prioridad ?? "Media"),
    titulo: String(value.titulo ?? "Notificacion"),
    mensaje: String(value.mensaje ?? ""),
    accion_url: typeof value.accion_url === "string" ? value.accion_url : null,
    datos: value.datos ?? null,
    estado_envio: String(value.estado_envio ?? ""),
    fecha_envio: typeof value.fecha_envio === "string" ? value.fecha_envio : null,
    fecha_lectura: typeof value.fecha_lectura === "string" ? value.fecha_lectura : null,
    leida: Boolean(value.leida ?? value.fecha_lectura),
    creado_en: typeof value.creado_en === "string" ? value.creado_en : null,
    detalle_error: typeof value.detalle_error === "string" ? value.detalle_error : null,
  };
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await authFetch(path, init);
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new NotificationRequestError(messageFrom(data, "No se pudo completar la solicitud."), response.status);
  return data as T;
}

export async function getMyNotifications(options: { desdeId?: number; limite: number; signal?: AbortSignal }): Promise<NotificationsResponse> {
  const params = new URLSearchParams({ limite: String(options.limite) });
  if (options.desdeId) params.set("desde_id", String(options.desdeId));
  const data = await request<unknown>(`/api/notificaciones/mias/?${params}`, { signal: options.signal });
  const source = isRecord(data) ? data : {};
  const rawItems = Array.isArray(data) ? data : Array.isArray(source.results) ? source.results : Array.isArray(source.items) ? source.items : Array.isArray(source.notificaciones) ? source.notificaciones : [];
  const rawMeta = isRecord(source.meta) ? source.meta : {};
  return {
    items: rawItems.map(asNotification).filter((item): item is SgaNotification => Boolean(item)),
    meta: {
      ultimo_id: Number.isFinite(Number(rawMeta.ultimo_id)) ? Number(rawMeta.ultimo_id) : null,
      intervalo_polling_segundos: Number.isFinite(Number(rawMeta.intervalo_polling_segundos)) ? Number(rawMeta.intervalo_polling_segundos) : null,
    },
  };
}

export function markNotificationRead(id: number) {
  return request<unknown>(`/api/notificaciones/mias/${id}/marcar-leida/`, { method: "POST" });
}

export function markAllNotificationsRead() {
  return request<unknown>("/api/notificaciones/mias/marcar-todas-leidas/", { method: "POST" });
}

export async function getInstitutionalNotifications() {
  const data = await request<unknown>("/api/notificaciones/");
  const source = isRecord(data) ? data : {};
  const rawItems = Array.isArray(data) ? data : Array.isArray(source.results) ? source.results : Array.isArray(source.items) ? source.items : [];
  return rawItems.map(asNotification).filter((item): item is SgaNotification => Boolean(item));
}

export async function getTeacherRecipients(filters: Record<string, string>, signal?: AbortSignal) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => { if (value.trim()) params.set(key, value); });
  const data = await request<unknown>(`/api/docente/notificaciones/destinatarios/${params.toString() ? `?${params}` : ""}`, { signal });
  const source = isRecord(data) ? data : {};
  const rawItems = Array.isArray(data) ? data : Array.isArray(source.results) ? source.results : Array.isArray(source.items) ? source.items : [];
  return rawItems.flatMap((item): NotificationRecipient[] => {
    if (!isRecord(item) || !Number.isFinite(Number(item.id))) return [];
    return [{ id: Number(item.id), label: String(item.label ?? item.nombre ?? item.destinatario_label ?? "Destinatario"), rol: String(item.rol ?? item.role ?? item.destinatario_rol ?? "") }];
  });
}

export function sendTeacherNotification(payload: Record<string, unknown>) {
  return request<Record<string, unknown>>("/api/docente/notificaciones/enviar/", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
}

export async function getTeacherSentNotifications() {
  const data = await request<unknown>("/api/docente/notificaciones/enviadas/");
  const source = isRecord(data) ? data : {};
  const rawItems = Array.isArray(data) ? data : Array.isArray(source.results) ? source.results : Array.isArray(source.items) ? source.items : [];
  return rawItems.map(asNotification).filter((item): item is SgaNotification => Boolean(item));
}
