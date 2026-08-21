import type { FormEvent } from "react";
import { useMemo, useState } from "react";
import {
  BASIC_ACADEMIC_STATUS,
  type BasicAcademicStatus,
} from "../types/academicStatus.types";
import type {
  AcademicGrade,
  AcademicSection,
  AcademicSectionPayload,
} from "../types/academicCatalog.types";

type AcademicSectionModalProps = {
  academicGrades: AcademicGrade[];
  academicSection?: AcademicSection | null;
  error: string | null;
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (payload: AcademicSectionPayload) => Promise<void>;
};

type FormState = {
  grado: string;
  nombre: string;
  estado: BasicAcademicStatus;
};

function buildInitialForm(
  academicSection: AcademicSection | null | undefined,
  academicGrades: AcademicGrade[],
): FormState {
  if (academicSection) {
    return {
      grado: String(academicSection.grado),
      nombre: academicSection.nombre,
      estado: academicSection.estado,
    };
  }

  const firstActiveGrade = academicGrades.find(
    (grade) => grade.estado === BASIC_ACADEMIC_STATUS.ACTIVO,
  );

  return {
    grado: firstActiveGrade ? String(firstActiveGrade.id) : "",
    nombre: "",
    estado: BASIC_ACADEMIC_STATUS.ACTIVO,
  };
}

function validate(form: FormState) {
  const errors: Partial<Record<keyof FormState, string>> = {};

  if (!form.grado) {
    errors.grado = "Selecciona un grado.";
  }

  if (!form.nombre.trim()) {
    errors.nombre = "Ingresa el nombre de la seccion.";
  }

  return errors;
}

export function AcademicSectionModal({
  academicGrades,
  academicSection,
  error,
  isSaving,
  onClose,
  onSubmit,
}: AcademicSectionModalProps) {
  const [form, setForm] = useState<FormState>(() =>
    buildInitialForm(academicSection, academicGrades),
  );
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>(
    {},
  );

  const title = useMemo(
    () =>
      academicSection
        ? `Editar seccion ${form.nombre || ""}`
        : "Nueva seccion",
    [academicSection, form.nombre],
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
      grado: Number(form.grado),
      nombre: form.nombre.trim(),
      estado: form.estado,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/50 px-4">
      <div className="w-full max-w-xl rounded-2xl bg-white shadow-theme-xl">
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
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">
              Grado
            </label>
            <select
              className={`h-11 w-full rounded-lg border bg-white px-4 text-sm outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-50 ${
                errors.grado ? "border-red-400" : "border-gray-200"
              }`}
              onChange={(event) => updateField("grado", event.target.value)}
              value={form.grado}
            >
              <option value="">Seleccionar grado</option>
              {academicGrades.map((grade) => (
                <option key={grade.id} value={grade.id}>
                  {grade.nombre}
                </option>
              ))}
            </select>
            {errors.grado && (
              <p className="mt-2 text-sm text-red-600">{errors.grado}</p>
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">
              Nombre
            </label>
            <input
              className={`h-11 w-full rounded-lg border px-4 text-sm outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-50 ${
                errors.nombre ? "border-red-400" : "border-gray-200"
              }`}
              onChange={(event) => updateField("nombre", event.target.value)}
              placeholder="A"
              type="text"
              value={form.nombre}
            />
            {errors.nombre && (
              <p className="mt-2 text-sm text-red-600">{errors.nombre}</p>
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
                : academicSection
                  ? "Guardar cambios"
                  : "Registrar seccion"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
