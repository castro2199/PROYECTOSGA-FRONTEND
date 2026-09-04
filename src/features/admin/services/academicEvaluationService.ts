import { authFetch } from "../../auth/services/authService";
import type { AcademicCourse } from "../types/academicCatalog.types";
import type {
  AcademicCapacity,
  AcademicCapacityPayload,
  AcademicCapacityUpdatePayload,
  AcademicCompetency,
  AcademicCompetencyPayload,
  AcademicCompetencyUpdatePayload,
  AcademicCriterion,
  AcademicCriterionPayload,
  AcademicCriterionUpdatePayload,
} from "../types/academicEvaluation.types";
import { formatApiObject } from "../utils/apiMessages";

const COMPETENCIES_URL = "/api/competencias/";
const CAPACITIES_URL = "/api/capacidades/";
const CRITERIA_URL = "/api/criterios-calificacion/";

type PaginatedResponse<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

async function readError(response: Response) {
  const data = await response.json().catch(() => null);
  if (data && typeof data === "object") {
    const detail = formatApiObject(data as Record<string, unknown>);
    if (detail) return detail;
  }
  if (response.status === 403) {
    return "No tienes permiso para administrar este catalogo.";
  }
  return "No se pudo completar la operacion.";
}

function localApiPath(next: string) {
  if (!/^https?:\/\//i.test(next)) return next;
  const url = new URL(next);
  return `${url.pathname}${url.search}`;
}

async function getAllPages<T>(initialPath: string): Promise<T[]> {
  const records: T[] = [];
  let next: string | null = initialPath;
  let pageCount = 0;

  while (next && pageCount < 100) {
    const response = await authFetch(localApiPath(next));
    if (!response.ok) throw new Error(await readError(response));

    const data = (await response.json()) as PaginatedResponse<T> | T[];
    if (Array.isArray(data)) return [...records, ...data];

    records.push(...(data.results ?? []));
    next = data.next;
    pageCount += 1;
  }

  return records;
}

async function saveRecord<T>(
  url: string,
  payload: unknown,
  method: "POST" | "PATCH",
) {
  const response = await authFetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error(await readError(response));
  return (await response.json()) as T;
}

export function getEvaluationCourses() {
  return getAllPages<AcademicCourse>("/api/cursos/?ordering=nombre");
}

export function getAcademicCompetencies() {
  return getAllPages<AcademicCompetency>(`${COMPETENCIES_URL}?ordering=nombre`);
}

export function createAcademicCompetency(payload: AcademicCompetencyPayload) {
  return saveRecord<AcademicCompetency>(COMPETENCIES_URL, payload, "POST");
}

export function updateAcademicCompetency(
  id: number,
  payload: AcademicCompetencyUpdatePayload,
) {
  return saveRecord<AcademicCompetency>(
    `${COMPETENCIES_URL}${id}/`,
    payload,
    "PATCH",
  );
}

export function getAcademicCapacities() {
  return getAllPages<AcademicCapacity>(`${CAPACITIES_URL}?ordering=nombre`);
}

export function createAcademicCapacity(payload: AcademicCapacityPayload) {
  return saveRecord<AcademicCapacity>(CAPACITIES_URL, payload, "POST");
}

export function updateAcademicCapacity(
  id: number,
  payload: AcademicCapacityUpdatePayload,
) {
  return saveRecord<AcademicCapacity>(
    `${CAPACITIES_URL}${id}/`,
    payload,
    "PATCH",
  );
}

export function getAcademicCriteria() {
  return getAllPages<AcademicCriterion>(`${CRITERIA_URL}?ordering=nombre`);
}

export function createAcademicCriterion(payload: AcademicCriterionPayload) {
  return saveRecord<AcademicCriterion>(CRITERIA_URL, payload, "POST");
}

export function updateAcademicCriterion(
  id: number,
  payload: AcademicCriterionUpdatePayload,
) {
  return saveRecord<AcademicCriterion>(
    `${CRITERIA_URL}${id}/`,
    payload,
    "PATCH",
  );
}
