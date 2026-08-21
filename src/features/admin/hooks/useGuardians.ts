import { useCallback, useEffect, useState } from "react";
import {
  createGuardian,
  getGuardians,
  updateGuardian,
} from "../services/guardiansService";
import type {
  Guardian,
  GuardianPayload,
  GuardianUpdatePayload,
} from "../types/guardian.types";

export function useGuardians(token: string) {
  const [guardians, setGuardians] = useState<Guardian[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const loadGuardians = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await getGuardians(token);
      setGuardians(data);
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
    void loadGuardians();
  }, [loadGuardians]);

  const addGuardian = async (payload: GuardianPayload) => {
    setIsSaving(true);
    setError(null);

    try {
      const created = await createGuardian(token, payload);
      await loadGuardians();
      return created;
    } catch (saveError) {
      const message =
        saveError instanceof Error
          ? saveError.message
          : "No se pudo registrar el apoderado.";
      setError(message);
      throw new Error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const editGuardian = async (id: number, payload: GuardianUpdatePayload) => {
    setIsSaving(true);
    setError(null);

    try {
      const updated = await updateGuardian(token, id, payload);
      await loadGuardians();
      return updated;
    } catch (saveError) {
      const message =
        saveError instanceof Error
          ? saveError.message
          : "No se pudo actualizar el apoderado.";
      setError(message);
      throw new Error(message);
    } finally {
      setIsSaving(false);
    }
  };

  return {
    addGuardian,
    editGuardian,
    error,
    guardians,
    isLoading,
    isSaving,
    reload: loadGuardians,
  };
}
