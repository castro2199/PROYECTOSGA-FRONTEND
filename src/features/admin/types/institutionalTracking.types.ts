import type { AIRecommendation } from "./aiRecommendation.types";
import type { Incident } from "./incident.types";
import type { Observation } from "./observation.types";

export type TeacherTrackingSummary = {
  activo: boolean;
  asignaciones_activas: number;
  docente_id: number;
  docente_nombre: string;
  dni: string;
  email: string;
  incidencias_abiertas: number;
  observaciones: number;
  recomendaciones_pendientes: number;
  username: string;
};

export type TeacherTrackingDetail = TeacherTrackingSummary & {
  asignaciones: Array<{
    anio: string;
    curso: string;
    grado: string;
    seccion: string;
  }>;
};

export type InstitutionalTrackingTab =
  | "observations"
  | "incidents"
  | "recommendations";

export type InstitutionalTrackingRecords = {
  incidents: Incident[];
  observations: Observation[];
  recommendations: AIRecommendation[];
};
