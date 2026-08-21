import type {
  AuthSession,
  AuthTokenResponse,
  AuthUser,
  LoginCredentials,
} from "../types/auth.types";

const AUTH_TOKEN_URL =
  import.meta.env.VITE_AUTH_TOKEN_URL ?? "/api/auth/token/";
const AUTH_TOKEN_REFRESH_URL =
  import.meta.env.VITE_AUTH_TOKEN_REFRESH_URL ?? "/api/auth/token/refresh/";
const AUTH_ME_URL = import.meta.env.VITE_AUTH_ME_URL ?? "/api/auth/me/";

const AUTH_SESSION_KEY = "sga.auth.session";
export const AUTH_SESSION_EXPIRED_EVENT = "sga.auth.session.expired";
export const AUTH_SESSION_UPDATED_EVENT = "sga.auth.session.updated";

function getErrorMessage(data: AuthTokenResponse | null) {
  if (data?.detail) return data.detail;
  if (data?.message) return data.message;
  if (data?.non_field_errors?.length) return data.non_field_errors[0];

  return "No se pudo iniciar sesión. Verifica tus credenciales.";
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

function mapSession(data: AuthTokenResponse): AuthSession {
  const token = data.access ?? data.token ?? data.auth_token;

  if (!token) {
    throw new Error("La API no retornó un token de autenticación válido.");
  }

  return {
    token,
    refreshToken: data.refresh,
    user: {
      id: 0,
      username: "",
      email: "",
      first_name: "",
      last_name: "",
      full_name: "",
      is_staff: false,
      is_superuser: false,
      groups: [],
      perfil_id: null,
      estudiante_id: null,
      docente_id: null,
      apoderado_id: null,
    },
  };
}

export async function login(credentials: LoginCredentials): Promise<AuthSession> {
  const response = await fetch(AUTH_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(credentials),
  });

  const data = (await response.json().catch(() => null)) as AuthTokenResponse | null;

  if (!response.ok) {
    throw new Error(getErrorMessage(data));
  }

  const session = mapSession(data ?? {});
  const user = await getCurrentUser(session.token);

  return {
    ...session,
    user,
  };
}

export async function getCurrentUser(token: string): Promise<AuthUser> {
  const response = await authFetch(AUTH_ME_URL, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = (await response.json().catch(() => null)) as AuthUser | null;

  if (!response.ok || !data) {
    throw new Error("No se pudo obtener el perfil del usuario autenticado.");
  }

  return data;
}

export async function refreshSession(refreshToken: string): Promise<AuthSession> {
  const currentSession = getStoredSession();
  const response = await fetch(AUTH_TOKEN_REFRESH_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      refresh: refreshToken,
    }),
  });

  const data = (await response.json().catch(() => null)) as AuthTokenResponse | null;

  if (!response.ok) {
    throw new Error(getErrorMessage(data));
  }

  const token = data?.access ?? data?.token ?? data?.auth_token;

  if (!token || !currentSession) {
    throw new Error("No se pudo renovar la sesion.");
  }

  return {
    ...currentSession,
    token,
    refreshToken: data?.refresh ?? refreshToken,
  };
}

export function saveSession(session: AuthSession) {
  sessionStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
  window.dispatchEvent(new CustomEvent<AuthSession>(AUTH_SESSION_UPDATED_EVENT, {
    detail: session,
  }));
}

export function getStoredSession(): AuthSession | null {
  const value = sessionStorage.getItem(AUTH_SESSION_KEY);

  if (!value) return null;

  try {
    const session = JSON.parse(value) as AuthSession;
    return session.token && session.user ? session : null;
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

  const response = await fetch(input, {
    ...init,
    headers,
  });

  if (response.ok) return response;

  const clonedResponse = response.clone();
  const errorData = await clonedResponse.json().catch(() => null);

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

    const retryResponse = await fetch(input, {
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
