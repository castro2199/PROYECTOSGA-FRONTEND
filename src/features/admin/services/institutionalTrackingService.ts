import { authFetch } from "../../auth/services/authService";
import type { AIRecommendation } from "../types/aiRecommendation.types";
import type { Incident } from "../types/incident.types";
import type { Observation } from "../types/observation.types";
import type {
  TeacherTrackingDetail,
  TeacherTrackingSummary,
} from "../types/institutionalTracking.types";
import { formatApiObject } from "../utils/apiMessages";

const TEACHERS_TRACKING_URL = "/api/administracion/seguimiento/docentes/";

type PaginatedResponse<T> = { next?: string | null; results?: T[] };

async function readError(response: Response) {
  const data = await response.json().catch(() => null);
  if (data && typeof data === "object") {
    const message = formatApiObject(data as Record<string, unknown>);
    if (message) return message;
  }
  if (response.status === 401) return "Tu sesion ha expirado. Inicia sesion nuevamente.";
  if (response.status === 403) return "No tienes permiso para consultar el seguimiento institucional.";
  if (response.status === 404) return "No se encontro el recurso de seguimiento solicitado.";
  return "No se pudo cargar la informacion de seguimiento.";
}

function queryPath(path: string, teacherId?: number) {
  if (!teacherId) return path;
  return `${path}?docente=${encodeURIComponent(teacherId)}`;
}

async function fetchAll<T>(token: string, path: string, signal?: AbortSignal) {
  let next: string | null = path;
  const records: T[] = [];
  const visited = new Set<string>();

  while (next && !visited.has(next)) {
    visited.add(next);
    const response = await authFetch(next, {
      headers: { Authorization: `Bearer ${token}` },
      signal,
    });
    if (!response.ok) throw new Error(await readError(response));
    const data = (await response.json()) as PaginatedResponse<T> | T[];
    if (Array.isArray(data)) return [...records, ...data];
    records.push(...(data.results ?? []));
    next = data.next ?? null;
  }
  return records;
}

function value(input: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    const candidate = input[key];
    if (candidate !== undefined && candidate !== null) return candidate;
  }
  return null;
}

function numberValue(input: Record<string, unknown>, ...keys: string[]) {
  const result = Number(value(input, ...keys));
  return Number.isFinite(result) ? result : 0;
}

function textValue(input: Record<string, unknown>, ...keys: string[]) {
  const result = value(input, ...keys);
  return typeof result === "string" ? result : result == null ? "" : String(result);
}

function normalizeTeacher(input: unknown): TeacherTrackingSummary {
  const data = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
  const teacher = (value(data, "docente") && typeof value(data, "docente") === "object"
    ? value(data, "docente")
    : data) as Record<string, unknown>;
  return {
    activo: Boolean(value(data, "activo", "is_active") ?? value(teacher, "activo", "is_active")),
    asignaciones_activas: numberValue(data, "asignaciones_activas", "active_assignments"),
    docente_id: numberValue(data, "docente_id", "id", "docente"),
    docente_nombre: textValue(data, "docente_nombre", "docente_label", "full_name", "nombre") || textValue(teacher, "full_name", "nombre", "docente_nombre"),
    dni: textValue(data, "dni", "dni_display") || textValue(teacher, "dni", "dni_display"),
    email: textValue(data, "email", "email_display") || textValue(teacher, "email", "email_display"),
    incidencias_abiertas: numberValue(data, "incidencias_abiertas", "open_incidents"),
    observaciones: numberValue(data, "observaciones", "observations"),
    recomendaciones_pendientes: numberValue(data, "recomendaciones_pendientes", "pending_recommendations"),
    username: textValue(data, "username", "username_display") || textValue(teacher, "username", "username_display"),
  };
}

export async function getTeacherTrackingSummaries(token: string, signal?: AbortSignal) {
  const records = await fetchAll<unknown>(token, TEACHERS_TRACKING_URL, signal);
  return records.map(normalizeTeacher);
}

export async function getTeacherTrackingDetail(token: string, teacherId: number, signal?: AbortSignal): Promise<TeacherTrackingDetail> {
  const response = await authFetch(`${TEACHERS_TRACKING_URL}${teacherId}/`, {
    headers: { Authorization: `Bearer ${token}` },
    signal,
  });
  if (!response.ok) throw new Error(await readError(response));
  const data = (await response.json()) as Record<string, unknown>;
  const assignments = Array.isArray(data.asignaciones)
    ? data.asignaciones
    : Array.isArray(data.cursos_asignados)
      ? data.cursos_asignados
      : [];
  return {
    ...normalizeTeacher(data),
    asignaciones: assignments.map((assignment) => {
      const item = assignment as Record<string, unknown>;
      return {
        anio: textValue(item, "anio", "anio_academico", "anio_academico_label"),
        curso: textValue(item, "curso", "curso_nombre", "curso_label"),
        grado: textValue(item, "grado", "grado_nombre", "grado_label"),
        seccion: textValue(item, "seccion", "seccion_nombre", "seccion_label"),
      };
    }),
  };
}

export function getTrackingObservations(token: string, teacherId?: number, signal?: AbortSignal) {
  return fetchAll<Observation>(token, queryPath("/api/observaciones/", teacherId), signal);
}

export function getTrackingIncidents(token: string, teacherId?: number, signal?: AbortSignal) {
  return fetchAll<Incident>(token, queryPath("/api/incidencias/", teacherId), signal);
}

export function getTrackingRecommendations(token: string, teacherId?: number, signal?: AbortSignal) {
  return fetchAll<AIRecommendation>(token, queryPath("/api/recomendaciones-ia/", teacherId), signal);
}
