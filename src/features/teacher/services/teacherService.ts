import { formatApiObject } from "../../admin/utils/apiMessages";
import { authFetch } from "../../auth/services/authService";

export type TeacherModuleKey =
  | "courses"
  | "attendance"
  | "grades"
  | "participations"
  | "observations"
  | "tracking"
  | "recommendations"
  | "reports";

export type TeacherCourse = {
  id: number;
  curso_id: number;
  curso_nombre: string;
  curso_descripcion: string | null;
  grado_id: number;
  grado_nombre: string;
  seccion_id: number;
  seccion_nombre: string;
  anio_academico_id: number;
  anio_academico: number;
  estado: number;
  estado_label: string;
  estudiantes_matriculados: number;
};

export type TeacherStudent = {
  id: number;
  estudiante_id: number;
  codigo_estudiante: string;
  estudiante_nombre: string;
  fecha_matricula: string;
};

export type TeacherPeriod = {
  id: number;
  nombre: string;
  estado: number;
  estado_label: string;
  anio_academico_label: string;
};

export type TeacherCriterion = {
  id: number;
  nombre?: string;
  criterio_nombre?: string;
  descripcion?: string | null;
  capacidad_nombre?: string;
  competencia_nombre?: string;
};

export type RecommendationReviewStatus =
  | "PENDIENTE"
  | "APROBADA"
  | "EDITADA"
  | "RECHAZADA";

export type RecommendationContent = {
  resumen?: string;
  fortalezas?: string[];
  aspectos_reforzar?: string[];
  acciones_docente?: string[];
  acciones_estudiante?: string[];
  comunicacion_apoderado?: string;
};

export type TeacherRecommendation = {
  id: number;
  matricula: number;
  estudiante_label: string;
  estudiante_codigo: string;
  seccion_label: string;
  asignacion_curso: number | null;
  asignacion_curso_label: string;
  curso_nombre: string | null;
  periodo_academico: number | null;
  periodo_academico_label: string;
  contenido_generado: RecommendationContent;
  texto_generado: string;
  texto_revisado: string | null;
  texto_final: string;
  estado_revision: RecommendationReviewStatus;
  estado_revision_label: string;
  fecha_generacion: string;
  fecha_revision: string | null;
};

export type TeacherRecommendationFilters = {
  asignacion_curso?: number;
  matricula?: number;
  periodo_academico?: number;
  estado_revision?: RecommendationReviewStatus;
};

export type GenerateRecommendationPayload = {
  matricula: number;
  asignacion_curso: number;
  periodo_academico: number;
};

export type ReviewRecommendationPayload = {
  estado_revision: Exclude<RecommendationReviewStatus, "PENDIENTE">;
  texto_revisado?: string;
};

export type TeacherAttendanceRecord = {
  id: number;
  matricula_id: number;
  estudiante_id: number;
  estudiante_codigo: string;
  estudiante_nombre: string;
  asignacion_curso_id: number;
  curso_nombre: string;
  fecha: string;
  estado: AttendancePayload["registros"][number]["estado"];
  estado_label: string;
  justificacion: string | null;
};

export type TeacherGradeRecord = {
  id: number;
  matricula_id: number;
  estudiante_id: number;
  estudiante_codigo: string;
  estudiante_nombre: string;
  asignacion_curso_id: number;
  periodo_academico_id: number;
  periodo_nombre: string;
  criterio_calificacion_id: number;
  criterio_nombre: string;
  valor: GradePayload["registros"][number]["valor"];
  valor_label: string;
  observacion: string | null;
};

export type TeacherModuleResponse = {
  data: unknown;
  endpoint: string;
};

export type AttendancePayload = {
  asignacion_curso: number;
  fecha: string;
  registros: Array<{
    matricula: number;
    estado: "PRESENTE" | "TARDE" | "FALTA" | "JUSTIFICADA";
    justificacion: string | null;
  }>;
};

export type GradePayload = {
  asignacion_curso: number;
  periodo_academico: number;
  criterio_calificacion: number;
  registros: Array<{
    matricula: number;
    valor: "AD" | "A" | "B" | "C";
    observacion: string | null;
  }>;
};

