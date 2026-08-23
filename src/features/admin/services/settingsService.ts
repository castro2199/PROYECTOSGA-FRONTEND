import { authFetch } from "../../auth/services/authService";
import type {
  InstitutionalSettings,
  InstitutionalSettingsUpdatePayload,
} from "../types/settings.types";
import { formatApiObject } from "../utils/apiMessages";

const CURRENT_SETTINGS_URL = "/api/configuracion/actual/";

async function readError(response: Response) {
  const data = await response.json().catch(() => null);

  if (data && typeof data === "object") {
    const messages = formatApiObject(data as Record<string, unknown>);

    if (messages) return messages;
  }

  return "No se pudo completar la operacion.";
}

export async function getCurrentSettings(
  token: string,
): Promise<InstitutionalSettings> {
  const response = await authFetch(CURRENT_SETTINGS_URL, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(await readError(response));
  }

  return (await response.json()) as InstitutionalSettings;
}

export async function updateCurrentSettings(
  token: string,
  payload: InstitutionalSettingsUpdatePayload,
): Promise<InstitutionalSettings> {
  const response = await authFetch(CURRENT_SETTINGS_URL, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await readError(response));
  }

  return (await response.json()) as InstitutionalSettings;
}
