import { useState } from "react";
import { PaginationControls } from "../../../shared/components/PaginationControls";
import { useClientPagination } from "../../../shared/hooks/useClientPagination";
import { AcademicYearModal } from "../components/AcademicYearModal";
import { ConfirmStatusModal } from "../components/ConfirmStatusModal";
import { useAcademicYears } from "../hooks/useAcademicYears";
import type {
  AcademicYear,
  AcademicYearPayload,
} from "../types/academicYear.types";
import {
  ACADEMIC_LIFECYCLE_STATUS,
  ACADEMIC_LIFECYCLE_STATUS_LABELS,
  academicLifecycleStatusOptions,
  type AcademicLifecycleStatus,
} from "../types/academicStatus.types";

type AcademicYearsPageProps = {
  token: string;
};

const statusStyles = {
  [ACADEMIC_LIFECYCLE_STATUS.INACTIVO]:
    "border-gray-200 bg-gray-100 text-gray-600",
  [ACADEMIC_LIFECYCLE_STATUS.PLANIFICADO]:
    "border-brand-100 bg-brand-50 text-brand-700",
  [ACADEMIC_LIFECYCLE_STATUS.ACTIVO]:
    "border-success-100 bg-success-50 text-success-700",
  [ACADEMIC_LIFECYCLE_STATUS.CERRADO]:
    "border-red-100 bg-red-50 text-red-700",
};

type StatusAction = {
  label: string;
  status: AcademicLifecycleStatus;
};

function getStatusActionLabel(status: AcademicLifecycleStatus) {
  const label = ACADEMIC_LIFECYCLE_STATUS_LABELS[status] ?? "estado";

  return `cambiar el estado a ${label}`;
}

