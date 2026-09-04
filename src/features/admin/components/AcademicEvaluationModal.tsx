import { useMemo, useState, type FormEvent } from "react";
import type { AcademicCourse } from "../types/academicCatalog.types";
import type {
  AcademicCapacity,
  AcademicCapacityPayload,
  AcademicCompetency,
  AcademicCompetencyPayload,
  AcademicCriterion,
  AcademicCriterionPayload,
  AcademicEvaluationEntity,
  AcademicEvaluationEntityType,
} from "../types/academicEvaluation.types";
import {
  BASIC_ACADEMIC_STATUS,
  basicAcademicStatusOptions,
  type BasicAcademicStatus,
} from "../types/academicStatus.types";

export type AcademicEvaluationSubmit =
  | { type: "competency"; payload: AcademicCompetencyPayload }
  | { type: "capacity"; payload: AcademicCapacityPayload }
  | { type: "criterion"; payload: AcademicCriterionPayload };

type Props = {
  capacities: AcademicCapacity[];
  competencies: AcademicCompetency[];
  courses: AcademicCourse[];
  entityType: AcademicEvaluationEntityType;
  error: string | null;
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (submission: AcademicEvaluationSubmit) => Promise<void>;
  record?: AcademicEvaluationEntity | null;
  selectedCourseId?: number | null;
};

type FormState = {
  capacidad: string;
  competencia: string;
  curso: string;
  descripcion: string;
  estado: BasicAcademicStatus;
  nombre: string;
};

const labels: Record<
  AcademicEvaluationEntityType,
  { singular: string; title: string }
> = {
  competency: { singular: "competencia", title: "Competencia" },
  capacity: { singular: "capacidad", title: "Capacidad" },
  criterion: { singular: "criterio", title: "Criterio de calificacion" },
};

function initialState(
  entityType: AcademicEvaluationEntityType,
  record: AcademicEvaluationEntity | null | undefined,
  selectedCourseId?: number | null,
): FormState {
  if (entityType === "competency" && record) {
    const competency = record as AcademicCompetency;
    return {
      capacidad: "",
      competencia: "",
      curso: String(competency.curso),
      descripcion: "",
      estado: competency.estado,
      nombre: competency.nombre,
    };
  }
  if (entityType === "capacity" && record) {
    const capacity = record as AcademicCapacity;
    return {
      capacidad: "",
      competencia: String(capacity.competencia),
      curso: String(capacity.curso_id),
      descripcion: "",
      estado: capacity.estado,
      nombre: capacity.nombre,
    };
  }
  if (entityType === "criterion" && record) {
    const criterion = record as AcademicCriterion;
    return {
      capacidad: String(criterion.capacidad),
      competencia: String(criterion.competencia_id),
      curso: String(criterion.curso_id),
      descripcion: criterion.descripcion ?? "",
      estado: criterion.estado,
      nombre: criterion.nombre,
    };
  }
  return {
    capacidad: "",
    competencia: "",
    curso: selectedCourseId ? String(selectedCourseId) : "",
    descripcion: "",
    estado: BASIC_ACADEMIC_STATUS.ACTIVO,
    nombre: "",
  };
}

