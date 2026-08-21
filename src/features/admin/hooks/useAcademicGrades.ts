import { useCallback, useEffect, useState } from "react";
import {
  createAcademicGrade,
  getAcademicGrades,
  updateAcademicGrade,
} from "../services/academicGradesService";
import type {
  AcademicGrade,
  AcademicGradePayload,
  AcademicGradeUpdatePayload,
} from "../types/academicCatalog.types";

type UseAcademicGradesOptions = {
  estado?: number | null;
};

export function useAcademicGrades(
  token: string,
  options: UseAcademicGradesOptions = {},
) {
  const [academicGrades, setAcademicGrades] = useState<AcademicGrade[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const loadAcademicGrades = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await getAcademicGrades(token, {
        estado: options.estado,
      });
      setAcademicGrades(data);
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
    void loadAcademicGrades();
  }, [loadAcademicGrades]);

  const addAcademicGrade = async (payload: AcademicGradePayload) => {
    setIsSaving(true);
    setError(null);

    try {
      const created = await createAcademicGrade(token, payload);
      await loadAcademicGrades();
      return created;
    } catch (saveError) {
      const message =
        saveError instanceof Error
          ? saveError.message
          : "No se pudo registrar el grado.";
      setError(message);
      throw new Error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const editAcademicGrade = async (
    id: number,
    payload: AcademicGradeUpdatePayload,
  ) => {
    setIsSaving(true);
    setError(null);

    try {
      const updated = await updateAcademicGrade(token, id, payload);
      await loadAcademicGrades();
      return updated;
    } catch (saveError) {
      const message =
        saveError instanceof Error
          ? saveError.message
          : "No se pudo actualizar el grado.";
      setError(message);
      throw new Error(message);
    } finally {
      setIsSaving(false);
    }
  };

  return {
    academicGrades,
    addAcademicGrade,
    editAcademicGrade,
    error,
    isLoading,
    isSaving,
    reload: loadAcademicGrades,
  };
}
