import type { BasicAcademicStatus } from "./academicStatus.types";

export type AcademicCompetency = {
  id: number;
  curso: number;
  curso_label: string;
  nombre: string;
  estado: BasicAcademicStatus;
  estado_label: string;
};

export type AcademicCompetencyPayload = {
  curso: number;
  nombre: string;
  estado: BasicAcademicStatus;
};

export type AcademicCompetencyUpdatePayload =
  Partial<AcademicCompetencyPayload>;

export type AcademicCapacity = {
  id: number;
  competencia: number;
  competencia_label: string;
  curso_id: number;
  curso_label: string;
  nombre: string;
  estado: BasicAcademicStatus;
  estado_label: string;
};

export type AcademicCapacityPayload = {
  competencia: number;
  nombre: string;
  estado: BasicAcademicStatus;
};

export type AcademicCapacityUpdatePayload = Partial<AcademicCapacityPayload>;

export type AcademicCriterion = {
  id: number;
  capacidad: number;
  capacidad_label: string;
  competencia_id: number;
  competencia_label: string;
  curso_id: number;
  curso_label: string;
  nombre: string;
  descripcion: string | null;
  estado: BasicAcademicStatus;
  estado_label: string;
};

export type AcademicCriterionPayload = {
  capacidad: number;
  nombre: string;
  descripcion: string | null;
  estado: BasicAcademicStatus;
};

export type AcademicCriterionUpdatePayload = Partial<AcademicCriterionPayload>;

export type AcademicEvaluationEntity =
  | AcademicCompetency
  | AcademicCapacity
  | AcademicCriterion;

export type AcademicEvaluationEntityType =
  | "competency"
  | "capacity"
  | "criterion";
