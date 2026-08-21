import { useMemo, useState } from "react";
import type { Guardian } from "../types/guardian.types";
import type { Student } from "../types/student.types";
import {
  guardianRelationshipOptions,
  type GuardianRelationship,
  type GuardianStudentLinkPayload,
} from "../types/guardianStudentLink.types";

type AssignStudentModalProps = {
  error: string | null;
  guardian: Guardian;
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (payload: GuardianStudentLinkPayload) => Promise<void>;
  students: Student[];
};

export function AssignStudentModal({
  error,
  guardian,
  isSaving,
  onClose,
  onSubmit,
  students,
}: AssignStudentModalProps) {
  const [isPrincipal, setIsPrincipal] = useState(true);
  const [relationship, setRelationship] =
    useState<GuardianRelationship>("PADRE");
  const [search, setSearch] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(
    null,
  );
  const [validationError, setValidationError] = useState<string | null>(null);

  const filteredStudents = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    if (!normalizedSearch) return students;

    return students.filter((student) =>
      [
        student.codigo_estudiante,
        student.dni_display,
        student.full_name,
        student.username_display,
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch),
    );
  }, [search, students]);

  const handleSubmit = async () => {
    if (!selectedStudentId) {
      setValidationError("Selecciona un estudiante.");
      return;
    }

    setValidationError(null);
    await onSubmit({
      apoderado: guardian.id,
      es_principal: isPrincipal,
      estudiante: selectedStudentId,
      parentesco: relationship,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/50 px-4">
      <div className="w-full max-w-3xl rounded-2xl bg-white shadow-theme-xl">
        <div className="flex items-start justify-between border-b border-gray-100 px-6 py-5">
          <div>
            <p className="text-sm font-semibold text-brand-600">
              Asignar estudiante
            </p>
            <h2 className="mt-1 text-xl font-bold text-gray-900">
              {guardian.full_name}
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

        <div className="space-y-5 px-6 py-6">
          <div className="grid gap-4 sm:grid-cols-[1fr_180px_140px]">
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Buscar estudiante
              </label>
              <input
                className="h-11 w-full rounded-lg border border-gray-200 px-4 text-sm outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-50"
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar por nombre, codigo, DNI o usuario"
                type="text"
                value={search}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Parentesco
              </label>
              <select
                className="h-11 w-full rounded-lg border border-gray-200 bg-white px-4 text-sm outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-50"
                onChange={(event) =>
                  setRelationship(event.target.value as GuardianRelationship)
                }
                value={relationship}
              >
                {guardianRelationshipOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <label className="mt-7 inline-flex h-11 items-center gap-2 rounded-lg border border-gray-200 px-4 text-sm font-semibold text-gray-700">
              <input
                checked={isPrincipal}
                className="h-4 w-4 accent-brand-500"
                onChange={(event) => setIsPrincipal(event.target.checked)}
                type="checkbox"
              />
              Principal
            </label>
          </div>

          <div className="max-h-80 overflow-y-auto rounded-xl border border-gray-200">
            {filteredStudents.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-gray-500">
                No se encontraron estudiantes.
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filteredStudents.map((student) => (
                  <label
                    className={`flex cursor-pointer items-center gap-3 px-4 py-3 transition hover:bg-gray-50 ${
                      selectedStudentId === student.id ? "bg-brand-50" : ""
                    }`}
                    key={student.id}
                  >
                    <input
                      checked={selectedStudentId === student.id}
                      className="h-4 w-4 accent-brand-500"
                      onChange={() => setSelectedStudentId(student.id)}
                      type="radio"
                    />
                    <span className="min-w-0">
                      <span className="block font-semibold text-gray-900">
                        {student.full_name}
                      </span>
                      <span className="mt-1 block text-xs text-gray-500">
                        {student.codigo_estudiante} | DNI {student.dni_display}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {(validationError || error) && (
            <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
              {validationError ?? error}
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
              onClick={() => void handleSubmit()}
              type="button"
            >
              {isSaving ? "Asignando..." : "Asignar estudiante"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
