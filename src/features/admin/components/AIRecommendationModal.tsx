import type { FormEvent } from "react";
import { useMemo, useState } from "react";
import type { Teacher } from "../types/academicCatalog.types";
import type { AcademicPeriod } from "../types/academicPeriod.types";
import {
  ACADEMIC_LIFECYCLE_STATUS,
} from "../types/academicStatus.types";
import type { Enrollment } from "../types/enrollment.types";
import type {
  AIRecommendation,
  AIRecommendationPayload,
} from "../types/aiRecommendation.types";

type AIRecommendationModalProps = {
  academicPeriods: AcademicPeriod[];
  enrollments: Enrollment[];
  error: string | null;
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (payload: AIRecommendationPayload) => Promise<void>;
  recommendation?: AIRecommendation | null;
  teachers: Teacher[];
};

type FormState = {
  fecha_generacion: string;
  matricula: string;
  periodo_academico: string;
  resumen_contexto: string;
  revisado_por_docente: string;
  texto_generado: string;
  texto_revisado: string;
};

const initialForm: FormState = {
  fecha_generacion: toDateTimeLocal(new Date().toISOString()),
  matricula: "",
  periodo_academico: "",
  resumen_contexto: "",
  revisado_por_docente: "",
  texto_generado: "",
  texto_revisado: "",
};

function toDateTimeLocal(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 16);
}

function toApiDateTime(value: string) {
  return new Date(value).toISOString();
}

function buildInitialForm(
  recommendation: AIRecommendation | null | undefined,
): FormState {
  if (!recommendation) return initialForm;

  return {
    fecha_generacion: toDateTimeLocal(recommendation.fecha_generacion),
    matricula: String(recommendation.matricula),
    periodo_academico: recommendation.periodo_academico
      ? String(recommendation.periodo_academico)
      : "",
    resumen_contexto: recommendation.resumen_contexto,
    revisado_por_docente: recommendation.revisado_por_docente
      ? String(recommendation.revisado_por_docente)
      : "",
    texto_generado: recommendation.texto_generado,
    texto_revisado: recommendation.texto_revisado ?? "",
  };
}

function validate(form: FormState) {
  const errors: Partial<Record<keyof FormState, string>> = {};

  if (!form.matricula) {
    errors.matricula = "Selecciona una matricula.";
  }

  if (!form.fecha_generacion) {
    errors.fecha_generacion = "Selecciona la fecha de generacion.";
  }

  if (!form.resumen_contexto.trim()) {
    errors.resumen_contexto = "Ingresa el resumen de contexto.";
  }

  if (!form.texto_generado.trim()) {
    errors.texto_generado = "Ingresa el texto generado.";
  }

  return errors;
}

function enrollmentLabel(enrollment: Enrollment) {
  return `${enrollment.estudiante_codigo} - ${enrollment.estudiante_nombre} / ${enrollment.seccion_label}`;
}

