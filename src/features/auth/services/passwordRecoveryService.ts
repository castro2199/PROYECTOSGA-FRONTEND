import { publicAuthFetch } from "./authService";
import {
  PasswordResetError,
  type PasswordResetConfirmPayload,
  type PasswordResetValidation,
} from "../types/passwordRecovery.types";

const REQUEST_URL = "/api/auth/password-reset/request/";
const VALIDATE_URL = "/api/auth/password-reset/validate/";
const CONFIRM_URL = "/api/auth/password-reset/confirm/";

const GENERIC_REQUEST_MESSAGE = "Si el correo corresponde a una cuenta activa, recibira un enlace de recuperacion.";

function objectErrors(data: unknown) {
  if (!data || typeof data !== "object") return {};
  return Object.fromEntries(
    Object.entries(data as Record<string, unknown>)
      .filter(([key, value]) => !["detail", "message", "valid"].includes(key) && Array.isArray(value))
      .map(([key, value]) => [key, (value as unknown[]).filter((item): item is string => typeof item === "string")]),
  );
}

function responseMessage(data: unknown, fallback: string) {
  if (!data || typeof data !== "object") return fallback;
  const response = data as Record<string, unknown>;
  if (typeof response.detail === "string") return response.detail;
  if (typeof response.message === "string") return response.message;
  for (const value of Object.values(objectErrors(data))) {
    if (value[0]) return value[0];
  }
  return fallback;
}

async function postJson(path: string, body: unknown, signal?: AbortSignal) {
  const response = await publicAuthFetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal,
  });
  const data = await response.json().catch(() => null);
  return { data, response };
}

export async function requestPasswordReset(email: string) {
  const { data, response } = await postJson(REQUEST_URL, { email });
  if (response.status === 429) {
    throw new PasswordResetError(responseMessage(data, "Has excedido el limite de solicitudes. Intenta nuevamente mas tarde."), 429);
  }
  if (!response.ok) {
    const message = response.status >= 500
      ? "No se pudo enviar la solicitud. Intenta nuevamente mas tarde."
      : responseMessage(data, "No se pudo enviar la solicitud.");
    throw new PasswordResetError(message, response.status, objectErrors(data));
  }
  return GENERIC_REQUEST_MESSAGE;
}

export async function validatePasswordReset(uid: string, token: string, signal?: AbortSignal): Promise<PasswordResetValidation> {
  const { data, response } = await postJson(VALIDATE_URL, { uid, token }, signal);
  const result = data as Partial<PasswordResetValidation> | null;
  if (response.ok && result?.valid === true) {
    return { detail: result.detail ?? "El enlace es valido.", valid: true };
  }
  if (response.status === 400 || result?.valid === false) {
    return { detail: result?.detail ?? "El enlace es invalido o ha expirado.", valid: false };
  }
  if (response.status >= 500) {
    throw new PasswordResetError("No se pudo validar el enlace. Intenta nuevamente mas tarde.", response.status);
  }
  throw new PasswordResetError(responseMessage(data, "No se pudo validar el enlace."), response.status, objectErrors(data));
}

export async function confirmPasswordReset(payload: PasswordResetConfirmPayload) {
  const { data, response } = await postJson(CONFIRM_URL, payload);
  if (!response.ok) {
    const message = response.status >= 500
      ? "No se pudo actualizar la contrasena. Intenta nuevamente mas tarde."
      : responseMessage(data, "No se pudo actualizar la contrasena.");
    throw new PasswordResetError(message, response.status, objectErrors(data));
  }
  const result = data as { detail?: unknown } | null;
  return typeof result?.detail === "string"
    ? result.detail
    : "La contrasena fue actualizada. Inicie sesion nuevamente.";
}
