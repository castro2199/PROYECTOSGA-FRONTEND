export type LoginCredentials = {
  username: string;
  password: string;
};

export type AuthTokenResponse = {
  access?: string;
  refresh?: string;
  mfa_required?: boolean;
  rol?: string;
  challenge_id?: string;
  expires_in?: number;
  detail?: string;
  message?: string;
  non_field_errors?: string[];
  session?: {
    idle_timeout_seconds?: number;
    access_expires_in_seconds?: number;
    refresh_rotation?: boolean;
  };
};

export type MfaChallenge = {
  challengeId: string;
  expiresIn: number | null;
  message: string;
};

export type AuthMenuItem = {
  id?: string | number;
  key?: string;
  label?: string;
  title?: string;
  name?: string;
  path?: string;
  url?: string;
  route?: string;
  href?: string;
  icon?: string | null;
  children?: AuthMenuItem[];
  items?: AuthMenuItem[];
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
  roles: string[];
  primaryRole: string | null;
  menuItems: AuthMenuItem[];
  dashboard: unknown;
  sessionPolicy?: {
    idleTimeoutSeconds: number | null;
    accessExpiresInSeconds: number | null;
    refreshRotation: boolean;
  };
};

export type LoginResult = AuthSession | MfaChallenge;

export function isMfaChallenge(result: LoginResult): result is MfaChallenge {
  return "challengeId" in result;
}
