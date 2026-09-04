import { authFetch } from "../../auth/services/authService";
import type {
  Enrollment,
  EnrollmentPayload,
  EnrollmentUpdatePayload,
} from "../types/enrollment.types";
import { formatApiObject } from "../utils/apiMessages";
import { fetchAllPages } from "../utils/pagination";

const ENROLLMENTS_URL = "/api/matriculas/";

type EnrollmentFilters = {
  estado?: string | null;
};

async function readError(response: Response) {
  const data = await response.json().catch(() => null);

  if (data && typeof data === "object") {
    const messages = formatApiObject(data as Record<string, unknown>);

    if (messages) return messages;
  }

  return "No se pudo completar la operacion.";
}

export async function getEnrollments(
  token: string,
  filters: EnrollmentFilters = {},
): Promise<Enrollment[]> {
  const params = new URLSearchParams();

  if (filters.estado) {
    params.set("estado", filters.estado);
  }

  const url = params.size
    ? `${ENROLLMENTS_URL}?${params.toString()}`
    : ENROLLMENTS_URL;

  return fetchAllPages<Enrollment>(url, token, readError);
}

export async function createEnrollment(
  token: string,
  payload: EnrollmentPayload,
): Promise<Enrollment> {
  const response = await authFetch(ENROLLMENTS_URL, {
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

  return (await response.json()) as Enrollment;
}

export async function updateEnrollment(
  token: string,
  id: number,
  payload: EnrollmentUpdatePayload,
): Promise<Enrollment> {
  const response = await authFetch(`${ENROLLMENTS_URL}${id}/`, {
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

  return (await response.json()) as Enrollment;
}
