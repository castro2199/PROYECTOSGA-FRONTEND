import { authFetch } from "../../auth/services/authService";
import type {
  AIRecommendation,
  AIRecommendationPayload,
  AIRecommendationUpdatePayload,
  GenerateAIRecommendationPayload,
} from "../types/aiRecommendation.types";
import { formatApiObject } from "../utils/apiMessages";
import { fetchAllPages } from "../utils/pagination";

const AI_RECOMMENDATIONS_URL = "/api/recomendaciones-ia/";
const GENERATE_AI_RECOMMENDATION_URL = "/api/docente/recomendaciones-ia/generar/";

async function readError(response: Response) {
  const data = await response.json().catch(() => null);

  if (data && typeof data === "object") {
    const messages = formatApiObject(data as Record<string, unknown>);

    if (messages) return messages;
  }

  return "No se pudo completar la operacion.";
}

export async function getAIRecommendations(
  token: string,
): Promise<AIRecommendation[]> {
  return fetchAllPages<AIRecommendation>(AI_RECOMMENDATIONS_URL, token, readError);
}

export async function createAIRecommendation(
  token: string,
  payload: AIRecommendationPayload,
): Promise<AIRecommendation> {
  const response = await authFetch(AI_RECOMMENDATIONS_URL, {
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

  return (await response.json()) as AIRecommendation;
}

export async function generateAIRecommendation(
  token: string,
  payload: GenerateAIRecommendationPayload,
): Promise<AIRecommendation> {
  const response = await authFetch(GENERATE_AI_RECOMMENDATION_URL, {
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

  return (await response.json()) as AIRecommendation;
}

export async function updateAIRecommendation(
  token: string,
  id: number,
  payload: AIRecommendationUpdatePayload,
): Promise<AIRecommendation> {
  const response = await authFetch(`${AI_RECOMMENDATIONS_URL}${id}/`, {
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

  return (await response.json()) as AIRecommendation;
}
