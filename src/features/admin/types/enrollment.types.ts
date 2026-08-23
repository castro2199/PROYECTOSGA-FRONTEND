export type EnrollmentStatus =
  | "ACTIVA"
  | "RETIRADA"
  | "TRASLADADA"
  | "FINALIZADA";

export type Enrollment = {
  id: number;
  estudiante: number;
  estudiante_label: string;
  estudiante_codigo: string;
  estudiante_nombre: string;
  seccion: number;
  seccion_label: string;
  grado_label: string;
  anio_academico: number;
  anio_academico_label: string;
  fecha_matricula: string;
  estado: EnrollmentStatus;
};

export type EnrollmentPayload = {
  estudiante: number;
  seccion: number;
  anio_academico: number;
  fecha_matricula: string;
  estado: EnrollmentStatus;
};

export type EnrollmentUpdatePayload = Partial<EnrollmentPayload>;

export type PaginatedEnrollmentResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: Enrollment[];
};

export const enrollmentStatusLabels: Record<EnrollmentStatus, string> = {
  ACTIVA: "Activa",
  RETIRADA: "Retirada",
  TRASLADADA: "Trasladada",
  FINALIZADA: "Finalizada",
};

export const enrollmentStatusOptions: Array<{
  label: string;
  value: EnrollmentStatus;
}> = [
  {
    label: enrollmentStatusLabels.ACTIVA,
    value: "ACTIVA",
  },
  {
    label: enrollmentStatusLabels.RETIRADA,
    value: "RETIRADA",
  },
  {
    label: enrollmentStatusLabels.TRASLADADA,
    value: "TRASLADADA",
  },
  {
    label: enrollmentStatusLabels.FINALIZADA,
    value: "FINALIZADA",
  },
];
