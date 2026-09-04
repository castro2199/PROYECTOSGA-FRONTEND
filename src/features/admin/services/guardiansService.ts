import { authFetch } from "../../auth/services/authService";
import type {
  Guardian,
  GuardianPayload,
  GuardianUpdatePayload,
} from "../types/guardian.types";
import { formatApiObject } from "../utils/apiMessages";
import { fetchAllPages } from "../utils/pagination";

const GUARDIANS_URL = "/api/apoderados/";
const GUARDIANS_BULK_UPLOAD_URL = "/api/apoderados/carga-masiva/";
const GUARDIANS_TEMPLATE_URL = "/api/apoderados/carga-masiva/plantilla/";

async function readError(response: Response) {
  const data = await response.json().catch(() => null);

  if (data && typeof data === "object") {
    const messages = formatApiObject(data as Record<string, unknown>);

    if (messages) return messages;
  }

  return "No se pudo completar la operacion.";
}

export async function getGuardians(token: string): Promise<Guardian[]> {
  return fetchAllPages<Guardian>(GUARDIANS_URL, token, readError);
}

export async function createGuardian(
  token: string,
  payload: GuardianPayload,
): Promise<Guardian> {
  const response = await authFetch(GUARDIANS_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await readError(response));
  }

  return (await response.json()) as Guardian;
}

export async function updateGuardian(
  token: string,
  id: number,
  payload: GuardianUpdatePayload,
): Promise<Guardian> {
  const response = await authFetch(`${GUARDIANS_URL}${id}/`, {
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

  return (await response.json()) as Guardian;
}

export async function downloadGuardiansTemplate(token: string): Promise<Blob> {
  const response = await authFetch(GUARDIANS_TEMPLATE_URL, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(await readError(response));
  }

  return await response.blob();
}

export async function uploadGuardiansBulk(
  token: string,
  file: File,
): Promise<Record<string, unknown>> {
  const formData = new FormData();
  formData.append("archivo", file);

  const response = await authFetch(GUARDIANS_BULK_UPLOAD_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error(await readError(response));
  }

  return (await response.json().catch(() => ({}))) as Record<string, unknown>;
}
