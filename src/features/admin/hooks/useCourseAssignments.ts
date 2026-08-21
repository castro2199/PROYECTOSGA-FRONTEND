import { useCallback, useEffect, useState } from "react";
import {
  createCourseAssignment,
  getCourseAssignments,
  updateCourseAssignment,
} from "../services/courseAssignmentsService";
import type {
  CourseAssignment,
  CourseAssignmentPayload,
  CourseAssignmentUpdatePayload,
} from "../types/academicCatalog.types";

type UseCourseAssignmentsOptions = {
  estado?: number | null;
};

export function useCourseAssignments(
  token: string,
  options: UseCourseAssignmentsOptions = {},
) {
  const [courseAssignments, setCourseAssignments] = useState<
    CourseAssignment[]
  >([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const loadCourseAssignments = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await getCourseAssignments(token, {
        estado: options.estado,
      });
      setCourseAssignments(data);
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
    void loadCourseAssignments();
  }, [loadCourseAssignments]);

  const addCourseAssignment = async (payload: CourseAssignmentPayload) => {
    setIsSaving(true);
    setError(null);

    try {
      const created = await createCourseAssignment(token, payload);
      await loadCourseAssignments();
      return created;
    } catch (saveError) {
      const message =
        saveError instanceof Error
          ? saveError.message
          : "No se pudo registrar la asignacion.";
      setError(message);
      throw new Error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const editCourseAssignment = async (
    id: number,
    payload: CourseAssignmentUpdatePayload,
  ) => {
    setIsSaving(true);
    setError(null);

    try {
      const updated = await updateCourseAssignment(token, id, payload);
      await loadCourseAssignments();
      return updated;
    } catch (saveError) {
      const message =
        saveError instanceof Error
          ? saveError.message
          : "No se pudo actualizar la asignacion.";
      setError(message);
      throw new Error(message);
    } finally {
      setIsSaving(false);
    }
  };

  return {
    addCourseAssignment,
    courseAssignments,
    editCourseAssignment,
    error,
    isLoading,
    isSaving,
    reload: loadCourseAssignments,
  };
}
