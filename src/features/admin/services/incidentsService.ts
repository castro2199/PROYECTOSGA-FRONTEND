import { authFetch } from "../../auth/services/authService";
import type {
  Incident,
  IncidentPayload,
  IncidentUpdatePayload,
  PaginatedIncidentResponse,
} from "../types/incident.types";
import { formatApiObject } from "../utils/apiMessages";

const INCIDENTS_URL = "/api/incidencias/";

async function readError(response: Response) {
  const data = await response.json().catch(() => null);

  if (data && typeof data === "object") {
    const messages = formatApiObject(data as Record<string, unknown>);

    if (messages) return messages;
  }

  return "No se pudo completar la operacion.";
}

export async function getIncidents(token: string): Promise<Incident[]> {
  const response = await authFetch(INCIDENTS_URL, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(await readError(response));
  }

  const data = (await response.json()) as PaginatedIncidentResponse;
  return data.results ?? [];
}

export async function createIncident(
  token: string,
  payload: IncidentPayload,
): Promise<Incident> {
  const response = await authFetch(INCIDENTS_URL, {
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

  return (await response.json()) as Incident;
}

export async function updateIncident(
  token: string,
  id: number,
  payload: IncidentUpdatePayload,
): Promise<Incident> {
  const response = await authFetch(`${INCIDENTS_URL}${id}/`, {
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

  return (await response.json()) as Incident;
}
