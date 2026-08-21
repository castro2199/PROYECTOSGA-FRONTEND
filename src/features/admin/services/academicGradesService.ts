import type {
  AcademicGrade,
  AcademicGradePayload,
  AcademicGradeUpdatePayload,
  PaginatedAcademicGradeResponse,
} from "../types/academicCatalog.types";
import { authFetch } from "../../auth/services/authService";

const ACADEMIC_GRADES_URL = "/api/grados/";

type AcademicGradeFilters = {
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

  return "No se pudo completar la operacion.";
}

export async function getAcademicGrades(
  token: string,
  filters: AcademicGradeFilters = {},
): Promise<AcademicGrade[]> {
  const params = new URLSearchParams();

  if (filters.estado !== null && filters.estado !== undefined) {
    params.set("estado", String(filters.estado));
  }

  const url = params.size
    ? `${ACADEMIC_GRADES_URL}?${params.toString()}`
    : ACADEMIC_GRADES_URL;

  const response = await authFetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(await readError(response));
  }

  const data = (await response.json()) as PaginatedAcademicGradeResponse;
  return data.results ?? [];
}

export async function createAcademicGrade(
  token: string,
  payload: AcademicGradePayload,
): Promise<AcademicGrade> {
  const response = await authFetch(ACADEMIC_GRADES_URL, {
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

  return (await response.json()) as AcademicGrade;
}

export async function updateAcademicGrade(
  token: string,
  id: number,
  payload: AcademicGradeUpdatePayload,
): Promise<AcademicGrade> {
  const response = await authFetch(`${ACADEMIC_GRADES_URL}${id}/`, {
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

  return (await response.json()) as AcademicGrade;
}