const TEACHER_ENDPOINTS: Record<TeacherModuleKey, string> = {
  attendance: "/api/docente/asistencias/",
  courses: "/api/docente/mis-cursos/",
  grades: "/api/docente/calificaciones/",
  observations: "/api/docente/observaciones/",
  participations: "/api/docente/participaciones/",
  recommendations: "/api/docente/recomendaciones-ia/",
  reports: "/api/docente/reportes/resumen/",
  tracking: "/api/docente/seguimiento/",
};

async function readError(response: Response) {
  const data = await response.json().catch(() => null);

  if (data && typeof data === "object") {
    const messages = formatApiObject(data as Record<string, unknown>);
    if (messages) return messages;
  }

  if (response.status === 403) {
    return "No tienes permiso para acceder a este recurso.";
  }

  return "No se pudo completar la operacion.";
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await authFetch(path, init);

  if (!response.ok) throw new Error(await readError(response));
  return (await response.json().catch(() => null)) as T;
}

export async function getTeacherModuleData(
  _token: string,
  module: TeacherModuleKey,
): Promise<TeacherModuleResponse> {
  const endpoint = TEACHER_ENDPOINTS[module];
  const data = await requestJson<unknown>(endpoint);
  return { data, endpoint };
}

export function getTeacherCourses() {
  return requestJson<TeacherCourse[]>(TEACHER_ENDPOINTS.courses);
}

export function getTeacherCourseStudents(courseAssignmentId: number) {
  return requestJson<TeacherStudent[]>(
    `/api/docente/mis-cursos/${courseAssignmentId}/estudiantes/`,
  );
}

export function getTeacherCoursePeriods(courseAssignmentId: number) {
  return requestJson<TeacherPeriod[]>(
    `/api/docente/mis-cursos/${courseAssignmentId}/periodos/`,
  );
}

export function getTeacherCourseCriteria(courseAssignmentId: number) {
  return requestJson<TeacherCriterion[]>(
    `/api/docente/mis-cursos/${courseAssignmentId}/criterios/`,
  );
}

export function getTeacherAttendanceRecords() {
  return requestJson<TeacherAttendanceRecord[]>(TEACHER_ENDPOINTS.attendance);
}

export function getTeacherGradeRecords() {
  return requestJson<TeacherGradeRecord[]>(TEACHER_ENDPOINTS.grades);
}

function postTeacherRecord<T>(path: string, payload: unknown) {
  return requestJson<T>(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function registerTeacherAttendance(payload: AttendancePayload) {
  return postTeacherRecord<Record<string, unknown>>(
    "/api/docente/asistencias/registrar/",
    payload,
  );
}

export function registerTeacherGrades(payload: GradePayload) {
  return postTeacherRecord<Record<string, unknown>>(
    "/api/docente/calificaciones/registrar/",
    payload,
  );
}

export function registerTeacherParticipation(payload: Record<string, unknown>) {
  return postTeacherRecord<Record<string, unknown>>(
    "/api/docente/participaciones/registrar/",
    payload,
  );
}

export function registerTeacherObservation(payload: Record<string, unknown>) {
  return postTeacherRecord<Record<string, unknown>>(
    "/api/docente/observaciones/registrar/",
    payload,
  );
}

export function generateTeacherRecommendation(payload: GenerateRecommendationPayload) {
  return postTeacherRecord<TeacherRecommendation>(
    "/api/docente/recomendaciones-ia/generar/",
    payload,
  );
}

export function getTeacherRecommendations(
  filters: TeacherRecommendationFilters = {},
) {
  const query = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      query.set(key, String(value));
    }
  });

  const suffix = query.size > 0 ? `?${query.toString()}` : "";
  return requestJson<TeacherRecommendation[]>(
    `${TEACHER_ENDPOINTS.recommendations}${suffix}`,
  );
}

export function getTeacherRecommendation(recommendationId: number) {
  return requestJson<TeacherRecommendation>(
    `${TEACHER_ENDPOINTS.recommendations}${recommendationId}/`,
  );
}

export function reviewTeacherRecommendation(
  recommendationId: number,
  payload: ReviewRecommendationPayload,
) {
  return requestJson<TeacherRecommendation>(
    `${TEACHER_ENDPOINTS.recommendations}${recommendationId}/revisar/`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );
}
