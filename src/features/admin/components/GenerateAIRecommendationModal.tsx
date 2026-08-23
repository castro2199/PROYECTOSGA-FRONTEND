import type { FormEvent } from "react";
import { useState } from "react";
import type { CourseAssignment } from "../types/academicCatalog.types";
import type { AcademicPeriod } from "../types/academicPeriod.types";
import {
  ACADEMIC_LIFECYCLE_STATUS,
  COURSE_ASSIGNMENT_STATUS,
} from "../types/academicStatus.types";
import type { Enrollment } from "../types/enrollment.types";
import type { GenerateAIRecommendationPayload } from "../types/aiRecommendation.types";

type GenerateAIRecommendationModalProps = {
  academicPeriods: AcademicPeriod[];
  courseAssignments: CourseAssignment[];
  enrollments: Enrollment[];
  error: string | null;
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (payload: GenerateAIRecommendationPayload) => Promise<void>;
};

type FormState = {
  asignacion_curso: string;
  matricula: string;
  periodo_academico: string;
};

const initialForm: FormState = {
  asignacion_curso: "",
  matricula: "",
  periodo_academico: "",
};

function validate(form: FormState) {
  const errors: Partial<Record<keyof FormState, string>> = {};

  if (!form.matricula) {
    errors.matricula = "Selecciona una matricula.";
  }

  if (!form.asignacion_curso) {
    errors.asignacion_curso = "Selecciona una asignacion de curso.";
  }

  return errors;
}

function enrollmentLabel(enrollment: Enrollment) {
  return `${enrollment.estudiante_codigo} - ${enrollment.estudiante_nombre} / ${enrollment.seccion_label}`;
}

function assignmentLabel(assignment: CourseAssignment) {
  return `${assignment.curso_label} / ${assignment.seccion_label} / ${assignment.docente_label}`;
}

export function GenerateAIRecommendationModal({
  academicPeriods,
  courseAssignments,
  enrollments,
  error,
  isSaving,
  onClose,
  onSubmit,
}: GenerateAIRecommendationModalProps) {
  const [form, setForm] = useState<FormState>(initialForm);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>(
    {},
  );

  const activeEnrollments = enrollments.filter(
    (enrollment) => enrollment.estado === "ACTIVA",
  );
  const selectedEnrollment = enrollments.find(
    (enrollment) => String(enrollment.id) === form.matricula,
  );
  const activeAssignments = courseAssignments.filter(
    (assignment) =>
      assignment.estado === COURSE_ASSIGNMENT_STATUS.ACTIVO &&
      (!selectedEnrollment || assignment.seccion === selectedEnrollment.seccion),
  );
  const availablePeriods = academicPeriods.filter(
    (period) =>
      period.estado === ACADEMIC_LIFECYCLE_STATUS.PLANIFICADO ||
      period.estado === ACADEMIC_LIFECYCLE_STATUS.ACTIVO,
  );

  const updateField = <T extends keyof FormState>(
    field: T,
    value: FormState[T],
  ) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validationErrors = validate(form);

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    await onSubmit({
      asignacion_curso: Number(form.asignacion_curso),
      matricula: Number(form.matricula),
      periodo_academico: form.periodo_academico
        ? Number(form.periodo_academico)
        : null,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/50 px-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-theme-xl">
        <div className="flex items-start justify-between border-b border-gray-100 px-6 py-5">
          <div>
            <p className="text-sm font-semibold text-brand-600">IA academica</p>
            <h2 className="mt-1 text-xl font-bold text-gray-900">
              Generar recomendacion IA
            </h2>
          </div>
          <button
            className="rounded-lg px-3 py-1 text-2xl leading-none text-gray-400 hover:bg-gray-50 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-70"
            disabled={isSaving}
            onClick={onClose}
            type="button"
          >
            x
          </button>
        </div>

        <form className="space-y-5 px-6 py-6" onSubmit={handleSubmit}>
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">
              Matricula
            </label>
            <select
              className={`h-11 w-full rounded-lg border bg-white px-4 text-sm outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-50 ${
                errors.matricula ? "border-red-400" : "border-gray-200"
              }`}
              disabled={isSaving}
              onChange={(event) => updateField("matricula", event.target.value)}
              value={form.matricula}
            >
              <option value="">Seleccionar matricula</option>
              {activeEnrollments.map((enrollment) => (
                <option key={enrollment.id} value={enrollment.id}>
                  {enrollmentLabel(enrollment)}
                </option>
              ))}
            </select>
            {errors.matricula && (
              <p className="mt-2 text-sm text-red-600">{errors.matricula}</p>
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">
              Asignacion de curso
            </label>
            <select
              className={`h-11 w-full rounded-lg border bg-white px-4 text-sm outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-50 ${
                errors.asignacion_curso ? "border-red-400" : "border-gray-200"
              }`}
              disabled={isSaving}
              onChange={(event) =>
                updateField("asignacion_curso", event.target.value)
              }
              value={form.asignacion_curso}
            >
              <option value="">Seleccionar asignacion</option>
              {activeAssignments.map((assignment) => (
                <option key={assignment.id} value={assignment.id}>
                  {assignmentLabel(assignment)}
                </option>
              ))}
            </select>
            {errors.asignacion_curso && (
              <p className="mt-2 text-sm text-red-600">
                {errors.asignacion_curso}
              </p>
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">
              Periodo academico
            </label>
            <select
              className="h-11 w-full rounded-lg border border-gray-200 bg-white px-4 text-sm outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-50"
              disabled={isSaving}
              onChange={(event) =>
                updateField("periodo_academico", event.target.value)
              }
              value={form.periodo_academico}
            >
              <option value="">Sin periodo especifico</option>
              {availablePeriods.map((period) => (
                <option key={period.id} value={period.id}>
                  {period.nombre} - {period.anio_academico_label}
                </option>
              ))}
            </select>
          </div>

          {error && (
            <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex flex-col-reverse gap-3 border-t border-gray-100 pt-5 sm:flex-row sm:justify-end">
            <button
              className="rounded-lg border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-70"
              disabled={isSaving}
              onClick={onClose}
              type="button"
            >
              {isSaving ? "Espere..." : "Cancelar"}
            </button>
            <button
              className="rounded-lg bg-brand-500 px-5 py-3 text-sm font-semibold text-white shadow-theme-sm transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-70"
              disabled={isSaving}
              type="submit"
            >
              {isSaving ? "Generando..." : "Generar recomendacion"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
