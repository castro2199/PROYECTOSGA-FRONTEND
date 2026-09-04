import type {
  AcademicPeriod,
  AcademicPeriodPayload,
  AcademicPeriodUpdatePayload,
} from "../types/academicPeriod.types";
import { authFetch } from "../../auth/services/authService";
import { fetchAllPages } from "../utils/pagination";

const ACADEMIC_PERIODS_URL = "/api/periodos/";

type AcademicPeriodFilters = {
  estado?: number | null;
};

async function readError(response: Response) {
  const data = await response.json().catch(() => null);

  if (data && typeof data === "object") {
    const messages = Object.entries(data)
      .map(([field, value]) => {
        if (Array.isArray(value)) return `${field}: ${value.join(", ")}`;
        return `${field}: ${String(value)}`;
      })
      .join(" ");

    if (messages) return messages;
  }

  return "No se pudo completar la operación.";
}

export async function getAcademicPeriods(
  token: string,
  filters: AcademicPeriodFilters = {},
): Promise<AcademicPeriod[]> {
  const params = new URLSearchParams();

  if (filters.estado !== null && filters.estado !== undefined) {
    params.set("estado", String(filters.estado));
  }

  const url = params.size
    ? `${ACADEMIC_PERIODS_URL}?${params.toString()}`
    : ACADEMIC_PERIODS_URL;

  return fetchAllPages<AcademicPeriod>(url, token, readError);
}

export async function createAcademicPeriod(
  token: string,
  payload: AcademicPeriodPayload,
): Promise<AcademicPeriod> {
  const response = await authFetch(ACADEMIC_PERIODS_URL, {
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

  return (await response.json()) as AcademicPeriod;
}

export async function updateAcademicPeriod(
  token: string,
  id: number,
  payload: AcademicPeriodUpdatePayload,
): Promise<AcademicPeriod> {
  const response = await authFetch(`${ACADEMIC_PERIODS_URL}${id}/`, {
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

  return (await response.json()) as AcademicPeriod;
}
