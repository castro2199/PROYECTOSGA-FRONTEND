import type { AcademicLifecycleStatus } from "./academicStatus.types";

export type AcademicYear = {
  id: number;
  anio: number;
  fecha_inicio: string;
  fecha_fin: string;
  estado: AcademicLifecycleStatus;
  estado_label: string;
};

export type AcademicYearPayload = {
  anio: number;
  fecha_inicio: string;
  fecha_fin: string;
  estado: AcademicLifecycleStatus;
};

export type AcademicYearUpdatePayload = Partial<AcademicYearPayload>;

export type PaginatedAcademicYearResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: AcademicYear[];
};
