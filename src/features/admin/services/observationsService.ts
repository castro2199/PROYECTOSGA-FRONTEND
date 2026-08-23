import { authFetch } from "../../auth/services/authService";
import type {
  Observation,
  ObservationPayload,
  ObservationUpdatePayload,
  PaginatedObservationResponse,
} from "../types/observation.types";
import { formatApiObject } from "../utils/apiMessages";

const OBSERVATIONS_URL = "/api/observaciones/";

async function readError(response: Response) {
  const data = await response.json().catch(() => null);

  if (data && typeof data === "object") {
    const messages = formatApiObject(data as Record<string, unknown>);

    if (messages) return messages;
  }

  return "No se pudo completar la operacion.";
}

export async function getObservations(token: string): Promise<Observation[]> {
  const response = await authFetch(OBSERVATIONS_URL, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(await readError(response));
  }

  const data = (await response.json()) as PaginatedObservationResponse;
  return data.results ?? [];
}

export async function createObservation(
  token: string,
  payload: ObservationPayload,
): Promise<Observation> {
  const response = await authFetch(OBSERVATIONS_URL, {
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

  return (await response.json()) as Observation;
}

export async function updateObservation(
  token: string,
  id: number,
  payload: ObservationUpdatePayload,
): Promise<Observation> {
  const response = await authFetch(`${OBSERVATIONS_URL}${id}/`, {
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

  return (await response.json()) as Observation;
}
