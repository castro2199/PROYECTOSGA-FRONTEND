import { useCallback, useEffect, useState } from "react";
import {
  createStudent,
  getStudents,
  updateStudent,
} from "../services/studentsService";
import type {
  Student,
  StudentPayload,
  StudentUpdatePayload,
} from "../types/student.types";

export function useStudents(token: string) {
  const [students, setStudents] = useState<Student[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const loadStudents = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await getStudents(token);
      setStudents(data);
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
    void loadStudents();
  }, [loadStudents]);

  const addStudent = async (payload: StudentPayload) => {
    setIsSaving(true);
    setError(null);

    try {
      const created = await createStudent(token, payload);
      await loadStudents();
      return created;
    } catch (saveError) {
      const message =
        saveError instanceof Error
          ? saveError.message
          : "No se pudo registrar el estudiante.";
      setError(message);
      throw new Error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const editStudent = async (id: number, payload: StudentUpdatePayload) => {
    setIsSaving(true);
    setError(null);

    try {
      const updated = await updateStudent(token, id, payload);
      await loadStudents();
      return updated;
    } catch (saveError) {
      const message =
        saveError instanceof Error
          ? saveError.message
          : "No se pudo actualizar el estudiante.";
      setError(message);
      throw new Error(message);
    } finally {
      setIsSaving(false);
    }
  };

  return {
    addStudent,
    editStudent,
    error,
    isLoading,
    isSaving,
    reload: loadStudents,
    students,
  };
}
