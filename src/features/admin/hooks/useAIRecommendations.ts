import { useCallback, useEffect, useState } from "react";
import {
  createAIRecommendation,
  generateAIRecommendation,
  getAIRecommendations,
  updateAIRecommendation,
} from "../services/aiRecommendationsService";
import type {
  AIRecommendation,
  AIRecommendationPayload,
  AIRecommendationUpdatePayload,
  GenerateAIRecommendationPayload,
} from "../types/aiRecommendation.types";

export function useAIRecommendations(token: string) {
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>(
    [],
  );
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const loadRecommendations = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await getAIRecommendations(token);
      setRecommendations(data);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "No se pudo cargar el listado.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void loadRecommendations();
  }, [loadRecommendations]);

  const addRecommendation = async (payload: AIRecommendationPayload) => {
    setIsSaving(true);
    setError(null);

    try {
      const created = await createAIRecommendation(token, payload);
      await loadRecommendations();
      return created;
    } catch (saveError) {
      const message =
        saveError instanceof Error
          ? saveError.message
          : "No se pudo registrar la recomendacion IA.";
      setError(message);
      throw new Error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const editRecommendation = async (
    id: number,
    payload: AIRecommendationUpdatePayload,
  ) => {
    setIsSaving(true);
    setError(null);

    try {
      const updated = await updateAIRecommendation(token, id, payload);
      await loadRecommendations();
      return updated;
    } catch (saveError) {
      const message =
        saveError instanceof Error
          ? saveError.message
          : "No se pudo actualizar la recomendacion IA.";
      setError(message);
      throw new Error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const generateRecommendation = async (
    payload: GenerateAIRecommendationPayload,
  ) => {
    setIsSaving(true);
    setError(null);

    try {
      const generated = await generateAIRecommendation(token, payload);
      await loadRecommendations();
      return generated;
    } catch (saveError) {
      const message =
        saveError instanceof Error
          ? saveError.message
          : "No se pudo generar la recomendacion IA.";
      setError(message);
      throw new Error(message);
    } finally {
      setIsSaving(false);
    }
  };

  return {
    addRecommendation,
    editRecommendation,
    error,
    generateRecommendation,
    isLoading,
    isSaving,
    recommendations,
    reload: loadRecommendations,
  };
}
