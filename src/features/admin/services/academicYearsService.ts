import type {
  AcademicYear,
  AcademicYearPayload,
  AcademicYearUpdatePayload,
  PaginatedAcademicYearResponse,
} from "../types/academicYear.types";
import { authFetch } from "../../auth/services/authService";

const ACADEMIC_YEARS_URL = "/api/anios-academicos/";

type AcademicYearFilters = {
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

export async function getAcademicYears(
  token: string,
  filters: AcademicYearFilters = {},
): Promise<AcademicYear[]> {
  const params = new URLSearchParams();

  if (filters.estado !== null && filters.estado !== undefined) {
    params.set("estado", String(filters.estado));
  }

  const url = params.size
    ? `${ACADEMIC_YEARS_URL}?${params.toString()}`
    : ACADEMIC_YEARS_URL;

  const response = await authFetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(await readError(response));
  }

  const data = (await response.json()) as PaginatedAcademicYearResponse;
  return data.results ?? [];
}

export async function createAcademicYear(
  token: string,
  payload: AcademicYearPayload,
): Promise<AcademicYear> {
  const response = await authFetch(ACADEMIC_YEARS_URL, {
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

  return (await response.json()) as AcademicYear;
}

export async function updateAcademicYear(
  token: string,
  id: number,
  payload: AcademicYearUpdatePayload,
): Promise<AcademicYear> {
  const response = await authFetch(`${ACADEMIC_YEARS_URL}${id}/`, {
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

  return (await response.json()) as AcademicYear;
}
