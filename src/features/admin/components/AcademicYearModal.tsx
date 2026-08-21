import type { FormEvent } from "react";
import { useMemo, useState } from "react";
import type {
  AcademicYear,
  AcademicYearPayload,
} from "../types/academicYear.types";
import {
  ACADEMIC_LIFECYCLE_STATUS,
  type AcademicLifecycleStatus,
} from "../types/academicStatus.types";

type AcademicYearModalProps = {
  academicYear?: AcademicYear | null;
  error: string | null;
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (payload: AcademicYearPayload) => Promise<void>;
};

type FormState = {
  anio: string;
  fecha_inicio: string;
  fecha_fin: string;
  estado: AcademicLifecycleStatus;
};

const initialForm: FormState = {
  anio: String(new Date().getFullYear()),
  fecha_inicio: `${new Date().getFullYear()}-03-01`,
  fecha_fin: `${new Date().getFullYear()}-12-20`,
  estado: ACADEMIC_LIFECYCLE_STATUS.PLANIFICADO,
};

function validate(form: FormState) {
  const errors: Partial<Record<keyof FormState, string>> = {};
  const year = Number(form.anio);

  if (!Number.isInteger(year) || year < 2000 || year > 2100) {
    errors.anio = "Ingresa un año válido entre 2000 y 2100.";
  }

  if (!form.fecha_inicio) {
    errors.fecha_inicio = "Selecciona la fecha de inicio.";
  }

  if (!form.fecha_fin) {
    errors.fecha_fin = "Selecciona la fecha de fin.";
  }

  if (
    form.fecha_inicio &&
    form.fecha_fin &&
    form.fecha_fin < form.fecha_inicio
  ) {
    errors.fecha_fin = "La fecha de fin debe ser posterior al inicio.";
  }

  return errors;
}

export function AcademicYearModal({
  academicYear,
  error,
  isSaving,
  onClose,
  onSubmit,
}: AcademicYearModalProps) {
  const [form, setForm] = useState<FormState>(() =>
    academicYear
      ? {
          anio: String(academicYear.anio),
          fecha_inicio: academicYear.fecha_inicio,
          fecha_fin: academicYear.fecha_fin,
          estado: academicYear.estado,
        }
      : initialForm,
  );
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>(
    {},
  );

  const title = useMemo(
    () =>
      academicYear
        ? `Editar año académico ${form.anio || ""}`
        : `Nuevo año académico ${form.anio || ""}`,
    [academicYear, form.anio],
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
      anio: Number(form.anio),
      fecha_inicio: form.fecha_inicio,
      fecha_fin: form.fecha_fin,
      estado: form.estado,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/50 px-4">
      <div className="w-full max-w-xl rounded-2xl bg-white shadow-theme-xl">
        <div className="flex items-start justify-between border-b border-gray-100 px-6 py-5">
          <div>
            <p className="text-sm font-semibold text-brand-600">
              Gestión académica
            </p>
            <h2 className="mt-1 text-xl font-bold text-gray-900">{title}</h2>
          </div>
          <button
            className="rounded-lg px-3 py-1 text-2xl leading-none text-gray-400 hover:bg-gray-50 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-70"
            disabled={isSaving}
            onClick={onClose}
            type="button"
          >
            ×
          </button>
        </div>

        <form className="space-y-5 px-6 py-6" onSubmit={handleSubmit}>
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">
              Año
            </label>
            <input
              className={`h-11 w-full rounded-lg border px-4 text-sm outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-50 ${
                errors.anio ? "border-red-400" : "border-gray-200"
              }`}
              onChange={(event) => updateField("anio", event.target.value)}
              type="number"
              value={form.anio}
            />
            {errors.anio && (
              <p className="mt-2 text-sm text-red-600">{errors.anio}</p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Fecha de inicio
              </label>
              <input
                className={`h-11 w-full rounded-lg border px-4 text-sm outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-50 ${
                  errors.fecha_inicio ? "border-red-400" : "border-gray-200"
                }`}
                onChange={(event) =>
                  updateField("fecha_inicio", event.target.value)
                }
                type="date"
                value={form.fecha_inicio}
              />
              {errors.fecha_inicio && (
                <p className="mt-2 text-sm text-red-600">
                  {errors.fecha_inicio}
                </p>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Fecha de fin
              </label>
              <input
                className={`h-11 w-full rounded-lg border px-4 text-sm outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-50 ${
                  errors.fecha_fin ? "border-red-400" : "border-gray-200"
                }`}
                onChange={(event) =>
                  updateField("fecha_fin", event.target.value)
                }
                type="date"
                value={form.fecha_fin}
              />
              {errors.fecha_fin && (
                <p className="mt-2 text-sm text-red-600">{errors.fecha_fin}</p>
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
                : academicYear
                  ? "Guardar cambios"
                  : "Registrar año"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
