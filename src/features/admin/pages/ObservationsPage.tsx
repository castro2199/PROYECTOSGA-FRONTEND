import { useMemo, useState } from "react";
import { PaginationControls } from "../../../shared/components/PaginationControls";
import { useClientPagination } from "../../../shared/hooks/useClientPagination";
import { ConfirmStatusModal } from "../components/ConfirmStatusModal";
import { ObservationModal } from "../components/ObservationModal";
import { useCourseAssignments } from "../hooks/useCourseAssignments";
import { useEnrollments } from "../hooks/useEnrollments";
import { useObservations } from "../hooks/useObservations";
import { useTeachers } from "../hooks/useTeachers";
import type {
  Observation,
  ObservationPayload,
} from "../types/observation.types";
import { observationStatusOptions } from "../types/observation.types";

type ObservationsPageProps = {
  token: string;
};

type StatusAction = {
  label: string;
  activo: boolean;
};

const statusStyles: Record<string, string> = {
  active: "border-success-100 bg-success-50 text-success-700",
  inactive: "border-red-100 bg-red-50 text-red-700",
};

function formatDateTime(value: string | null) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("es-PE", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

export function ObservationsPage({ token }: ObservationsPageProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [selectedObservation, setSelectedObservation] =
    useState<Observation | null>(null);
  const [statusAction, setStatusAction] = useState<StatusAction | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [statusTarget, setStatusTarget] = useState<Observation | null>(null);

  const {
    addObservation,
    editObservation,
    error,
    isLoading,
    isSaving,
    observations,
    reload,
  } = useObservations(token);
  const {
    enrollments,
    error: enrollmentsError,
    isLoading: isLoadingEnrollments,
    reload: reloadEnrollments,
  } = useEnrollments(token);
  const {
    courseAssignments,
    error: assignmentsError,
    isLoading: isLoadingAssignments,
    reload: reloadAssignments,
  } = useCourseAssignments(token);
  const {
    error: teachersError,
    isLoading: isLoadingTeachers,
    reload: reloadTeachers,
    teachers,
  } = useTeachers(token);

  const filteredObservations = useMemo(() => {
    if (statusFilter === "") return observations;

    const isActive = statusFilter === "true";
    return observations.filter((observation) => observation.activo === isActive);
  }, [observations, statusFilter]);
  const pagination = useClientPagination(filteredObservations);
  const isCatalogLoading =
    isLoadingEnrollments || isLoadingAssignments || isLoadingTeachers;
  const isBusy = isLoading || isSaving || isCatalogLoading;
  const catalogError = enrollmentsError ?? assignmentsError ?? teachersError;
  const activeEnrollments = enrollments.filter(
    (enrollment) => enrollment.estado === "ACTIVA",
  );
  const activeTeachers = teachers.filter((teacher) => teacher.activo);
  const canCreate = activeEnrollments.length > 0 && activeTeachers.length > 0;

  const handleSubmit = async (payload: ObservationPayload) => {
    setModalError(null);

    try {
      if (selectedObservation) {
        await editObservation(selectedObservation.id, payload);
      } else {
        await addObservation(payload);
      }
      setIsModalOpen(false);
      setSelectedObservation(null);
    } catch (saveError) {
      setModalError(
        saveError instanceof Error
          ? saveError.message
          : "No se pudo registrar la observacion.",
      );
    }
  };

  const reloadAll = () => {
    void reload();
    void reloadEnrollments();
    void reloadAssignments();
    void reloadTeachers();
  };

  const openCreateModal = () => {
    setSelectedObservation(null);
    setModalError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (observation: Observation) => {
    setSelectedObservation(observation);
    setModalError(null);
    setIsModalOpen(true);
  };

  const openStatusModal = (observation: Observation, activo: boolean) => {
    if (observation.activo === activo) return;

    setStatusTarget(observation);
    setStatusAction({
      activo,
      label: activo ? "activar" : "desactivar",
    });
    setStatusError(null);
  };

  const confirmStatusChange = async () => {
    if (!statusTarget || !statusAction) return;
    setStatusError(null);

    try {
      await editObservation(statusTarget.id, {
        activo: statusAction.activo,
      });
      setStatusTarget(null);
      setStatusAction(null);
    } catch (saveError) {
      setStatusError(
        saveError instanceof Error
          ? saveError.message
          : "No se pudo cambiar el estado de la observacion.",
      );
    }
  };

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-theme-xs sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-brand-600">Seguimiento</p>
          <h2 className="mt-2 text-2xl font-bold text-gray-900">
            Observaciones
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            Registra observaciones docentes sobre el avance, conducta y
            desempeno de los estudiantes matriculados.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-70"
            disabled={isBusy}
            onClick={reloadAll}
            type="button"
          >
            {isLoading || isCatalogLoading ? "Actualizando..." : "Actualizar"}
          </button>
          <select
            className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-50"
            disabled={isBusy}
            onChange={(event) => setStatusFilter(event.target.value)}
            value={statusFilter}
          >
            <option value="">Todos</option>
            {observationStatusOptions.map((option) => (
              <option key={String(option.value)} value={String(option.value)}>
                {option.label}
              </option>
            ))}
          </select>
          <button
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white shadow-theme-sm transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-70"
            disabled={isBusy || !canCreate}
            onClick={openCreateModal}
            type="button"
          >
            <img
              alt=""
              className="h-4 w-4 brightness-0 invert"
              src="/admin-icons/plus.svg"
            />
            Nueva observacion
          </button>
        </div>
      </section>

      {(error || catalogError) && (
        <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error ?? catalogError}
        </div>
      )}

      {!canCreate && !isCatalogLoading && (
        <div className="rounded-lg border border-brand-100 bg-brand-50 px-4 py-3 text-sm text-brand-700">
          Para registrar una observacion necesitas al menos una matricula activa
          y un docente activo.
        </div>
      )}

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-theme-xs">
        <div className="border-b border-gray-100 px-6 py-4">
          <h3 className="text-lg font-bold text-gray-900">Listado</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1220px] text-left">
            <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
              <tr>
                <th className="px-6 py-4 font-semibold">Codigo</th>
                <th className="px-6 py-4 font-semibold">Estudiante</th>
                <th className="px-6 py-4 font-semibold">Docente</th>
                <th className="px-6 py-4 font-semibold">Curso</th>
                <th className="px-6 py-4 font-semibold">Categoria</th>
                <th className="px-6 py-4 font-semibold">Fecha</th>
                <th className="px-6 py-4 font-semibold">Estado</th>
                <th className="px-6 py-4 text-right font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {isLoading ? (
                <tr>
                  <td className="px-6 py-8 text-center text-gray-500" colSpan={8}>
                    Cargando observaciones...
                  </td>
                </tr>
              ) : filteredObservations.length === 0 ? (
                <tr>
                  <td className="px-6 py-8 text-center text-gray-500" colSpan={8}>
                    No hay observaciones registradas.
                  </td>
                </tr>
              ) : (
                pagination.pageItems.map((observation) => (
                  <tr className="hover:bg-gray-50" key={observation.id}>
                    <td className="px-6 py-4 font-semibold text-gray-900">
                      {observation.estudiante_codigo}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      <div className="max-w-xs">
                        <p className="font-semibold text-gray-900">
                          {observation.estudiante_label}
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                          {observation.seccion_label}
                        </p>
                        <p className="mt-1 line-clamp-2 text-xs text-gray-500">
                          {observation.descripcion}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {observation.docente_label}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {observation.asignacion_curso_label ?? "-"}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {observation.categoria}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {formatDateTime(observation.fecha)}
                    </td>
                    <td className="px-6 py-4">
                      <select
                        aria-label={`Cambiar estado de observacion ${observation.id}`}
                        className={`rounded-lg border px-3 py-2 text-xs font-semibold outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-50 disabled:cursor-not-allowed disabled:opacity-70 ${
                          observation.activo
                            ? statusStyles.active
                            : statusStyles.inactive
                        }`}
                        disabled={isSaving}
                        onChange={(event) =>
                          openStatusModal(
                            observation,
                            event.target.value === "true",
                          )
                        }
                        value={String(observation.activo)}
                      >
                        {observationStatusOptions.map((option) => (
                          <option
                            key={String(option.value)}
                            value={String(option.value)}
                          >
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand-600 disabled:cursor-not-allowed disabled:opacity-70"
                          disabled={isSaving}
                          onClick={() => openEditModal(observation)}
                          type="button"
                        >
                          <img
                            alt=""
                            className="h-4 w-4"
                            src="/admin-icons/pencil.svg"
                          />
                          Editar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <PaginationControls currentPage={pagination.currentPage} isLoading={isBusy} itemLabel="observaciones" onPageChange={pagination.setCurrentPage} pageSize={pagination.pageSize} totalItems={pagination.totalItems} totalPages={pagination.totalPages} />
      </section>

      {isModalOpen && (
        <ObservationModal
          courseAssignments={courseAssignments}
          enrollments={enrollments}
          error={modalError}
          isSaving={isSaving}
          observation={selectedObservation}
          onClose={() => {
            if (!isSaving) {
              setIsModalOpen(false);
              setSelectedObservation(null);
            }
          }}
          onSubmit={handleSubmit}
          teachers={teachers}
        />
      )}

      {statusTarget && (
        <ConfirmStatusModal
          actionLabel={statusAction?.label ?? "cambiar estado"}
          entityLabel={`de la observacion ${statusTarget.id}`}
          error={statusError}
          isSaving={isSaving}
          onCancel={() => {
            if (!isSaving) {
              setStatusTarget(null);
              setStatusAction(null);
              setStatusError(null);
            }
          }}
          onConfirm={() => void confirmStatusChange()}
        />
      )}
    </div>
  );
}
