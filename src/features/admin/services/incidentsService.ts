import { authFetch } from "../../auth/services/authService";
import type {
  Incident,
  IncidentPayload,
  IncidentUpdatePayload,
} from "../types/incident.types";
import { formatApiObject } from "../utils/apiMessages";
import { fetchAllPages } from "../utils/pagination";

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
  return fetchAllPages<Incident>(INCIDENTS_URL, token, readError);
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
