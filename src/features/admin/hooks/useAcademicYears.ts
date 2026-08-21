import { useCallback, useEffect, useState } from "react";
import {
  createAcademicYear,
  getAcademicYears,
  updateAcademicYear,
} from "../services/academicYearsService";
import type {
  AcademicYear,
  AcademicYearPayload,
  AcademicYearUpdatePayload,
} from "../types/academicYear.types";

type UseAcademicYearsOptions = {
  estado?: number | null;
};

export function useAcademicYears(
  token: string,
  options: UseAcademicYearsOptions = {},
) {
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const loadAcademicYears = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await getAcademicYears(token, {
        estado: options.estado,
      });
      setAcademicYears(data);
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
    void loadAcademicYears();
  }, [loadAcademicYears]);

  const addAcademicYear = async (payload: AcademicYearPayload) => {
    setIsSaving(true);
    setError(null);

    try {
      const created = await createAcademicYear(token, payload);
      await loadAcademicYears();
      return created;
    } catch (saveError) {
      const message =
        saveError instanceof Error
          ? saveError.message
          : "No se pudo registrar el año académico.";
      setError(message);
      throw new Error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const editAcademicYear = async (
    id: number,
    payload: AcademicYearUpdatePayload,
  ) => {
    setIsSaving(true);
    setError(null);

    try {
      const updated = await updateAcademicYear(token, id, payload);
      await loadAcademicYears();
      return updated;
    } catch (saveError) {
      const message =
        saveError instanceof Error
          ? saveError.message
          : "No se pudo actualizar el año académico.";
      setError(message);
      throw new Error(message);
    } finally {
      setIsSaving(false);
    }
  };

  return {
    academicYears,
    addAcademicYear,
    editAcademicYear,
    error,
    isLoading,
    isSaving,
    reload: loadAcademicYears,
  };
}
