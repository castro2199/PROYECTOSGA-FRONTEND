import type { FormEvent } from "react";
import { useMemo, useState } from "react";
import {
  ACADEMIC_LIFECYCLE_STATUS,
  BASIC_ACADEMIC_STATUS,
} from "../types/academicStatus.types";
import type { AcademicSection } from "../types/academicCatalog.types";
import type { AcademicYear } from "../types/academicYear.types";
import type { Enrollment, EnrollmentPayload } from "../types/enrollment.types";
import type { Student } from "../types/student.types";

type EnrollmentModalProps = {
  academicSections: AcademicSection[];
  academicYears: AcademicYear[];
  enrollment?: Enrollment | null;
  error: string | null;
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (payload: EnrollmentPayload) => Promise<void>;
  students: Student[];
};

type FormState = {
  anio_academico: string;
  estudiante: string;
  fecha_matricula: string;
  seccion: string;
};

const initialForm: FormState = {
  anio_academico: "",
  estudiante: "",
  fecha_matricula: new Date().toISOString().slice(0, 10),
  seccion: "",
};

function buildInitialForm(enrollment: Enrollment | null | undefined): FormState {
  if (!enrollment) return initialForm;

  return {
    anio_academico: String(enrollment.anio_academico),
    estudiante: String(enrollment.estudiante),
    fecha_matricula: enrollment.fecha_matricula,
    seccion: String(enrollment.seccion),
  };
}

function validate(form: FormState) {
  const errors: Partial<Record<keyof FormState, string>> = {};

  if (!form.estudiante) {
    errors.estudiante = "Selecciona un estudiante.";
  }

  if (!form.seccion) {
    errors.seccion = "Selecciona una seccion.";
  }

  if (!form.anio_academico) {
    errors.anio_academico = "Selecciona un año academico.";
  }

  if (!form.fecha_matricula) {
    errors.fecha_matricula = "Selecciona la fecha de matricula.";
  }

  return errors;
}

function isAssignableAcademicYear(academicYear: AcademicYear) {
  return (
    academicYear.estado === ACADEMIC_LIFECYCLE_STATUS.PLANIFICADO ||
    academicYear.estado === ACADEMIC_LIFECYCLE_STATUS.ACTIVO
  );
}

export function EnrollmentModal({
  academicSections,
  academicYears,
  enrollment,
  error,
  isSaving,
  onClose,
  onSubmit,
  students,
}: EnrollmentModalProps) {
  const [form, setForm] = useState<FormState>(() =>
    buildInitialForm(enrollment),
  );
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>(
    {},
  );

  const title = useMemo(
    () =>
      enrollment
        ? `Editar matricula ${enrollment.estudiante_codigo}`
        : "Nueva matricula",
    [enrollment],
  );
  const activeStudents = students.filter(
    (student) => student.activo || String(student.id) === form.estudiante,
  );
  const activeSections = academicSections.filter(
    (section) =>
      section.estado === BASIC_ACADEMIC_STATUS.ACTIVO ||
      String(section.id) === form.seccion,
  );
  const assignableAcademicYears = academicYears.filter(
    (academicYear) =>
      isAssignableAcademicYear(academicYear) ||
      String(academicYear.id) === form.anio_academico,
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
      anio_academico: Number(form.anio_academico),
      estado: enrollment?.estado ?? "ACTIVA",
      estudiante: Number(form.estudiante),
      fecha_matricula: form.fecha_matricula,
      seccion: Number(form.seccion),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/50 px-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-theme-xl">
        <div className="flex items-start justify-between border-b border-gray-100 px-6 py-5">
          <div>
            <p className="text-sm font-semibold text-brand-600">Matriculas</p>
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
              Estudiante
            </label>
            <select
              className={`h-11 w-full rounded-lg border bg-white px-4 text-sm outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-50 ${
                errors.estudiante ? "border-red-400" : "border-gray-200"
              }`}
              onChange={(event) => updateField("estudiante", event.target.value)}
              value={form.estudiante}
            >
              <option value="">Seleccionar estudiante</option>
              {activeStudents.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.codigo_estudiante} - {student.full_name}
                </option>
              ))}
            </select>
            {errors.estudiante && (
              <p className="mt-2 text-sm text-red-600">{errors.estudiante}</p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Seccion
              </label>
              <select
                className={`h-11 w-full rounded-lg border bg-white px-4 text-sm outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-50 ${
                  errors.seccion ? "border-red-400" : "border-gray-200"
                }`}
                onChange={(event) => updateField("seccion", event.target.value)}
                value={form.seccion}
              >
                <option value="">Seleccionar seccion</option>
                {activeSections.map((section) => (
                  <option key={section.id} value={section.id}>
                    {section.grado_label} - {section.nombre}
                  </option>
                ))}
              </select>
              {errors.seccion && (
                <p className="mt-2 text-sm text-red-600">{errors.seccion}</p>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Año academico
              </label>
              <select
                className={`h-11 w-full rounded-lg border bg-white px-4 text-sm outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-50 ${
                  errors.anio_academico ? "border-red-400" : "border-gray-200"
                }`}
                onChange={(event) =>
                  updateField("anio_academico", event.target.value)
                }
                value={form.anio_academico}
              >
                <option value="">Seleccionar año</option>
                {assignableAcademicYears.map((year) => (
                  <option key={year.id} value={year.id}>
                    {year.anio} - {year.estado_label}
                  </option>
                ))}
              </select>
              {errors.anio_academico && (
                <p className="mt-2 text-sm text-red-600">
                  {errors.anio_academico}
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">
              Fecha de matricula
            </label>
            <input
              className={`h-11 w-full rounded-lg border px-4 text-sm outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-50 ${
                errors.fecha_matricula ? "border-red-400" : "border-gray-200"
              }`}
              onChange={(event) =>
                updateField("fecha_matricula", event.target.value)
              }
              type="date"
              value={form.fecha_matricula}
            />
            {errors.fecha_matricula && (
              <p className="mt-2 text-sm text-red-600">
                {errors.fecha_matricula}
              </p>
            )}
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
                : enrollment
                  ? "Guardar cambios"
                  : "Registrar matricula"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
