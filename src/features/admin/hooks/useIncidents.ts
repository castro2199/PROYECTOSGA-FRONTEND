import { useCallback, useEffect, useState } from "react";
import {
  createIncident,
  getIncidents,
  updateIncident,
} from "../services/incidentsService";
import type {
  Incident,
  IncidentPayload,
  IncidentUpdatePayload,
} from "../types/incident.types";

export function useIncidents(token: string) {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const loadIncidents = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await getIncidents(token);
      setIncidents(data);
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
    void loadIncidents();
  }, [loadIncidents]);

  const addIncident = async (payload: IncidentPayload) => {
    setIsSaving(true);
    setError(null);

    try {
      const created = await createIncident(token, payload);
      await loadIncidents();
      return created;
    } catch (saveError) {
      const message =
        saveError instanceof Error
          ? saveError.message
          : "No se pudo registrar la incidencia.";
      setError(message);
      throw new Error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const editIncident = async (id: number, payload: IncidentUpdatePayload) => {
    setIsSaving(true);
    setError(null);

    try {
      const updated = await updateIncident(token, id, payload);
      await loadIncidents();
      return updated;
    } catch (saveError) {
      const message =
        saveError instanceof Error
          ? saveError.message
          : "No se pudo actualizar la incidencia.";
      setError(message);
      throw new Error(message);
    } finally {
      setIsSaving(false);
    }
  };

  return {
    addIncident,
    editIncident,
    error,
    incidents,
    isLoading,
    isSaving,
    reload: loadIncidents,
  };
}
