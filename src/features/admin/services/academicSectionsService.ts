import type {
  AcademicSection,
  AcademicSectionPayload,
  AcademicSectionUpdatePayload,
  PaginatedAcademicSectionResponse,
} from "../types/academicCatalog.types";
import { authFetch } from "../../auth/services/authService";

const ACADEMIC_SECTIONS_URL = "/api/secciones/";

type AcademicSectionFilters = {
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

export async function getAcademicSections(
  token: string,
  filters: AcademicSectionFilters = {},
): Promise<AcademicSection[]> {
  const params = new URLSearchParams();

  if (filters.estado !== null && filters.estado !== undefined) {
    params.set("estado", String(filters.estado));
  }

  const url = params.size
    ? `${ACADEMIC_SECTIONS_URL}?${params.toString()}`
    : ACADEMIC_SECTIONS_URL;

  const response = await authFetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(await readError(response));
  }

  const data = (await response.json()) as PaginatedAcademicSectionResponse;
  return data.results ?? [];
}

export async function createAcademicSection(
  token: string,
  payload: AcademicSectionPayload,
): Promise<AcademicSection> {
  const response = await authFetch(ACADEMIC_SECTIONS_URL, {
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

  return (await response.json()) as AcademicSection;
}

export async function updateAcademicSection(
  token: string,
  id: number,
  payload: AcademicSectionUpdatePayload,
): Promise<AcademicSection> {
  const response = await authFetch(`${ACADEMIC_SECTIONS_URL}${id}/`, {
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

  return (await response.json()) as AcademicSection;
}
