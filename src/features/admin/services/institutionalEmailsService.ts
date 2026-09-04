import { authFetch } from "../../auth/services/authService";
import { formatApiObject } from "../utils/apiMessages";
import { fetchAllPages } from "../utils/pagination";
import type {
  InstitutionalEmail,
  InstitutionalEmailPayload,
  InstitutionalEmailPreview,
} from "../types/institutionalEmail.types";

const EMAILS_URL = "/api/correos/";

async function readError(response: Response) {
  const data = await response.json().catch(() => null);
  if (data && typeof data === "object") {
    const message = formatApiObject(data as Record<string, unknown>);
    if (message) return message;
  }
  return "No se pudo procesar el correo institucional.";
}

export function getInstitutionalEmails(token: string) {
  return fetchAllPages<InstitutionalEmail>(EMAILS_URL, token, readError);
}

async function postInstitutionalEmail<T>(
  token: string,
  path: "enviar/" | "previsualizar/",
  payload: InstitutionalEmailPayload,
) {
  const response = await authFetch(`${EMAILS_URL}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) throw new Error(await readError(response));
  return (await response.json()) as T;
}

export function previewInstitutionalEmail(
  token: string,
  payload: InstitutionalEmailPayload,
) {
  return postInstitutionalEmail<InstitutionalEmailPreview>(
    token,
    "previsualizar/",
    payload,
  );
}

export function sendInstitutionalEmail(
  token: string,
  payload: InstitutionalEmailPayload,
) {
  return postInstitutionalEmail<InstitutionalEmail>(token, "enviar/", payload);
}
