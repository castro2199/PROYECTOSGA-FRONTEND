export type Student = {
  id: number;
  user_id: number;
  perfil_id: number;
  rol: string;
  username_display: string;
  email_display: string;
  first_name_display: string;
  last_name_display: string;
  full_name: string;
  dni_display: string;
  telefono_display: string;
  activo: boolean;
  codigo_estudiante: string;
  fecha_nacimiento: string | null;
};

export type StudentPayload = {
  username: string;
  password?: string;
  email: string;
  first_name: string;
  last_name: string;
  dni: string;
  telefono: string;
  is_active: boolean;
  codigo_estudiante: string;
  fecha_nacimiento: string | null;
};

export type StudentUpdatePayload = Partial<StudentPayload>;

export type PaginatedStudentResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: Student[];
};
