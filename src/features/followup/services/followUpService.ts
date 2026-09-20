import { formatApiObject } from "../../admin/utils/apiMessages";
import { authFetch } from "../../auth/services/authService";

export type FollowUpRole = "teacher" | "student" | "guardian" | "admin";
export type FollowUpStatus = "PENDIENTE" | "EN_PROGRESO" | "COMPLETADA" | "CANCELADA";
export type FollowUpPriority = "BAJA" | "NORMAL" | "ALTA" | "URGENTE";
export type FollowUpResponsible = "DOCENTE" | "ESTUDIANTE" | "APODERADO" | "COMPARTIDA";
export type FollowUpUpdateType = "COMENTARIO" | "AVANCE" | "EVIDENCIA";

export type FollowUpUpdate = { id: number; autor_nombre: string; tipo: FollowUpUpdateType; tipo_label: string; comentario: string; progreso: number | null; creado_en: string };
export type FollowUpAction = { id: number; matricula: number; estudiante_id: number; estudiante_codigo: string; estudiante_nombre: string; asignacion_curso: number; curso_nombre: string; grado_nombre: string; seccion_nombre: string; periodo_academico: number | null; periodo_nombre: string | null; docente: number; docente_nombre: string; tipo: string; tipo_label: string; responsable: FollowUpResponsible; responsable_label: string; prioridad: FollowUpPriority; prioridad_label: string; titulo: string; descripcion: string; estado: FollowUpStatus; estado_label: string; fecha_limite: string | null; fecha_completada: string | null; resultado: string | null; visible_estudiante: boolean; visible_apoderado: boolean; vencida: boolean; actualizaciones: FollowUpUpdate[]; creado_en: string; actualizado_en: string };
export type CreateFollowUpPayload = { matricula_id: number; asignacion_curso_id: number; periodo_academico_id?: number | null; tipo: string; responsable: FollowUpResponsible; prioridad: FollowUpPriority; titulo: string; descripcion: string; fecha_limite: string; visible_estudiante: boolean; visible_apoderado: boolean; notificar_destinatarios: boolean };
export type FollowUpFilters = Record<string, string | number | boolean | undefined>;

const endpoints: Record<FollowUpRole, string> = { teacher: "/api/docente/acciones-seguimiento/", student: "/api/estudiante/acciones-seguimiento/", guardian: "/api/apoderado/acciones-seguimiento/", admin: "/api/administracion/acciones-seguimiento/" };

function message(data: unknown, fallback: string) {
  if (data && typeof data === "object") return formatApiObject(data as Record<string, unknown>) || fallback;
  return fallback;
}
async function request<T>(path: string, init?: RequestInit) {
  const response = await authFetch(path, init);
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(message(data, response.status === 403 ? "No tienes permiso para acceder a este recurso." : "No se pudo completar la solicitud."));
  return data as T;
}
function items(data: unknown): FollowUpAction[] {
  if (Array.isArray(data)) return data as FollowUpAction[];
  if (data && typeof data === "object") { const record = data as Record<string, unknown>; const value = record.results ?? record.items ?? record.data; return Array.isArray(value) ? value as FollowUpAction[] : []; }
  return [];
}
function query(filters: FollowUpFilters) { const params = new URLSearchParams(); Object.entries(filters).forEach(([key, value]) => { if (value !== undefined && value !== "") params.set(key, String(value)); }); return params.toString() ? `?${params}` : ""; }

export async function getFollowUpActions(role: FollowUpRole, filters: FollowUpFilters = {}) { return items(await request<unknown>(`${endpoints[role]}${query(filters)}`)); }
export function createFollowUpAction(payload: CreateFollowUpPayload) { return request<FollowUpAction>(endpoints.teacher, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }); }
export function updateFollowUpAction(id: number, payload: Partial<Pick<FollowUpAction, "estado" | "resultado" | "titulo" | "descripcion" | "fecha_limite" | "prioridad" | "responsable" | "visible_estudiante" | "visible_apoderado">>) { return request<FollowUpAction>(`${endpoints.teacher}${id}/`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }); }
export function addFollowUpUpdate(role: Exclude<FollowUpRole, "admin">, id: number, payload: { tipo: FollowUpUpdateType; comentario: string; progreso?: number | null }) { return request<FollowUpUpdate>(`${endpoints[role]}${id}/actualizaciones/`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }); }
export function getTeacherTracking(courseId?: number) { return request<unknown>(`/api/docente/seguimiento/${courseId ? `?asignacion_curso=${courseId}` : ""}`); }
export function getTeacherTrackingDetail(matriculaId: number, courseId: number) { return request<unknown>(`/api/docente/seguimiento/${matriculaId}/?asignacion_curso=${courseId}`); }
