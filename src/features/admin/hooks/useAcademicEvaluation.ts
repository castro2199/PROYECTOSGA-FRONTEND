import { useCallback, useEffect, useState } from "react";
import {
  createAcademicCapacity,
  createAcademicCompetency,
  createAcademicCriterion,
  getAcademicCapacities,
  getAcademicCompetencies,
  getAcademicCriteria,
  getEvaluationCourses,
  updateAcademicCapacity,
  updateAcademicCompetency,
  updateAcademicCriterion,
} from "../services/academicEvaluationService";
import type { AcademicCourse } from "../types/academicCatalog.types";
import type {
  AcademicCapacity,
  AcademicCapacityPayload,
  AcademicCapacityUpdatePayload,
  AcademicCompetency,
  AcademicCompetencyPayload,
  AcademicCompetencyUpdatePayload,
  AcademicCriterion,
  AcademicCriterionPayload,
  AcademicCriterionUpdatePayload,
} from "../types/academicEvaluation.types";

export function useAcademicEvaluation() {
  const [courses, setCourses] = useState<AcademicCourse[]>([]);
  const [competencies, setCompetencies] = useState<AcademicCompetency[]>([]);
  const [capacities, setCapacities] = useState<AcademicCapacity[]>([]);
  const [criteria, setCriteria] = useState<AcademicCriterion[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [courseData, competencyData, capacityData, criterionData] =
        await Promise.all([
          getEvaluationCourses(),
          getAcademicCompetencies(),
          getAcademicCapacities(),
          getAcademicCriteria(),
        ]);
      setCourses(courseData);
      setCompetencies(competencyData);
      setCapacities(capacityData);
      setCriteria(criterionData);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "No se pudo cargar el plan de evaluacion.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async <T,>(operation: () => Promise<T>) => {
    setIsSaving(true);
    setError(null);
    try {
      const result = await operation();
      await load();
      return result;
    } catch (saveError) {
      const message =
        saveError instanceof Error
          ? saveError.message
          : "No se pudo guardar el registro.";
      setError(message);
      throw new Error(message);
    } finally {
      setIsSaving(false);
    }
  };

  return {
    capacities,
    competencies,
    courses,
    criteria,
    error,
    isLoading,
    isSaving,
    reload: load,
    createCapacity: (payload: AcademicCapacityPayload) =>
      save(() => createAcademicCapacity(payload)),
    createCompetency: (payload: AcademicCompetencyPayload) =>
      save(() => createAcademicCompetency(payload)),
    createCriterion: (payload: AcademicCriterionPayload) =>
      save(() => createAcademicCriterion(payload)),
    updateCapacity: (id: number, payload: AcademicCapacityUpdatePayload) =>
      save(() => updateAcademicCapacity(id, payload)),
    updateCompetency: (
      id: number,
      payload: AcademicCompetencyUpdatePayload,
    ) => save(() => updateAcademicCompetency(id, payload)),
    updateCriterion: (id: number, payload: AcademicCriterionUpdatePayload) =>
      save(() => updateAcademicCriterion(id, payload)),
  };
}
