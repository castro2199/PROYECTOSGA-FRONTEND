import { authFetch } from "../../auth/services/authService";
import type {
  AcademicCourse,
  AcademicCoursePayload,
  AcademicCourseUpdatePayload,
  PaginatedAcademicCourseResponse,
} from "../types/academicCatalog.types";

const ACADEMIC_COURSES_URL = "/api/cursos/";

type AcademicCourseFilters = {
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

export async function getAcademicCourses(
  token: string,
  filters: AcademicCourseFilters = {},
): Promise<AcademicCourse[]> {
  const params = new URLSearchParams();

  if (filters.estado !== null && filters.estado !== undefined) {
    params.set("estado", String(filters.estado));
  }

  const url = params.size
    ? `${ACADEMIC_COURSES_URL}?${params.toString()}`
    : ACADEMIC_COURSES_URL;

  const response = await authFetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(await readError(response));
  }

  const data = (await response.json()) as PaginatedAcademicCourseResponse;
  return data.results ?? [];
}

export async function createAcademicCourse(
  token: string,
  payload: AcademicCoursePayload,
): Promise<AcademicCourse> {
  const response = await authFetch(ACADEMIC_COURSES_URL, {
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

  return (await response.json()) as AcademicCourse;
}

export async function updateAcademicCourse(
  token: string,
  id: number,
  payload: AcademicCourseUpdatePayload,
): Promise<AcademicCourse> {
  const response = await authFetch(`${ACADEMIC_COURSES_URL}${id}/`, {
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

  return (await response.json()) as AcademicCourse;
}
