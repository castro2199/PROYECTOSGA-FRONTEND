import { formatApiObject } from "../../admin/utils/apiMessages";
import { authFetch } from "../../auth/services/authService";

export type StudentModuleKey =
  | "courses"
  | "attendance"
  | "grades"
  | "participation"
  | "tracking";

export type StudentCourse = {
  id: number;
  curso_id: number;
  curso_nombre: string;
  seccion_id: number;
  seccion_nombre: string;
  grado_nombre: string;
  anio_academico_id: number;
  anio_academico: number;
  docente_id: number;
  docente_nombre: string;
};

export type StudentAttendance = {
  id: number;
  asignacion_curso_id: number;
  curso_nombre: string;
  fecha: string;
  estado: "PRESENTE" | "TARDE" | "FALTA" | "JUSTIFICADA";
  estado_label: string;
  justificacion: string | null;
};

export type StudentGrade = {
  id: number;
  asignacion_curso_id: number;
  curso_nombre: string;
  periodo_academico_id: number;
  periodo_nombre: string;
  criterio_calificacion_id: number;
  criterio_nombre: string;
  capacidad_nombre: string;
  competencia_nombre: string;
  valor: "AD" | "A" | "B" | "C";
  valor_label: string;
  observacion: string | null;
};

export type StudentParticipation = {
  id: number;
  asignacion_curso_id: number;
  curso_nombre: string;
  periodo_academico_id: number;
  periodo_nombre: string | null;
  fecha: string;
  tipo: "ORAL" | "ESCRITA" | "PRACTICA" | "OTRO";
  tipo_label: string;
  valor: string | null;
  observacion: string | null;
};

const ENDPOINTS: Record<StudentModuleKey, string> = {
  attendance: "/api/estudiante/mi-asistencia/",
  courses: "/api/estudiante/mis-cursos/",
  grades: "/api/estudiante/mis-calificaciones/",
  participation: "/api/estudiante/mi-participacion/",
  tracking: "/api/estudiante/mi-seguimiento/",
};

async function readError(response: Response) {
  const data = await response.json().catch(() => null);
  if (data && typeof data === "object") {
    const detail = formatApiObject(data as Record<string, unknown>);
    if (detail) return detail;
  }
  if (response.status === 403) return "No tienes permiso para acceder a este recurso.";
  return "No se pudo cargar la informacion del estudiante.";
}

export async function getStudentModuleData<T>(module: StudentModuleKey) {
  const response = await authFetch(ENDPOINTS[module]);
  if (!response.ok) throw new Error(await readError(response));
  return (await response.json().catch(() => null)) as T;
}
