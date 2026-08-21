import type { FormEvent } from "react";
import { useMemo, useState } from "react";
import {
  ACADEMIC_LIFECYCLE_STATUS,
  COURSE_ASSIGNMENT_STATUS,
  type CourseAssignmentStatus,
} from "../types/academicStatus.types";
import type {
  AcademicCourse,
  AcademicSection,
  CourseAssignment,
  CourseAssignmentPayload,
  Teacher,
} from "../types/academicCatalog.types";
import type { AcademicYear } from "../types/academicYear.types";

type CourseAssignmentModalProps = {
  academicCourses: AcademicCourse[];
  academicSections: AcademicSection[];
  academicYears: AcademicYear[];
  courseAssignment?: CourseAssignment | null;
  error: string | null;
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (payload: CourseAssignmentPayload) => Promise<void>;
  teachers: Teacher[];
};

type FormState = {
  anio_academico: string;
  curso: string;
  docente: string;
  seccion: string;
  estado: CourseAssignmentStatus;
};

function buildInitialForm(
  courseAssignment: CourseAssignment | null | undefined,
): FormState {
  if (courseAssignment) {
    return {
      anio_academico: String(courseAssignment.anio_academico),
      curso: String(courseAssignment.curso),
      docente: String(courseAssignment.docente),
      seccion: String(courseAssignment.seccion),
      estado: courseAssignment.estado,
    };
  }

  return {
    anio_academico: "",
    curso: "",
    docente: "",
    seccion: "",
    estado: COURSE_ASSIGNMENT_STATUS.ACTIVO,
  };
}

function getTeacherLabel(teacher: Teacher) {
  return (
    teacher.full_name ||
    [teacher.first_name_display, teacher.last_name_display]
      .filter(Boolean)
      .join(" ") ||
    teacher.username_display ||
    `Docente ${teacher.id}`
  );
}

function isAssignableAcademicYear(academicYear: AcademicYear) {
  return (
    academicYear.estado === ACADEMIC_LIFECYCLE_STATUS.PLANIFICADO ||
    academicYear.estado === ACADEMIC_LIFECYCLE_STATUS.ACTIVO
  );
}

function validate(form: FormState) {
  const errors: Partial<Record<keyof FormState, string>> = {};

  if (!form.anio_academico) {
    errors.anio_academico = "Selecciona un año academico.";
  }

  if (!form.seccion) {
    errors.seccion = "Selecciona una seccion.";
  }

  if (!form.curso) {
    errors.curso = "Selecciona un curso.";
  }

  if (!form.docente) {
    errors.docente = "Selecciona un docente.";
  }

  return errors;
}

export function CourseAssignmentModal({
  academicCourses,
  academicSections,
  academicYears,
  courseAssignment,
  error,
  isSaving,
  onClose,
  onSubmit,
  teachers,
}: CourseAssignmentModalProps) {
  const [form, setForm] = useState<FormState>(() =>
    buildInitialForm(courseAssignment),
  );
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>(
    {},
  );

  const title = useMemo(
    () =>
      courseAssignment
        ? `Editar asignacion ${courseAssignment.curso_label}`
        : "Nueva asignacion de curso",
    [courseAssignment],
  );
  const assignableAcademicYears = academicYears.filter(
    isAssignableAcademicYear,
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
      curso: Number(form.curso),
      docente: Number(form.docente),
      seccion: Number(form.seccion),
      estado: form.estado,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/50 px-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-theme-xl">
        <div className="flex items-start justify-between border-b border-gray-100 px-6 py-5">
          <div>
            <p className="text-sm font-semibold text-brand-600">
              Gestion academica
            </p>
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
          <div className="grid gap-4 sm:grid-cols-2">
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
                {academicSections.map((section) => (
                  <option key={section.id} value={section.id}>
                    {section.grado_label} - {section.nombre}
                  </option>
                ))}
              </select>
              {errors.seccion && (
                <p className="mt-2 text-sm text-red-600">{errors.seccion}</p>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Curso
              </label>
              <select
                className={`h-11 w-full rounded-lg border bg-white px-4 text-sm outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-50 ${
                  errors.curso ? "border-red-400" : "border-gray-200"
                }`}
                onChange={(event) => updateField("curso", event.target.value)}
                value={form.curso}
              >
                <option value="">Seleccionar curso</option>
                {academicCourses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.nombre}
                  </option>
                ))}
              </select>
              {errors.curso && (
                <p className="mt-2 text-sm text-red-600">{errors.curso}</p>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Docente
              </label>
              <select
                className={`h-11 w-full rounded-lg border bg-white px-4 text-sm outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-50 ${
                  errors.docente ? "border-red-400" : "border-gray-200"
                }`}
                onChange={(event) => updateField("docente", event.target.value)}
                value={form.docente}
              >
                <option value="">Seleccionar docente</option>
                {teachers.map((teacher) => (
                  <option key={teacher.id} value={teacher.id}>
                    {getTeacherLabel(teacher)}
                  </option>
                ))}
              </select>
              {errors.docente && (
                <p className="mt-2 text-sm text-red-600">{errors.docente}</p>
              )}
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
                : courseAssignment
                  ? "Guardar cambios"
                  : "Registrar asignacion"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
