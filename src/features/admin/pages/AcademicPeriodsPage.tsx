import { useState } from "react";
import { AcademicPeriodModal } from "../components/AcademicPeriodModal";
import { ConfirmStatusModal } from "../components/ConfirmStatusModal";
import { useAcademicPeriods } from "../hooks/useAcademicPeriods";
import { useAcademicYears } from "../hooks/useAcademicYears";
import type {
  AcademicPeriod,
  AcademicPeriodPayload,
} from "../types/academicPeriod.types";
import {
  ACADEMIC_LIFECYCLE_STATUS,
  ACADEMIC_LIFECYCLE_STATUS_LABELS,
  academicLifecycleStatusOptions,
  type AcademicLifecycleStatus,
} from "../types/academicStatus.types";

type AcademicPeriodsPageProps = {
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

export function AcademicPeriodsPage({ token }: AcademicPeriodsPageProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAcademicPeriod, setSelectedAcademicPeriod] =
    useState<AcademicPeriod | null>(null);
  const [statusTarget, setStatusTarget] = useState<AcademicPeriod | null>(null);
  const [statusAction, setStatusAction] = useState<StatusAction | null>(null);
  const [statusFilter, setStatusFilter] = useState<AcademicLifecycleStatus | null>(
    null,
  );
  const [modalError, setModalError] = useState<string | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);

  const {
    academicPeriods,
    addAcademicPeriod,
    editAcademicPeriod,
    error,
    isLoading,
    isSaving,
    reload,
  } = useAcademicPeriods(token, {
    estado: statusFilter,
  });

  const {
    academicYears,
    error: academicYearsError,
    isLoading: isLoadingAcademicYears,
  } = useAcademicYears(token);

  const isBusy = isLoading || isSaving || isLoadingAcademicYears;

  const handleSubmit = async (payload: AcademicPeriodPayload) => {
    setModalError(null);

    try {
      if (selectedAcademicPeriod) {
        await editAcademicPeriod(selectedAcademicPeriod.id, payload);
      } else {
        await addAcademicPeriod(payload);
      }
      setIsModalOpen(false);
      setSelectedAcademicPeriod(null);
    } catch (saveError) {
      setModalError(
        saveError instanceof Error
          ? saveError.message
          : "No se pudo registrar el periodo académico.",
      );
    }
  };

  const openCreateModal = () => {
    setSelectedAcademicPeriod(null);
    setModalError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (academicPeriod: AcademicPeriod) => {
    setSelectedAcademicPeriod(academicPeriod);
    setModalError(null);
    setIsModalOpen(true);
  };

  const openStatusModal = (
    academicPeriod: AcademicPeriod,
    status: AcademicLifecycleStatus,
  ) => {
    if (academicPeriod.estado === status) return;

    setStatusTarget(academicPeriod);
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
      await editAcademicPeriod(statusTarget.id, {
        estado: statusAction.status,
      });
      setStatusTarget(null);
      setStatusAction(null);
    } catch (saveError) {
      setStatusError(
        saveError instanceof Error
          ? saveError.message
          : "No se pudo cambiar el estado del periodo académico.",
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
            Periodos académicos
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            Organiza bimestres, trimestres o etapas de evaluación vinculadas a
            cada año académico.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-70"
            disabled={isBusy}
            onClick={() => void reload()}
            type="button"
          >
            {isLoading ? "Actualizando..." : "Actualizar"}
          </button>
          <select
            className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-50"
            disabled={isBusy}
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
            disabled={isBusy || academicYears.length === 0}
            onClick={openCreateModal}
            type="button"
          >
            <img
              alt=""
              className="h-4 w-4 brightness-0 invert"
              src="/admin-icons/plus.svg"
            />
            Nuevo periodo
          </button>
        </div>
      </section>

      {(error || academicYearsError) && (
        <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error ?? academicYearsError}
        </div>
      )}

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-theme-xs">
        <div className="border-b border-gray-100 px-6 py-4">
          <h3 className="text-lg font-bold text-gray-900">Listado</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left">
            <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
              <tr>
                <th className="px-6 py-4 font-semibold">Periodo</th>
                <th className="px-6 py-4 font-semibold">Año académico</th>
                <th className="px-6 py-4 font-semibold">Fecha inicio</th>
                <th className="px-6 py-4 font-semibold">Fecha fin</th>
                <th className="px-6 py-4 font-semibold">Estado</th>
                <th className="px-6 py-4 text-right font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {isLoading ? (
                <tr>
                  <td className="px-6 py-8 text-center text-gray-500" colSpan={6}>
                    Cargando periodos académicos...
                  </td>
                </tr>
              ) : academicPeriods.length === 0 ? (
                <tr>
                  <td className="px-6 py-8 text-center text-gray-500" colSpan={6}>
                    No hay periodos académicos registrados.
                  </td>
                </tr>
              ) : (
                academicPeriods.map((period) => (
                  <tr className="hover:bg-gray-50" key={period.id}>
                    <td className="px-6 py-4 font-semibold text-gray-900">
                      {period.nombre}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {period.anio_academico_label}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {period.fecha_inicio}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {period.fecha_fin}
                    </td>
                    <td className="px-6 py-4">
                      <select
                        aria-label={`Cambiar estado del periodo ${period.nombre}`}
                        className={`rounded-lg border px-3 py-2 text-xs font-semibold outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-50 disabled:cursor-not-allowed disabled:opacity-70 ${
                          statusStyles[period.estado] ??
                          "border-gray-200 bg-gray-100 text-gray-600"
                        }`}
                        disabled={isSaving}
                        onChange={(event) =>
                          openStatusModal(
                            period,
                            Number(event.target.value) as AcademicLifecycleStatus,
                          )
                        }
                        value={period.estado}
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
                          onClick={() => openEditModal(period)}
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
      </section>

      {isModalOpen && (
        <AcademicPeriodModal
          academicPeriod={selectedAcademicPeriod}
          academicYears={academicYears}
          error={modalError}
          isSaving={isSaving}
          onClose={() => {
            if (!isSaving) {
              setIsModalOpen(false);
              setSelectedAcademicPeriod(null);
            }
          }}
          onSubmit={handleSubmit}
        />
      )}

      {statusTarget && (
        <ConfirmStatusModal
          actionLabel={statusAction?.label ?? "Cambiar estado"}
          entityLabel={`del periodo ${statusTarget.nombre}`}
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