export function AcademicEvaluationModal({
  capacities,
  competencies,
  courses,
  entityType,
  error,
  isSaving,
  onClose,
  onSubmit,
  record,
  selectedCourseId,
}: Props) {
  const [form, setForm] = useState(() =>
    initialState(entityType, record, selectedCourseId),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const meta = labels[entityType];
  const availableCompetencies = useMemo(
    () =>
      competencies.filter(
        (competency) => competency.curso === Number(form.curso),
      ),
    [competencies, form.curso],
  );
  const availableCapacities = useMemo(
    () =>
      capacities.filter(
        (capacity) => capacity.competencia === Number(form.competencia),
      ),
    [capacities, form.competencia],
  );

  const update = <T extends keyof FormState>(field: T, value: FormState[T]) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: "" }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors: Record<string, string> = {};
    if (!form.curso) nextErrors.curso = "Selecciona un curso.";
    if (entityType !== "competency" && !form.competencia) {
      nextErrors.competencia = "Selecciona una competencia.";
    }
    if (entityType === "criterion" && !form.capacidad) {
      nextErrors.capacidad = "Selecciona una capacidad.";
    }
    if (!form.nombre.trim()) nextErrors.nombre = `Ingresa el nombre de la ${meta.singular}.`;
    if (form.nombre.trim().length > 255) nextErrors.nombre = "El nombre no puede superar 255 caracteres.";
    if (form.descripcion.length > 500) nextErrors.descripcion = "La descripcion no puede superar 500 caracteres.";
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    if (entityType === "competency") {
      await onSubmit({
        type: entityType,
        payload: {
          curso: Number(form.curso),
          estado: form.estado,
          nombre: form.nombre.trim(),
        },
      });
    } else if (entityType === "capacity") {
      await onSubmit({
        type: entityType,
        payload: {
          competencia: Number(form.competencia),
          estado: form.estado,
          nombre: form.nombre.trim(),
        },
      });
    } else {
      await onSubmit({
        type: entityType,
        payload: {
          capacidad: Number(form.capacidad),
          descripcion: form.descripcion.trim() || null,
          estado: form.estado,
          nombre: form.nombre.trim(),
        },
      });
    }
  };

  const inputClass =
    "h-11 w-full rounded-lg border border-gray-200 bg-white px-4 text-sm outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-50";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/50 px-4 py-6">
      <div
        aria-labelledby="academic-evaluation-modal-title"
        aria-modal="true"
        className="max-h-full w-full max-w-2xl overflow-y-auto rounded-lg bg-white shadow-theme-xl"
        role="dialog"
      >
        <div className="flex items-start justify-between border-b border-gray-100 px-6 py-5">
          <div>
            <p className="text-sm font-semibold text-brand-600">Plan de evaluacion</p>
            <h2 className="mt-1 text-xl font-bold text-gray-900" id="academic-evaluation-modal-title">
              {record ? `Editar ${meta.singular}` : `Nueva ${meta.singular}`}
            </h2>
          </div>
          <button aria-label="Cerrar" className="h-9 w-9 rounded-lg text-xl text-gray-400 hover:bg-gray-50 hover:text-gray-700" disabled={isSaving} onClick={onClose} type="button">
            x
          </button>
        </div>

        <form className="space-y-5 px-6 py-6" onSubmit={handleSubmit}>
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700" htmlFor="evaluation-course">Curso</label>
            <select className={inputClass} disabled={isSaving} id="evaluation-course" onChange={(event) => { update("curso", event.target.value); update("competencia", ""); update("capacidad", ""); }} value={form.curso}>
              <option value="">Seleccionar curso</option>
              {courses.map((course) => <option key={course.id} value={course.id}>{course.nombre}</option>)}
            </select>
            {errors.curso && <p className="mt-2 text-sm text-red-600">{errors.curso}</p>}
          </div>

          {entityType !== "competency" && (
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700" htmlFor="evaluation-competency">Competencia</label>
              <select className={inputClass} disabled={!form.curso || isSaving} id="evaluation-competency" onChange={(event) => { update("competencia", event.target.value); update("capacidad", ""); }} value={form.competencia}>
                <option value="">Seleccionar competencia</option>
                {availableCompetencies.map((competency) => <option key={competency.id} value={competency.id}>{competency.nombre}</option>)}
              </select>
              {errors.competencia && <p className="mt-2 text-sm text-red-600">{errors.competencia}</p>}
            </div>
          )}

          {entityType === "criterion" && (
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700" htmlFor="evaluation-capacity">Capacidad</label>
              <select className={inputClass} disabled={!form.competencia || isSaving} id="evaluation-capacity" onChange={(event) => update("capacidad", event.target.value)} value={form.capacidad}>
                <option value="">Seleccionar capacidad</option>
                {availableCapacities.map((capacity) => <option key={capacity.id} value={capacity.id}>{capacity.nombre}</option>)}
              </select>
              {errors.capacidad && <p className="mt-2 text-sm text-red-600">{errors.capacidad}</p>}
            </div>
          )}

          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700" htmlFor="evaluation-name">Nombre</label>
            <input className={inputClass} id="evaluation-name" maxLength={255} onChange={(event) => update("nombre", event.target.value)} placeholder={`Nombre de la ${meta.singular}`} value={form.nombre} />
            {errors.nombre && <p className="mt-2 text-sm text-red-600">{errors.nombre}</p>}
          </div>

          {entityType === "criterion" && (
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700" htmlFor="evaluation-description">Descripcion</label>
              <textarea className="min-h-28 w-full rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-50" id="evaluation-description" maxLength={500} onChange={(event) => update("descripcion", event.target.value)} value={form.descripcion} />
              <div className="mt-1 flex justify-between text-xs text-gray-400"><span>{errors.descripcion}</span><span>{form.descripcion.length}/500</span></div>
            </div>
          )}

          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700" htmlFor="evaluation-status">Estado</label>
            <select className={inputClass} id="evaluation-status" onChange={(event) => update("estado", Number(event.target.value) as BasicAcademicStatus)} value={form.estado}>
              {basicAcademicStatusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </div>

          {error && <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

          <div className="flex flex-col-reverse gap-3 border-t border-gray-100 pt-5 sm:flex-row sm:justify-end">
            <button className="rounded-lg border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50" disabled={isSaving} onClick={onClose} type="button">Cancelar</button>
            <button className="rounded-lg bg-brand-500 px-5 py-3 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-60" disabled={isSaving} type="submit">{isSaving ? "Guardando..." : "Guardar"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
