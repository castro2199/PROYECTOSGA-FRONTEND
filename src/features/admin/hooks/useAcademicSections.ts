import { useCallback, useEffect, useState } from "react";
import {
  createAcademicSection,
  getAcademicSections,
  updateAcademicSection,
} from "../services/academicSectionsService";
import type {
  AcademicSection,
  AcademicSectionPayload,
  AcademicSectionUpdatePayload,
} from "../types/academicCatalog.types";

type UseAcademicSectionsOptions = {
  estado?: number | null;
};

export function useAcademicSections(
  token: string,
  options: UseAcademicSectionsOptions = {},
) {
  const [academicSections, setAcademicSections] = useState<AcademicSection[]>(
    [],
  );
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const loadAcademicSections = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await getAcademicSections(token, {
        estado: options.estado,
      });
      setAcademicSections(data);
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
    void loadAcademicSections();
  }, [loadAcademicSections]);

  const addAcademicSection = async (payload: AcademicSectionPayload) => {
    setIsSaving(true);
    setError(null);

    try {
      const created = await createAcademicSection(token, payload);
      await loadAcademicSections();
      return created;
    } catch (saveError) {
      const message =
        saveError instanceof Error
          ? saveError.message
          : "No se pudo registrar la seccion.";
      setError(message);
      throw new Error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const editAcademicSection = async (
    id: number,
    payload: AcademicSectionUpdatePayload,
  ) => {
    setIsSaving(true);
    setError(null);

    try {
      const updated = await updateAcademicSection(token, id, payload);
      await loadAcademicSections();
      return updated;
    } catch (saveError) {
      const message =
        saveError instanceof Error
          ? saveError.message
          : "No se pudo actualizar la seccion.";
      setError(message);
      throw new Error(message);
    } finally {
      setIsSaving(false);
    }
  };

  return {
    academicSections,
    addAcademicSection,
    editAcademicSection,
    error,
    isLoading,
    isSaving,
    reload: loadAcademicSections,
  };
}
