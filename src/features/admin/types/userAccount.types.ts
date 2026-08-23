export type UserRole =
  | "Administrador"
  | "Directivo"
  | "Docente"
  | "Estudiante"
  | "Apoderado";

export type UserAccount = {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  dni: string;
  telefono: string;
  is_active: boolean;
  is_staff: boolean;
  is_superuser: boolean;
  groups: string[];
  perfil_id: number | null;
  estudiante_id: number | null;
  docente_id: number | null;
  apoderado_id: number | null;
};

export type UserAccountPayload = {
  username: string;
  password?: string;
  email: string;
  first_name: string;
  last_name: string;
  dni: string;
  telefono: string;
  is_active: boolean;
  roles: UserRole[];
};

export type UserAccountUpdatePayload = Partial<UserAccountPayload>;

export type PaginatedUserAccountResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: UserAccount[];
};

export const userRoleOptions: UserRole[] = [
  "Administrador",
  "Directivo",
  "Docente",
  "Estudiante",
  "Apoderado",
];
