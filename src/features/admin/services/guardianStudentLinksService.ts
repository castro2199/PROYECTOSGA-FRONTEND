import { authFetch } from "../../auth/services/authService";
import type {
  GuardianStudentLink,
  GuardianStudentLinkPayload,
  PaginatedGuardianStudentLinkResponse,
} from "../types/guardianStudentLink.types";
import { formatApiObject } from "../utils/apiMessages";

const GUARDIAN_STUDENT_LINKS_URL = "/api/vinculos-apoderados/";

async function readError(response: Response) {
  const data = await response.json().catch(() => null);

  if (data && typeof data === "object") {
    const messages = formatApiObject(data as Record<string, unknown>);

    if (messages) return messages;
  }

  return "No se pudo completar la operacion.";
}

export async function getGuardianStudentLinks(
  token: string,
): Promise<GuardianStudentLink[]> {
  const response = await authFetch(GUARDIAN_STUDENT_LINKS_URL, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(await readError(response));
  }

  const data = (await response.json()) as PaginatedGuardianStudentLinkResponse;
  return data.results ?? [];
}

export async function createGuardianStudentLink(
  token: string,
  payload: GuardianStudentLinkPayload,
): Promise<GuardianStudentLink> {
  const response = await authFetch(GUARDIAN_STUDENT_LINKS_URL, {
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

  return (await response.json()) as GuardianStudentLink;
}
