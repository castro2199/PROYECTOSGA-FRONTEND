export type IncidentType = "ACADEMICA" | "CONDUCTUAL" | "ASISTENCIA" | "OTRO";

export type IncidentLevel = "BAJO" | "MEDIO" | "ALTO";

export type IncidentStatus = "ABIERTA" | "EN_SEGUIMIENTO" | "CERRADA";

export type Incident = {
  id: number;
  matricula: number;
  estudiante_label: string;
  estudiante_codigo: string;
  seccion_label: string;
  observacion: number | null;
  observacion_label: string | null;
  tipo: IncidentType;
  descripcion: string;
  nivel: IncidentLevel | "" | null;
  estado: IncidentStatus;
  fecha_registro: string;
  fecha_cierre: string | null;
};

export type IncidentPayload = {
  matricula: number;
  tipo: IncidentType;
  descripcion: string;
  nivel: IncidentLevel | "" | null;
  estado: IncidentStatus;
  fecha_registro: string;
};

export type IncidentUpdatePayload = Partial<IncidentPayload>;

export type PaginatedIncidentResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: Incident[];
};

export const incidentTypeLabels: Record<IncidentType, string> = {
  ACADEMICA: "Academica",
  CONDUCTUAL: "Conductual",
  ASISTENCIA: "Asistencia",
  OTRO: "Otro",
};

export const incidentTypeOptions: Array<{
  label: string;
  value: IncidentType;
}> = [
  { label: incidentTypeLabels.ACADEMICA, value: "ACADEMICA" },
  { label: incidentTypeLabels.CONDUCTUAL, value: "CONDUCTUAL" },
  { label: incidentTypeLabels.ASISTENCIA, value: "ASISTENCIA" },
  { label: incidentTypeLabels.OTRO, value: "OTRO" },
];

export const incidentLevelLabels: Record<IncidentLevel, string> = {
  BAJO: "Bajo",
  MEDIO: "Medio",
  ALTO: "Alto",
};

export const incidentLevelOptions: Array<{
  label: string;
  value: IncidentLevel;
}> = [
  { label: incidentLevelLabels.BAJO, value: "BAJO" },
  { label: incidentLevelLabels.MEDIO, value: "MEDIO" },
  { label: incidentLevelLabels.ALTO, value: "ALTO" },
];

export const incidentStatusLabels: Record<IncidentStatus, string> = {
  ABIERTA: "Abierta",
  EN_SEGUIMIENTO: "En seguimiento",
  CERRADA: "Cerrada",
};

export const incidentStatusOptions: Array<{
  label: string;
  value: IncidentStatus;
}> = [
  { label: incidentStatusLabels.ABIERTA, value: "ABIERTA" },
  { label: incidentStatusLabels.EN_SEGUIMIENTO, value: "EN_SEGUIMIENTO" },
  { label: incidentStatusLabels.CERRADA, value: "CERRADA" },
];
