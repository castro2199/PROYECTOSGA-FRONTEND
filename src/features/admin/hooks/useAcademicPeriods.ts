import { useCallback, useEffect, useState } from "react";
import {
  createAcademicPeriod,
  getAcademicPeriods,
  updateAcademicPeriod,
} from "../services/academicPeriodsService";
import type {
  AcademicPeriod,
  AcademicPeriodPayload,
  AcademicPeriodUpdatePayload,
} from "../types/academicPeriod.types";

type UseAcademicPeriodsOptions = {
  estado?: number | null;
};

export function useAcademicPeriods(
  token: string,
  options: UseAcademicPeriodsOptions = {},
) {
  const [academicPeriods, setAcademicPeriods] = useState<AcademicPeriod[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const loadAcademicPeriods = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await getAcademicPeriods(token, {
        estado: options.estado,
      });
      setAcademicPeriods(data);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "No se pudo cargar el listado.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [options.estado, token]);

  useEffect(() => {
    void loadAcademicPeriods();
  }, [loadAcademicPeriods]);

  const addAcademicPeriod = async (payload: AcademicPeriodPayload) => {
    setIsSaving(true);
    setError(null);

    try {
      const created = await createAcademicPeriod(token, payload);
      await loadAcademicPeriods();
      return created;
    } catch (saveError) {
      const message =
        saveError instanceof Error
          ? saveError.message
          : "No se pudo registrar el periodo académico.";
      setError(message);
      throw new Error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const editAcademicPeriod = async (
    id: number,
    payload: AcademicPeriodUpdatePayload,
  ) => {
    setIsSaving(true);
    setError(null);

    try {
      const updated = await updateAcademicPeriod(token, id, payload);
      await loadAcademicPeriods();
      return updated;
    } catch (saveError) {
      const message =
        saveError instanceof Error
          ? saveError.message
          : "No se pudo actualizar el periodo académico.";
      setError(message);
      throw new Error(message);
    } finally {
      setIsSaving(false);
    }
  };

  return {
    academicPeriods,
    addAcademicPeriod,
    editAcademicPeriod,
    error,
    isLoading,
    isSaving,
    reload: loadAcademicPeriods,
  };
}
