import { useCallback, useEffect, useState } from "react";
import {
  createAcademicCourse,
  getAcademicCourses,
  updateAcademicCourse,
} from "../services/academicCoursesService";
import type {
  AcademicCourse,
  AcademicCoursePayload,
  AcademicCourseUpdatePayload,
} from "../types/academicCatalog.types";

type UseAcademicCoursesOptions = {
  estado?: number | null;
};

export function useAcademicCourses(
  token: string,
  options: UseAcademicCoursesOptions = {},
) {
  const [academicCourses, setAcademicCourses] = useState<AcademicCourse[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const loadAcademicCourses = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await getAcademicCourses(token, {
        estado: options.estado,
      });
      setAcademicCourses(data);
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
    void loadAcademicCourses();
  }, [loadAcademicCourses]);

  const addAcademicCourse = async (payload: AcademicCoursePayload) => {
    setIsSaving(true);
    setError(null);

    try {
      const created = await createAcademicCourse(token, payload);
      await loadAcademicCourses();
      return created;
    } catch (saveError) {
      const message =
        saveError instanceof Error
          ? saveError.message
          : "No se pudo registrar el curso.";
      setError(message);
      throw new Error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const editAcademicCourse = async (
    id: number,
    payload: AcademicCourseUpdatePayload,
  ) => {
    setIsSaving(true);
    setError(null);

    try {
      const updated = await updateAcademicCourse(token, id, payload);
      await loadAcademicCourses();
      return updated;
    } catch (saveError) {
      const message =
        saveError instanceof Error
          ? saveError.message
          : "No se pudo actualizar el curso.";
      setError(message);
      throw new Error(message);
    } finally {
      setIsSaving(false);
    }
  };

  return {
    academicCourses,
    addAcademicCourse,
    editAcademicCourse,
    error,
    isLoading,
    isSaving,
    reload: loadAcademicCourses,
  };
}
