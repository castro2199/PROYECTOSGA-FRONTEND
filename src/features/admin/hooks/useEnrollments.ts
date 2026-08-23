import { useCallback, useEffect, useState } from "react";
import {
  createEnrollment,
  getEnrollments,
  updateEnrollment,
} from "../services/enrollmentsService";
import type {
  Enrollment,
  EnrollmentPayload,
  EnrollmentStatus,
  EnrollmentUpdatePayload,
} from "../types/enrollment.types";

type UseEnrollmentsOptions = {
  estado?: EnrollmentStatus | null;
};

export function useEnrollments(
  token: string,
  options: UseEnrollmentsOptions = {},
) {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const loadEnrollments = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await getEnrollments(token, {
        estado: options.estado,
      });
      setEnrollments(data);
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
    void loadEnrollments();
  }, [loadEnrollments]);

  const addEnrollment = async (payload: EnrollmentPayload) => {
    setIsSaving(true);
    setError(null);

    try {
      const created = await createEnrollment(token, payload);
      await loadEnrollments();
      return created;
    } catch (saveError) {
      const message =
        saveError instanceof Error
          ? saveError.message
          : "No se pudo registrar la matricula.";
      setError(message);
      throw new Error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const editEnrollment = async (
    id: number,
    payload: EnrollmentUpdatePayload,
  ) => {
    setIsSaving(true);
    setError(null);

    try {
      const updated = await updateEnrollment(token, id, payload);
      await loadEnrollments();
      return updated;
    } catch (saveError) {
      const message =
        saveError instanceof Error
          ? saveError.message
          : "No se pudo actualizar la matricula.";
      setError(message);
      throw new Error(message);
    } finally {
      setIsSaving(false);
    }
  };

  return {
    addEnrollment,
    editEnrollment,
    enrollments,
    error,
    isLoading,
    isSaving,
    reload: loadEnrollments,
  };
}