export function AcademicYearsPage({ token }: AcademicYearsPageProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAcademicYear, setSelectedAcademicYear] =
    useState<AcademicYear | null>(null);
  const [statusTarget, setStatusTarget] = useState<AcademicYear | null>(null);
  const [statusAction, setStatusAction] = useState<StatusAction | null>(null);
  const [statusFilter, setStatusFilter] = useState<AcademicLifecycleStatus | null>(
    null,
  );
  const [modalError, setModalError] = useState<string | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const {
    academicYears,
    addAcademicYear,
    editAcademicYear,
    error,
    isLoading,
    isSaving,
    reload,
  } = useAcademicYears(token, {
    estado: statusFilter,
  });
  const pagination = useClientPagination(academicYears);

  const handleSubmit = async (payload: AcademicYearPayload) => {
    setModalError(null);

    try {
      if (selectedAcademicYear) {
        await editAcademicYear(selectedAcademicYear.id, payload);
      } else {
        await addAcademicYear(payload);
      }
      setIsModalOpen(false);
      setSelectedAcademicYear(null);
    } catch (saveError) {
      setModalError(
        saveError instanceof Error
          ? saveError.message
          : "No se pudo registrar el año académico.",
      );
    }
  };

  const openCreateModal = () => {
    setSelectedAcademicYear(null);
    setModalError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (academicYear: AcademicYear) => {
    setSelectedAcademicYear(academicYear);
    setModalError(null);
    setIsModalOpen(true);
  };

  const openStatusModal = (
    academicYear: AcademicYear,
    status: AcademicLifecycleStatus,
  ) => {
    if (academicYear.estado === status) return;

    setStatusTarget(academicYear);
    setStatusAction({
      label: getStatusActionLabel(status),
      status,
    });
    setStatusError(null);
  };

  const confirmStatusChange = async () => {
    if (!statusTarget || !statusAction) return;
    setStatusError(null);

    try {
      await editAcademicYear(statusTarget.id, {
        estado: statusAction.status,
      });
      setStatusTarget(null);
      setStatusAction(null);
    } catch (saveError) {
      setStatusError(
        saveError instanceof Error
          ? saveError.message
          : "No se pudo cambiar el estado del año académico.",
      );
    }
  };

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-theme-xs sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-brand-600">
            Gestión académica
          </p>
          <h2 className="mt-2 text-2xl font-bold text-gray-900">
            Años académicos
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            Administra los periodos anuales que organizan matrículas, cursos y
            seguimiento estudiantil.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-70"
            disabled={isLoading || isSaving}
            onClick={() => void reload()}
            type="button"
          >
            {isLoading ? "Actualizando..." : "Actualizar"}
          </button>
          <select
            className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-50"
            disabled={isLoading || isSaving}
            onChange={(event) =>
              setStatusFilter(
                event.target.value === ""
                  ? null
                  : (Number(event.target.value) as AcademicLifecycleStatus),
              )
            }
            value={statusFilter ?? ""}
          >
            <option value="">Todos</option>
            {academicLifecycleStatusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <button
            className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white shadow-theme-sm transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-70"
            disabled={isLoading || isSaving}
            onClick={openCreateModal}
            type="button"
          >
            <img alt="" className="h-4 w-4 brightness-0 invert" src="/admin-icons/plus.svg" />
            Nuevo año
          </button>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-theme-xs">
        <div className="border-b border-gray-100 px-6 py-4">
          <h3 className="text-lg font-bold text-gray-900">Listado</h3>
        </div>

        {error && (
          <div className="m-6 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left">
            <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
              <tr>
                <th className="px-6 py-4 font-semibold">Año</th>
                <th className="px-6 py-4 font-semibold">Fecha inicio</th>
                <th className="px-6 py-4 font-semibold">Fecha fin</th>
                <th className="px-6 py-4 font-semibold">Estado</th>
                <th className="px-6 py-4 text-right font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {isLoading ? (
                <tr>
                  <td className="px-6 py-8 text-center text-gray-500" colSpan={5}>
                    Cargando años académicos...
                  </td>
                </tr>
              ) : academicYears.length === 0 ? (
                <tr>
                  <td className="px-6 py-8 text-center text-gray-500" colSpan={5}>
                    No hay años académicos registrados.
                  </td>
                </tr>
              ) : (
                pagination.pageItems.map((academicYear) => (
                  <tr className="hover:bg-gray-50" key={academicYear.id}>
                    <td className="px-6 py-4 font-semibold text-gray-900">
                      {academicYear.anio}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {academicYear.fecha_inicio}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {academicYear.fecha_fin}
                    </td>
                    <td className="px-6 py-4">
                      <select
                        aria-label={`Cambiar estado del aÃ±o ${academicYear.anio}`}
                        className={`rounded-lg border px-3 py-2 text-xs font-semibold outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-50 disabled:cursor-not-allowed disabled:opacity-70 ${
                          statusStyles[academicYear.estado] ??
                          "border-gray-200 bg-gray-100 text-gray-600"
                        }`}
                        disabled={isSaving}
                        onChange={(event) =>
                          openStatusModal(
                            academicYear,
                            Number(event.target.value) as AcademicLifecycleStatus,
                          )
                        }
                        value={academicYear.estado}
                      >
                        {academicLifecycleStatusOptions.map((option) => (
                          <option key={option.value} value={option.value}>
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
                          onClick={() => openEditModal(academicYear)}
                          type="button"
                        >
                          <img alt="" className="h-4 w-4" src="/admin-icons/pencil.svg" />
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
        <PaginationControls currentPage={pagination.currentPage} isLoading={isLoading} itemLabel="anios academicos" onPageChange={pagination.setCurrentPage} pageSize={pagination.pageSize} totalItems={pagination.totalItems} totalPages={pagination.totalPages} />
      </section>

      {isModalOpen && (
        <AcademicYearModal
          academicYear={selectedAcademicYear}
          error={modalError}
          isSaving={isSaving}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedAcademicYear(null);
          }}
          onSubmit={handleSubmit}
        />
      )}

      {statusTarget && (
        <ConfirmStatusModal
          actionLabel={statusAction?.label ?? "Cambiar estado"}
          entityLabel={`del año académico ${statusTarget.anio}`}
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
