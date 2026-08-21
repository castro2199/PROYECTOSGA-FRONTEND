import { useCallback, useEffect, useState } from "react";
import {
  createTeacher,
  getTeachers,
  updateTeacher,
} from "../services/teachersService";
import type {
  Teacher,
  TeacherPayload,
  TeacherUpdatePayload,
} from "../types/academicCatalog.types";

export function useTeachers(token: string) {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const loadTeachers = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await getTeachers(token);
      setTeachers(data);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "No se pudo cargar el listado de docentes.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void loadTeachers();
  }, [loadTeachers]);

  const addTeacher = async (payload: TeacherPayload) => {
    setIsSaving(true);
    setError(null);

    try {
      const created = await createTeacher(token, payload);
      await loadTeachers();
      return created;
    } catch (saveError) {
      const message =
        saveError instanceof Error
          ? saveError.message
          : "No se pudo registrar el docente.";
      setError(message);
      throw new Error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const editTeacher = async (id: number, payload: TeacherUpdatePayload) => {
    setIsSaving(true);
    setError(null);

    try {
      const updated = await updateTeacher(token, id, payload);
      await loadTeachers();
      return updated;
    } catch (saveError) {
      const message =
        saveError instanceof Error
          ? saveError.message
          : "No se pudo actualizar el docente.";
      setError(message);
      throw new Error(message);
    } finally {
      setIsSaving(false);
    }
  };

  return {
    addTeacher,
    editTeacher,
    error,
    isLoading,
    isSaving,
    reload: loadTeachers,
    teachers,
  };
}
