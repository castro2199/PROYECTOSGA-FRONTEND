import type {
  BasicAcademicStatus,
  CourseAssignmentStatus,
} from "./academicStatus.types";

export type AcademicGrade = {
  id: number;
  nombre: string;
  estado: BasicAcademicStatus;
  estado_label: string;
};

export type AcademicGradePayload = {
  nombre: string;
  estado: BasicAcademicStatus;
};

export type AcademicGradeUpdatePayload = Partial<AcademicGradePayload>;

export type PaginatedAcademicGradeResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: AcademicGrade[];
};

export type AcademicSection = {
  id: number;
  grado: number;
  grado_label: string;
  nombre: string;
  estado: BasicAcademicStatus;
  estado_label: string;
};

export type AcademicSectionPayload = {
  grado: number;
  nombre: string;
  estado: BasicAcademicStatus;
};

export type AcademicSectionUpdatePayload = Partial<AcademicSectionPayload>;

export type PaginatedAcademicSectionResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: AcademicSection[];
};

export type AcademicCourse = {
  id: number;
  nombre: string;
  descripcion: string | null;
  estado: BasicAcademicStatus;
  estado_label: string;
};

export type AcademicCoursePayload = {
  nombre: string;
  descripcion: string | null;
  estado: BasicAcademicStatus;
};

export type AcademicCourseUpdatePayload = Partial<AcademicCoursePayload>;

export type PaginatedAcademicCourseResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: AcademicCourse[];
};

export type CourseAssignment = {
  id: number;
  curso: number;
  curso_label: string;
  docente: number;
  docente_label: string;
  seccion: number;
  seccion_label: string;
  anio_academico: number;
  anio_academico_label: string;
  estado: CourseAssignmentStatus;
  estado_label: string;
};

export type CourseAssignmentPayload = {
  curso: number;
  docente: number;
  seccion: number;
  anio_academico: number;
  estado: CourseAssignmentStatus;
};

export type CourseAssignmentUpdatePayload = Partial<CourseAssignmentPayload>;

export type PaginatedCourseAssignmentResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: CourseAssignment[];
};

export type Teacher = {
  id: number;
  user_id: number;
  perfil_id: number;
  rol: string;
  username_display?: string;
  email_display?: string;
  first_name_display?: string;
  last_name_display?: string;
  full_name: string;
  dni_display?: string;
  telefono_display?: string;
  activo: boolean;
};

export type TeacherPayload = {
  username: string;
  password?: string;
  email: string;
  first_name: string;
  last_name: string;
  dni: string;
  telefono: string;
  is_active: boolean;
};

export type TeacherUpdatePayload = Partial<TeacherPayload>;

export type PaginatedTeacherResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: Teacher[];
};
