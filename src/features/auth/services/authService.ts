import type {
  AuthMenuItem,
  AuthSession,
  AuthTokenResponse,
  AuthUser,
  LoginCredentials,
} from "../types/auth.types";

// Relative URLs use Vite's proxy in development. Deployments can point the
// frontend at another origin through VITE_API_URL.
const CONFIGURED_API_URL = (
  import.meta.env.VITE_API_URL ??
  import.meta.env.VITE_API_BASE_URL ??
  ""
).trim();
const API_BASE_URL = import.meta.env.DEV ? "" : CONFIGURED_API_URL;
const AUTH_TOKEN_URL = "/api/auth/token/";
const AUTH_TOKEN_REFRESH_URL = "/api/auth/token/refresh/";
const AUTH_ME_URL = "/api/auth/me/";
const AUTH_MENU_URL = "/api/auth/menu/";
const DASHBOARD_URL = "/api/dashboard/";

const AUTH_SESSION_KEY = "sga.auth.session";
export const AUTH_SESSION_EXPIRED_EVENT = "sga.auth.session.expired";
export const AUTH_SESSION_UPDATED_EVENT = "sga.auth.session.updated";

function apiUrl(input: RequestInfo | URL) {
  if (input instanceof URL) return input;
  if (typeof input !== "string") return input;
  if (/^https?:\/\//i.test(input)) return input;

  if (!API_BASE_URL) return input;

  return `${API_BASE_URL.replace(/\/$/, "")}/${input.replace(/^\//, "")}`;
}

async function apiFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  try {
    return await fetch(apiUrl(input), init);
  } catch {
    throw new Error(
      "No se pudo conectar con el servidor del SGA. Verifica la configuracion de VITE_API_URL y que el backend este disponible.",
    );
  }
}

function getErrorMessage(data: AuthTokenResponse | null) {
  if (data?.detail) return data.detail;
  if (data?.message) return data.message;
  if (data?.non_field_errors?.length) return data.non_field_errors[0];

  return "No se pudo iniciar sesion. Verifica tus credenciales.";
}

function isTokenInvalidResponse(status: number, data: unknown) {
  if (status === 401) return true;

  if (!data || typeof data !== "object") return false;

  const maybeError = data as {
    code?: string;
    detail?: string;
    messages?: unknown;
  };

  return (
    maybeError.code === "token_not_valid" ||
    maybeError.detail?.toLowerCase().includes("token") === true ||
    Array.isArray(maybeError.messages)
  );
}

function extractMenuItems(data: unknown): AuthMenuItem[] {
  if (Array.isArray(data)) return data as AuthMenuItem[];
  if (!data || typeof data !== "object") return [];

  const maybeMenu = data as {
    items?: unknown;
    menu?: unknown;
    menu_items?: unknown;
    results?: unknown;
  };
  const items =
    maybeMenu.items ?? maybeMenu.menu_items ?? maybeMenu.menu ?? maybeMenu.results;

  return Array.isArray(items) ? (items as AuthMenuItem[]) : [];
}

function roleName(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (!value || typeof value !== "object") return null;

  const role = value as { name?: unknown; nombre?: unknown; label?: unknown };
  const name = role.name ?? role.nombre ?? role.label;
  return typeof name === "string" && name.trim() ? name.trim() : null;
}

function extractRoles(user: AuthUser) {
  const candidates = [
    ...(Array.isArray(user.roles) ? user.roles : []),
    ...(Array.isArray(user.groups) ? user.groups : []),
  ];

  return [...new Set(candidates.map(roleName).filter((role): role is string => Boolean(role)))];
}

function normalizeUser(data: unknown): AuthUser {
  if (!data || typeof data !== "object") {
    throw new Error("La API no retorno un usuario valido.");
  }

  const response = data as Record<string, unknown>;
  const rawUser =
    response.user && typeof response.user === "object"
      ? (response.user as Record<string, unknown>)
      : response;
  const rawGroups = rawUser.groups ?? response.groups;
  const rawRoles = rawUser.roles ?? response.roles;
  const groups = Array.isArray(rawGroups)
    ? rawGroups.map(roleName).filter((role): role is string => Boolean(role))
    : [];
  const roles = Array.isArray(rawRoles)
    ? rawRoles.map(roleName).filter((role): role is string => Boolean(role))
    : [];
  const firstName = String(rawUser.first_name ?? "");
  const lastName = String(rawUser.last_name ?? "");

  return {
    id: Number(rawUser.id ?? 0),
    username: String(rawUser.username ?? ""),
    email: String(rawUser.email ?? ""),
    first_name: firstName,
    last_name: lastName,
    full_name: String(rawUser.full_name ?? `${firstName} ${lastName}`.trim()),
    is_staff: Boolean(rawUser.is_staff),
    is_superuser: Boolean(rawUser.is_superuser),
    groups,
    roles,
    primary_role: roleName(
      rawUser.primary_role ??
        rawUser.primaryRole ??
        response.primary_role ??
        response.primaryRole ??
        rawUser.role ??
        response.role,
    ),
    perfil_id: Number(rawUser.perfil_id) || null,
    estudiante_id: Number(rawUser.estudiante_id) || null,
    docente_id: Number(rawUser.docente_id) || null,
    apoderado_id: Number(rawUser.apoderado_id) || null,
  };
}