export function AIRecommendationModal({
  academicPeriods,
  enrollments,
  error,
  isSaving,
  onClose,
  onSubmit,
  recommendation,
  teachers,
}: AIRecommendationModalProps) {
  const [form, setForm] = useState<FormState>(() =>
    buildInitialForm(recommendation),
  );
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>(
    {},
  );

  const title = useMemo(
    () =>
      recommendation
        ? `Editar recomendacion ${recommendation.estudiante_codigo}`
        : "Nueva recomendacion IA",
    [recommendation],
  );
  const availableEnrollments = enrollments.filter(
    (enrollment) =>
      enrollment.estado === "ACTIVA" ||
      String(enrollment.id) === form.matricula,
  );
  const availablePeriods = academicPeriods.filter(
    (period) =>
      period.estado === ACADEMIC_LIFECYCLE_STATUS.PLANIFICADO ||
      period.estado === ACADEMIC_LIFECYCLE_STATUS.ACTIVO ||
      String(period.id) === form.periodo_academico,
  );
  const availableTeachers = teachers.filter(
    (teacher) =>
      teacher.activo || String(teacher.id) === form.revisado_por_docente,
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
      activo: recommendation?.activo ?? true,
      estado_revision: recommendation?.estado_revision ?? "PENDIENTE",
      fecha_generacion: toApiDateTime(form.fecha_generacion),
      matricula: Number(form.matricula),
      periodo_academico: form.periodo_academico
        ? Number(form.periodo_academico)
        : null,
      resumen_contexto: form.resumen_contexto.trim(),
      revisado_por_docente: form.revisado_por_docente
        ? Number(form.revisado_por_docente)
        : null,
      texto_generado: form.texto_generado.trim(),
      texto_revisado: form.texto_revisado.trim() || null,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/50 px-4">
      <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white shadow-theme-xl">
        <div className="flex items-start justify-between border-b border-gray-100 px-6 py-5">
          <div>
            <p className="text-sm font-semibold text-brand-600">Seguimiento</p>
            <h2 className="mt-1 text-xl font-bold text-gray-900">{title}</h2>
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
              {availableEnrollments.map((enrollment) => (
                <option key={enrollment.id} value={enrollment.id}>
                  {enrollmentLabel(enrollment)}
                </option>
              ))}
            </select>
            {errors.matricula && (
              <p className="mt-2 text-sm text-red-600">{errors.matricula}</p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
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
                <option value="">Sin periodo</option>
                {availablePeriods.map((period) => (
                  <option key={period.id} value={period.id}>
                    {period.nombre} - {period.anio_academico_label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Docente revisor
              </label>
              <select
                className="h-11 w-full rounded-lg border border-gray-200 bg-white px-4 text-sm outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-50"
                disabled={isSaving}
                onChange={(event) =>
                  updateField("revisado_por_docente", event.target.value)
                }
                value={form.revisado_por_docente}
              >
                <option value="">Sin revisor</option>
                {availableTeachers.map((teacher) => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.full_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Fecha de generacion
              </label>
              <input
                className={`h-11 w-full rounded-lg border px-4 text-sm outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-50 ${
                  errors.fecha_generacion ? "border-red-400" : "border-gray-200"
                }`}
                disabled={isSaving}
                onChange={(event) =>
                  updateField("fecha_generacion", event.target.value)
                }
                type="datetime-local"
                value={form.fecha_generacion}
              />
              {errors.fecha_generacion && (
                <p className="mt-2 text-sm text-red-600">
                  {errors.fecha_generacion}
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">
              Resumen de contexto
            </label>
            <textarea
              className={`min-h-24 w-full rounded-lg border px-4 py-3 text-sm outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-50 ${
                errors.resumen_contexto ? "border-red-400" : "border-gray-200"
              }`}
              disabled={isSaving}
              onChange={(event) =>
                updateField("resumen_contexto", event.target.value)
              }
              placeholder="Resume asistencias, incidencias, observaciones y rendimiento usado por la IA."
              value={form.resumen_contexto}
            />
            {errors.resumen_contexto && (
              <p className="mt-2 text-sm text-red-600">
                {errors.resumen_contexto}
              </p>
            )}
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Texto generado
              </label>
              <textarea
                className={`min-h-40 w-full rounded-lg border px-4 py-3 text-sm outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-50 ${
                  errors.texto_generado ? "border-red-400" : "border-gray-200"
                }`}
                disabled={isSaving}
                onChange={(event) =>
                  updateField("texto_generado", event.target.value)
                }
                placeholder="Recomendacion propuesta por IA."
                value={form.texto_generado}
              />
              {errors.texto_generado && (
                <p className="mt-2 text-sm text-red-600">
                  {errors.texto_generado}
                </p>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Texto revisado
              </label>
              <textarea
                className="min-h-40 w-full rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-50"
                disabled={isSaving}
                onChange={(event) =>
                  updateField("texto_revisado", event.target.value)
                }
                placeholder="Version revisada por el docente o directivo."
                value={form.texto_revisado}
              />
            </div>
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
              {isSaving
                ? "Guardando..."
                : recommendation
                  ? "Guardar cambios"
                  : "Registrar recomendacion"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
