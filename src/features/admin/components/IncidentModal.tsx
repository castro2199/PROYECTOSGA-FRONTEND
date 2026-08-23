import type { FormEvent } from "react";
import { useMemo, useState } from "react";
import type { Enrollment } from "../types/enrollment.types";
import type {
  Incident,
  IncidentLevel,
  IncidentPayload,
  IncidentType,
} from "../types/incident.types";
import {
  incidentLevelOptions,
  incidentTypeOptions,
} from "../types/incident.types";

type IncidentModalProps = {
  enrollments: Enrollment[];
  error: string | null;
  incident?: Incident | null;
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (payload: IncidentPayload) => Promise<void>;
};

type FormState = {
  descripcion: string;
  fecha_registro: string;
  matricula: string;
  nivel: "" | IncidentLevel;
  tipo: "" | IncidentType;
};

const initialForm: FormState = {
  descripcion: "",
  fecha_registro: toDateTimeLocal(new Date().toISOString()),
  matricula: "",
  nivel: "",
  tipo: "",
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

function buildInitialForm(incident: Incident | null | undefined): FormState {
  if (!incident) return initialForm;

  return {
    descripcion: incident.descripcion,
    fecha_registro: toDateTimeLocal(incident.fecha_registro),
    matricula: String(incident.matricula),
    nivel: incident.nivel ?? "",
    tipo: incident.tipo,
  };
}

function validate(form: FormState) {
  const errors: Partial<Record<keyof FormState, string>> = {};

  if (!form.matricula) {
    errors.matricula = "Selecciona una matricula.";
  }

  if (!form.tipo) {
    errors.tipo = "Selecciona el tipo de incidencia.";
  }

  if (!form.descripcion.trim()) {
    errors.descripcion = "Ingresa la descripcion de la incidencia.";
  }

  if (!form.fecha_registro) {
    errors.fecha_registro = "Selecciona la fecha de registro.";
  }

  return errors;
}

function enrollmentLabel(enrollment: Enrollment) {
  return `${enrollment.estudiante_codigo} - ${enrollment.estudiante_nombre} / ${enrollment.seccion_label}`;
}

export function IncidentModal({
  enrollments,
  error,
  incident,
  isSaving,
  onClose,
  onSubmit,
}: IncidentModalProps) {
  const [form, setForm] = useState<FormState>(() => buildInitialForm(incident));
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>(
    {},
  );

  const title = useMemo(
    () =>
      incident
        ? `Editar incidencia ${incident.estudiante_codigo}`
        : "Nueva incidencia",
    [incident],
  );
  const availableEnrollments = enrollments.filter(
    (enrollment) =>
      enrollment.estado === "ACTIVA" ||
      String(enrollment.id) === form.matricula,
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
      descripcion: form.descripcion.trim(),
      estado: incident?.estado ?? "ABIERTA",
      fecha_registro: toApiDateTime(form.fecha_registro),
      matricula: Number(form.matricula),
      nivel: form.nivel || null,
      tipo: form.tipo as IncidentType,
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

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Tipo
              </label>
              <select
                className={`h-11 w-full rounded-lg border bg-white px-4 text-sm outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-50 ${
                  errors.tipo ? "border-red-400" : "border-gray-200"
                }`}
                disabled={isSaving}
                onChange={(event) =>
                  updateField("tipo", event.target.value as FormState["tipo"])
                }
                value={form.tipo}
              >
                <option value="">Seleccionar tipo</option>
                {incidentTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {errors.tipo && (
                <p className="mt-2 text-sm text-red-600">{errors.tipo}</p>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Nivel
              </label>
              <select
                className="h-11 w-full rounded-lg border border-gray-200 bg-white px-4 text-sm outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-50"
                disabled={isSaving}
                onChange={(event) =>
                  updateField("nivel", event.target.value as FormState["nivel"])
                }
                value={form.nivel}
              >
                <option value="">Sin nivel</option>
                {incidentLevelOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Fecha de registro
              </label>
              <input
                className={`h-11 w-full rounded-lg border px-4 text-sm outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-50 ${
                  errors.fecha_registro ? "border-red-400" : "border-gray-200"
                }`}
                disabled={isSaving}
                onChange={(event) =>
                  updateField("fecha_registro", event.target.value)
                }
                type="datetime-local"
                value={form.fecha_registro}
              />
              {errors.fecha_registro && (
                <p className="mt-2 text-sm text-red-600">
                  {errors.fecha_registro}
                </p>
              )}
            </div>
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
              placeholder="Describe la incidencia registrada."
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
                : incident
                  ? "Guardar cambios"
                  : "Registrar incidencia"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
