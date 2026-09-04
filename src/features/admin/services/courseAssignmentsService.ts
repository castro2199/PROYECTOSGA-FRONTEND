import { authFetch } from "../../auth/services/authService";
import type {
  CourseAssignment,
  CourseAssignmentPayload,
  CourseAssignmentUpdatePayload,
} from "../types/academicCatalog.types";
import { fetchAllPages } from "../utils/pagination";

const COURSE_ASSIGNMENTS_URL = "/api/asignaciones-cursos/";

type CourseAssignmentFilters = {
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

export async function getCourseAssignments(
  token: string,
  filters: CourseAssignmentFilters = {},
): Promise<CourseAssignment[]> {
  const params = new URLSearchParams();

  if (filters.estado !== null && filters.estado !== undefined) {
    params.set("estado", String(filters.estado));
  }

  const url = params.size
    ? `${COURSE_ASSIGNMENTS_URL}?${params.toString()}`
    : COURSE_ASSIGNMENTS_URL;

  return fetchAllPages<CourseAssignment>(url, token, readError);
}

export async function createCourseAssignment(
  token: string,
  payload: CourseAssignmentPayload,
): Promise<CourseAssignment> {
  const response = await authFetch(COURSE_ASSIGNMENTS_URL, {
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

  return (await response.json()) as CourseAssignment;
}

export async function updateCourseAssignment(
  token: string,
  id: number,
  payload: CourseAssignmentUpdatePayload,
): Promise<CourseAssignment> {
  const response = await authFetch(`${COURSE_ASSIGNMENTS_URL}${id}/`, {
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

  return (await response.json()) as CourseAssignment;
}
