import { authFetch } from "../../auth/services/authService";
import type {
  PaginatedStudentResponse,
  Student,
  StudentPayload,
  StudentUpdatePayload,
} from "../types/student.types";
import { formatApiObject } from "../utils/apiMessages";

const STUDENTS_URL = "/api/estudiantes/";
const STUDENTS_BULK_UPLOAD_URL = "/api/estudiantes/carga-masiva/";
const STUDENTS_TEMPLATE_URL = "/api/estudiantes/carga-masiva/plantilla/";

async function readError(response: Response) {
  const data = await response.json().catch(() => null);

  if (data && typeof data === "object") {
    const messages = formatApiObject(data as Record<string, unknown>);

    if (messages) return messages;
  }

  return "No se pudo completar la operacion.";
}

export async function getStudents(token: string): Promise<Student[]> {
  const response = await authFetch(STUDENTS_URL, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(await readError(response));
  }

  const data = (await response.json()) as PaginatedStudentResponse;
  return data.results ?? [];
}

export async function createStudent(
  token: string,
  payload: StudentPayload,
): Promise<Student> {
  const response = await authFetch(STUDENTS_URL, {
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

  return (await response.json()) as Student;
}

export async function updateStudent(
  token: string,
  id: number,
  payload: StudentUpdatePayload,
): Promise<Student> {
  const response = await authFetch(`${STUDENTS_URL}${id}/`, {
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

  return (await response.json()) as Student;
}

export async function downloadStudentsTemplate(token: string): Promise<Blob> {
  const response = await authFetch(STUDENTS_TEMPLATE_URL, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(await readError(response));
  }

  return await response.blob();
}

export async function uploadStudentsBulk(
  token: string,
  file: File,
): Promise<Record<string, unknown>> {
  const formData = new FormData();
  formData.append("archivo", file);

  const response = await authFetch(STUDENTS_BULK_UPLOAD_URL, {
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
