import { useCallback, useEffect, useState } from "react";
import {
  createObservation,
  getObservations,
  updateObservation,
} from "../services/observationsService";
import type {
  Observation,
  ObservationPayload,
  ObservationUpdatePayload,
} from "../types/observation.types";

export function useObservations(token: string) {
  const [observations, setObservations] = useState<Observation[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const loadObservations = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await getObservations(token);
      setObservations(data);
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
    void loadObservations();
  }, [loadObservations]);

  const addObservation = async (payload: ObservationPayload) => {
    setIsSaving(true);
    setError(null);

    try {
      const created = await createObservation(token, payload);
      await loadObservations();
      return created;
    } catch (saveError) {
      const message =
        saveError instanceof Error
          ? saveError.message
          : "No se pudo registrar la observacion.";
      setError(message);
      throw new Error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const editObservation = async (
    id: number,
    payload: ObservationUpdatePayload,
  ) => {
    setIsSaving(true);
    setError(null);

    try {
      const updated = await updateObservation(token, id, payload);
      await loadObservations();
      return updated;
    } catch (saveError) {
      const message =
        saveError instanceof Error
          ? saveError.message
          : "No se pudo actualizar la observacion.";
      setError(message);
      throw new Error(message);
    } finally {
      setIsSaving(false);
    }
  };

  return {
    addObservation,
    editObservation,
    error,
    isLoading,
    isSaving,
    observations,
    reload: loadObservations,
  };
}
