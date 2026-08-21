import type { AcademicLifecycleStatus } from "./academicStatus.types";

export type AcademicPeriod = {
  id: number;
  anio_academico: number;
  anio_academico_label: string;
  nombre: string;
  fecha_inicio: string;
  fecha_fin: string;
  estado: AcademicLifecycleStatus;
  estado_label: string;
};

export type AcademicPeriodPayload = {
  anio_academico: number;
  nombre: string;
  fecha_inicio: string;
  fecha_fin: string;
  estado: AcademicLifecycleStatus;
};

export type AcademicPeriodUpdatePayload = Partial<AcademicPeriodPayload>;

export type PaginatedAcademicPeriodResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: AcademicPeriod[];
};
