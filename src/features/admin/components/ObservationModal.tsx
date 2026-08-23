import type { FormEvent } from "react";
import { useMemo, useState } from "react";
import type { CourseAssignment, Teacher } from "../types/academicCatalog.types";
import type { Enrollment } from "../types/enrollment.types";
import type {
  Observation,
  ObservationPayload,
} from "../types/observation.types";

type ObservationModalProps = {
  courseAssignments: CourseAssignment[];
  enrollments: Enrollment[];
  error: string | null;
  isSaving: boolean;
  observation?: Observation | null;
  onClose: () => void;
  onSubmit: (payload: ObservationPayload) => Promise<void>;
  teachers: Teacher[];
};

type FormState = {
  asignacion_curso: string;
  categoria: string;
  descripcion: string;
  docente: string;
  fecha: string;
  matricula: string;
};

const initialForm: FormState = {
  asignacion_curso: "",
  categoria: "",
  descripcion: "",
  docente: "",
  fecha: toDateTimeLocal(new Date().toISOString()),
  matricula: "",
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
  observation: Observation | null | undefined,
): FormState {
  if (!observation) return initialForm;

  return {
    asignacion_curso: observation.asignacion_curso
      ? String(observation.asignacion_curso)
      : "",
    categoria: observation.categoria,
    descripcion: observation.descripcion,
    docente: String(observation.docente),
    fecha: toDateTimeLocal(observation.fecha),
    matricula: String(observation.matricula),
  };
}

function validate(form: FormState) {
  const errors: Partial<Record<keyof FormState, string>> = {};

  if (!form.matricula) {
    errors.matricula = "Selecciona una matricula.";
  }

  if (!form.docente) {
    errors.docente = "Selecciona un docente.";
  }

  if (!form.fecha) {
    errors.fecha = "Selecciona la fecha.";
  }

  if (!form.categoria.trim()) {
    errors.categoria = "Ingresa una categoria.";
  }

  if (!form.descripcion.trim()) {
    errors.descripcion = "Ingresa la descripcion de la observacion.";
  }

  return errors;
}

function enrollmentLabel(enrollment: Enrollment) {
  return `${enrollment.estudiante_codigo} - ${enrollment.estudiante_nombre} / ${enrollment.seccion_label}`;
}

function assignmentLabel(assignment: CourseAssignment) {
  return `${assignment.curso_label} / ${assignment.seccion_label} / ${assignment.docente_label}`;
}

export function ObservationModal({
  courseAssignments,
  enrollments,
  error,
  isSaving,
  observation,
  onClose,
  onSubmit,
  teachers,
}: ObservationModalProps) {
  const [form, setForm] = useState<FormState>(() =>
    buildInitialForm(observation),
  );
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>(
    {},
  );

  const title = useMemo(
    () =>
      observation
        ? `Editar observacion ${observation.estudiante_codigo}`
        : "Nueva observacion",
    [observation],
  );
  const availableEnrollments = enrollments.filter(
    (enrollment) =>
      enrollment.estado === "ACTIVA" ||
      String(enrollment.id) === form.matricula,
  );
  const availableTeachers = teachers.filter(
    (teacher) => teacher.activo || String(teacher.id) === form.docente,
  );
  const availableAssignments = courseAssignments.filter(
    (assignment) =>
      assignment.estado === 1 ||
      String(assignment.id) === form.asignacion_curso,
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
      activo: observation?.activo ?? true,
      asignacion_curso: form.asignacion_curso
        ? Number(form.asignacion_curso)
        : null,
      categoria: form.categoria.trim(),
      descripcion: form.descripcion.trim(),
      docente: Number(form.docente),
      fecha: toApiDateTime(form.fecha),
      matricula: Number(form.matricula),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/50 px-4">
      <div className="w-full max-w-3xl rounded-2xl bg-white shadow-theme-xl">
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

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Docente
              </label>
              <select
                className={`h-11 w-full rounded-lg border bg-white px-4 text-sm outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-50 ${
                  errors.docente ? "border-red-400" : "border-gray-200"
                }`}
                disabled={isSaving}
                onChange={(event) => updateField("docente", event.target.value)}
                value={form.docente}
              >
                <option value="">Seleccionar docente</option>
                {availableTeachers.map((teacher) => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.full_name}
                  </option>
                ))}
              </select>
              {errors.docente && (
                <p className="mt-2 text-sm text-red-600">{errors.docente}</p>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Fecha
              </label>
              <input
                className={`h-11 w-full rounded-lg border px-4 text-sm outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-50 ${
                  errors.fecha ? "border-red-400" : "border-gray-200"
                }`}
                disabled={isSaving}
                onChange={(event) => updateField("fecha", event.target.value)}
                type="datetime-local"
                value={form.fecha}
              />
              {errors.fecha && (
                <p className="mt-2 text-sm text-red-600">{errors.fecha}</p>
              )}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">
              Asignacion de curso
            </label>
            <select
              className="h-11 w-full rounded-lg border border-gray-200 bg-white px-4 text-sm outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-50"
              disabled={isSaving}
              onChange={(event) =>
                updateField("asignacion_curso", event.target.value)
              }
              value={form.asignacion_curso}
            >
              <option value="">Sin asignacion especifica</option>
              {availableAssignments.map((assignment) => (
                <option key={assignment.id} value={assignment.id}>
                  {assignmentLabel(assignment)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">
              Categoria
            </label>
            <input
              className={`h-11 w-full rounded-lg border px-4 text-sm outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-50 ${
                errors.categoria ? "border-red-400" : "border-gray-200"
              }`}
              disabled={isSaving}
              maxLength={100}
              onChange={(event) => updateField("categoria", event.target.value)}
              placeholder="Ej. Participacion, conducta, avance academico"
              value={form.categoria}
            />
            {errors.categoria && (
              <p className="mt-2 text-sm text-red-600">{errors.categoria}</p>
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">
              Descripcion
            </label>
            <textarea
              className={`min-h-32 w-full rounded-lg border px-4 py-3 text-sm outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-50 ${
                errors.descripcion ? "border-red-400" : "border-gray-200"
              }`}
              disabled={isSaving}
              onChange={(event) => updateField("descripcion", event.target.value)}
              placeholder="Describe la observacion registrada por el docente."
              value={form.descripcion}
            />
            {errors.descripcion && (
              <p className="mt-2 text-sm text-red-600">{errors.descripcion}</p>
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
                : observation
                  ? "Guardar cambios"
                  : "Registrar observacion"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