function mapTokenResponse(data: AuthTokenResponse) {
  const token = data.access ?? data.token ?? data.auth_token;

  if (!token) {
    throw new Error("La API no retorno un token de autenticacion valido.");
  }

  return {
    token,
    refreshToken: data.refresh,
  };
}

async function readJson<TData>(response: Response): Promise<TData> {
  const data = (await response.json().catch(() => null)) as TData | null;

  if (response.ok && data !== null) return data;

  if (response.status === 400) {
    throw new Error("Credenciales invalidas.");
  }

  if (response.status === 403) {
    throw new Error("No tienes permiso para acceder a este recurso.");
  }

  if (response.status >= 500) {
    throw new Error(
      getErrorMessage(data as AuthTokenResponse | null) ||
        "El servidor del SGA no esta disponible.",
    );
  }

  throw new Error(getErrorMessage(data as AuthTokenResponse | null));
}

async function fetchAuthenticatedJson<TData>(
  path: string,
  token: string,
): Promise<TData> {
  const response = await apiFetch(path, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return readJson<TData>(response);
}

async function loadSessionResources(token: string) {
  const [userData, menuData, dashboard] = await Promise.all([
    fetchAuthenticatedJson<unknown>(AUTH_ME_URL, token),
    fetchAuthenticatedJson<unknown>(AUTH_MENU_URL, token),
    fetchAuthenticatedJson<unknown>(DASHBOARD_URL, token),
  ]);
  const user = normalizeUser(userData);
  const roles = extractRoles(user);
  const primaryRole =
    user.primary_role ?? user.primaryRole ?? user.role ?? roles[0] ?? null;

  return {
    dashboard,
    menuItems: extractMenuItems(menuData),
    primaryRole,
    roles,
    user,
  };
}

export async function login(credentials: LoginCredentials): Promise<AuthSession> {
  const response = await apiFetch(AUTH_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(credentials),
  });
  const data = await readJson<AuthTokenResponse>(response);
  const tokenData = mapTokenResponse(data);
  const resources = await loadSessionResources(tokenData.token);

  return {
    ...tokenData,
    ...resources,
  };
}

export async function getCurrentUser(token: string): Promise<AuthUser> {
  return fetchAuthenticatedJson<AuthUser>(AUTH_ME_URL, token);
}

export async function refreshSession(refreshToken: string): Promise<AuthSession> {
  const currentSession = getStoredSession();
  const response = await apiFetch(AUTH_TOKEN_REFRESH_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      refresh: refreshToken,
    }),
  });
  const data = await readJson<AuthTokenResponse>(response);
  const tokenData = mapTokenResponse(data);
  const resources = await loadSessionResources(tokenData.token);

  return {
    ...currentSession,
    ...tokenData,
    refreshToken: tokenData.refreshToken ?? refreshToken,
    ...resources,
  };
}

export async function restoreSession(
  session: AuthSession,
): Promise<AuthSession> {
  const resources = await loadSessionResources(session.token);

  return {
    ...session,
    ...resources,
  };
}

export function saveSession(session: AuthSession) {
  sessionStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
  window.dispatchEvent(
    new CustomEvent<AuthSession>(AUTH_SESSION_UPDATED_EVENT, {
      detail: session,
    }),
  );
}

export function getStoredSession(): AuthSession | null {
  const value = sessionStorage.getItem(AUTH_SESSION_KEY);

  if (!value) return null;

  try {
    const session = JSON.parse(value) as AuthSession;
    return session.token ? session : null;
  } catch {
    sessionStorage.removeItem(AUTH_SESSION_KEY);
    return null;
  }
}

export function clearSession() {
  sessionStorage.removeItem(AUTH_SESSION_KEY);
}

export function expireSession() {
  clearSession();
  window.dispatchEvent(new Event(AUTH_SESSION_EXPIRED_EVENT));
}

export async function authFetch(
  input: RequestInfo | URL,
  init: RequestInit = {},
): Promise<Response> {
  const session = getStoredSession();
  const headers = new Headers(init.headers);

  if (session?.token) {
    headers.set("Authorization", `Bearer ${session.token}`);
  }

  const response = await apiFetch(input, {
    ...init,
    headers,
  });

  if (response.ok) return response;

  const errorData = await response.clone().json().catch(() => null);

  if (!isTokenInvalidResponse(response.status, errorData)) {
    return response;
  }

  if (!session?.refreshToken) {
    expireSession();
    return response;
  }

  try {
    const refreshedSession = await refreshSession(session.refreshToken);
    saveSession(refreshedSession);

    const retryHeaders = new Headers(init.headers);
    retryHeaders.set("Authorization", `Bearer ${refreshedSession.token}`);

    const retryResponse = await apiFetch(input, {
      ...init,
      headers: retryHeaders,
    });

    if (retryResponse.ok) return retryResponse;

    const retryErrorData = await retryResponse.clone().json().catch(() => null);

    if (isTokenInvalidResponse(retryResponse.status, retryErrorData)) {
      expireSession();
    }

    return retryResponse;
  } catch {
    expireSession();
    return response;
  }
}
