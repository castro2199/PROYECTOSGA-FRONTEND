export type LoginCredentials = {
  username: string;
  password: string;
};

export type AuthTokenResponse = {
  access?: string;
  refresh?: string;
  token?: string;
  auth_token?: string;
  detail?: string;
  message?: string;
  non_field_errors?: string[];
};

export type AuthUser = {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  is_staff: boolean;
  is_superuser: boolean;
  groups: string[];
  perfil_id: number | null;
  estudiante_id: number | null;
  docente_id: number | null;
  apoderado_id: number | null;
};

export type AuthSession = {
  token: string;
  refreshToken?: string;
  user: AuthUser;
};
