import { formatApiObject } from "../../admin/utils/apiMessages";
import { authFetch } from "../../auth/services/authService";

export type GuardianModuleKey =
  | "students"
  | "attendance"
  | "grades"
  | "tracking"
  | "notifications";

export type GuardianStudent = {
  id: number;
  estudiante_id: number;
  codigo_estudiante: string;
  estudiante_nombre: string;
  parentesco: string;
  parentesco_label: string;
  es_principal: boolean;
  matriculas_activas: string;
  matriculas_activas_detalle: unknown;
};

export type GuardianCourse = {
  id: number;
  curso_nombre: string;
  asistencias: number;
  calificaciones: number;
};

export type GuardianAttendance = {
  id: number;
  matricula_id: number;
  estudiante_id: number;
  estudiante_codigo: string;
  estudiante_nombre: string;
  asignacion_curso_id: number;
  curso_nombre: string;
  fecha: string;
  estado: "PRESENTE" | "TARDE" | "FALTA" | "JUSTIFICADA";
  estado_label: string;
  justificacion: string | null;
};

export type GuardianGrade = {
  id: number;
  estudiante_id: number;
  estudiante_codigo: string;
  estudiante_nombre: string;
  asignacion_curso_id: number;
  curso_nombre: string;
  periodo_academico_id: number;
  periodo_nombre: string;
  criterio_calificacion_id: number;
  criterio_nombre: string;
  competencia_nombre: string;
  valor: "AD" | "A" | "B" | "C";
  valor_label: string;
  observacion: string | null;
};

export type GuardianNotification = {
  id: number;
  estudiante_label: string;
  estudiante_codigo: string;
  titulo: string;
  mensaje: string;
  estado_envio: string;
  fecha_envio: string | null;
  fecha_lectura: string | null;
  incidencia_label: string;
  activo: boolean;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function extractGuardianItems<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data.filter(isRecord) as T[];
  if (!isRecord(data)) return [];

  const items =
    data.results ??
    data.items ??
    data.data ??
    data.estudiantes ??
    data.registros ??
    data.detalle;

  return Array.isArray(items) ? (items.filter(isRecord) as T[]) : [];
}

function stringValue(value: unknown, fallback = "-") {
  const result = String(value ?? "").trim();
  return result || fallback;
}

function activeEnrollmentsLabel(value: unknown) {
  if (Array.isArray(value)) return String(value.length);
  if (!isRecord(value)) return stringValue(value);

  const count =
    value.count ??
    value.total ??
    value.cantidad ??
    value.activas ??
    value.matriculas_activas;

  if (typeof count === "number" || typeof count === "string") {
    return stringValue(count);
  }

  const enrollmentList =
    value.results ?? value.items ?? value.data ?? value.matriculas ?? value.cursos;

  if (Array.isArray(enrollmentList)) return String(enrollmentList.length);
  return Object.keys(value).length > 0 ? "1" : "0";
}

export function extractGuardianStudents(data: unknown): GuardianStudent[] {
  return extractGuardianItems<Record<string, unknown>>(data)
    .map((student) => ({
      id: Number(student.id ?? student.estudiante_id),
      estudiante_id: Number(student.estudiante_id ?? student.estudiante),
      codigo_estudiante: stringValue(student.codigo_estudiante),
      estudiante_nombre: stringValue(
        student.estudiante_nombre ?? student.estudiante_label,
        "Estudiante sin nombre",
      ),
      parentesco: stringValue(student.parentesco, ""),
      parentesco_label: stringValue(
        student.parentesco_label ?? student.parentesco,
        "No especificado",
      ),
      es_principal: Boolean(student.es_principal),
      matriculas_activas: activeEnrollmentsLabel(student.matriculas_activas),
      matriculas_activas_detalle: student.matriculas_activas,
    }))
    .filter((student) => Number.isFinite(student.estudiante_id));
}

function nestedRecords(value: unknown, depth = 0): Record<string, unknown>[] {
  if (depth > 3) return [];
  if (Array.isArray(value)) {
    return value.flatMap((item) => nestedRecords(item, depth + 1));
  }
  if (!isRecord(value)) return [];

  return [
    value,
    ...Object.values(value).flatMap((item) => nestedRecords(item, depth + 1)),
  ];
}

export function extractGuardianCourses(
  studentId: number,
  attendanceData: unknown,
  gradeData: unknown,
  enrollmentData?: unknown,
): GuardianCourse[] {
  const attendance = extractGuardianItems<GuardianAttendance>(attendanceData).filter(
    (item) => Number(item.estudiante_id) === studentId,
  );
  const grades = extractGuardianItems<GuardianGrade>(gradeData).filter(
    (item) => Number(item.estudiante_id) === studentId,
  );
  const courses = new Map<number, GuardianCourse>();

  const addCourse = (idValue: unknown, nameValue: unknown) => {
    const id = Number(idValue);
    if (!Number.isFinite(id)) return;

    const current = courses.get(id);
    courses.set(id, {
      id,
      curso_nombre: stringValue(nameValue, current?.curso_nombre ?? "Curso"),
      asistencias: current?.asistencias ?? 0,
      calificaciones: current?.calificaciones ?? 0,
    });
  };

  nestedRecords(enrollmentData).forEach((record) => {
    addCourse(
      record.asignacion_curso_id ?? record.asignacion_curso ?? record.curso_id,
      record.curso_nombre ?? record.curso_label ?? record.nombre,
    );
  });

  attendance.forEach((record) => {
    addCourse(record.asignacion_curso_id, record.curso_nombre);
    const course = courses.get(Number(record.asignacion_curso_id));
    if (course) course.asistencias += 1;
  });

  grades.forEach((record) => {
    addCourse(record.asignacion_curso_id, record.curso_nombre);
    const course = courses.get(Number(record.asignacion_curso_id));
    if (course) course.calificaciones += 1;
  });

  return [...courses.values()].sort((a, b) =>
    a.curso_nombre.localeCompare(b.curso_nombre, "es"),
  );
}

const ENDPOINTS: Record<GuardianModuleKey, string> = {
  attendance: "/api/apoderado/asistencia/",
  grades: "/api/apoderado/calificaciones/",
  notifications: "/api/apoderado/notificaciones/",
  students: "/api/apoderado/mis-estudiantes/",
  tracking: "/api/apoderado/seguimiento/",
};

async function readError(response: Response) {
  const data = await response.json().catch(() => null);
  if (data && typeof data === "object") {
    const detail = formatApiObject(data as Record<string, unknown>);
    if (detail) return detail;
  }
  if (response.status === 403) return "No tienes permiso para acceder a este recurso.";
  return "No se pudo cargar la informacion del apoderado.";
}

async function requestJson<T>(path: string, init?: RequestInit) {
  const response = await authFetch(path, init);
  if (!response.ok) throw new Error(await readError(response));
  return (await response.json().catch(() => null)) as T;
}

export function getGuardianModuleData<T>(module: GuardianModuleKey) {
  return requestJson<T>(ENDPOINTS[module]);
}

export function markGuardianNotificationRead(notificationId: number) {
  return requestJson<Record<string, unknown>>(
    `/api/apoderado/notificaciones/${notificationId}/marcar-leida/`,
    { method: "POST" },
  );
}
