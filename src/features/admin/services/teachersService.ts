import { authFetch } from "../../auth/services/authService";
import type {
  Teacher,
  TeacherPayload,
  TeacherUpdatePayload,
} from "../types/academicCatalog.types";
import { fetchAllPages } from "../utils/pagination";

const TEACHERS_URL = "/api/docentes/";

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

export async function getTeachers(token: string): Promise<Teacher[]> {
  return fetchAllPages<Teacher>(TEACHERS_URL, token, readError);
}

export async function createTeacher(
  token: string,
  payload: TeacherPayload,
): Promise<Teacher> {
  const response = await authFetch(TEACHERS_URL, {
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

  return (await response.json()) as Teacher;
}

export async function updateTeacher(
  token: string,
  id: number,
  payload: TeacherUpdatePayload,
): Promise<Teacher> {
  const response = await authFetch(`${TEACHERS_URL}${id}/`, {
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

  return (await response.json()) as Teacher;
}
