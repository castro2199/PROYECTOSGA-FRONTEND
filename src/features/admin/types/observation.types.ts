export type Observation = {
  id: number;
  matricula: number;
  estudiante_label: string;
  estudiante_codigo: string;
  seccion_label: string;
  asignacion_curso: number | null;
  asignacion_curso_label: string | null;
  docente: number;
  docente_label: string;
  fecha: string;
  categoria: string;
  descripcion: string;
  activo: boolean;
};

export type ObservationPayload = {
  matricula: number;
  asignacion_curso: number | null;
  docente: number;
  fecha: string;
  categoria: string;
  descripcion: string;
  activo: boolean;
};

export type ObservationUpdatePayload = Partial<ObservationPayload>;

export type PaginatedObservationResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: Observation[];
};

export const observationStatusOptions = [
  {
    label: "Activo",
    value: true,
  },
  {
    label: "Inactivo",
    value: false,
  },
];
