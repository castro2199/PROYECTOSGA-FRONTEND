import { useMemo, useState } from "react";
import { ConfirmStatusModal } from "../components/ConfirmStatusModal";
import { IncidentModal } from "../components/IncidentModal";
import { useEnrollments } from "../hooks/useEnrollments";
import { useIncidents } from "../hooks/useIncidents";
import type {
  Incident,
  IncidentPayload,
  IncidentStatus,
} from "../types/incident.types";
import {
  incidentLevelLabels,
  incidentStatusLabels,
  incidentStatusOptions,
  incidentTypeLabels,
} from "../types/incident.types";

type IncidentsPageProps = {
  token: string;
};

type StatusAction = {
  label: string;
  status: IncidentStatus;
};

const statusStyles: Record<IncidentStatus, string> = {
  ABIERTA: "border-success-100 bg-success-50 text-success-700",
  EN_SEGUIMIENTO: "border-brand-100 bg-brand-50 text-brand-700",
  CERRADA: "border-gray-200 bg-gray-100 text-gray-600",
};

function getStatusActionLabel(status: IncidentStatus) {
  const label = incidentStatusLabels[status] ?? "estado";

  return `cambiar el estado a ${label}`;
}

function formatDateTime(value: string | null) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("es-PE", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

export function IncidentsPage({ token }: IncidentsPageProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(
    null,
  );
  const [statusAction, setStatusAction] = useState<StatusAction | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<IncidentStatus | null>(null);
  const [statusTarget, setStatusTarget] = useState<Incident | null>(null);

  const {
    addIncident,
    editIncident,
    error,
    incidents,
    isLoading,
    isSaving,
    reload,
  } = useIncidents(token);
  const {
    enrollments,
    error: enrollmentsError,
    isLoading: isLoadingEnrollments,
    reload: reloadEnrollments,
  } = useEnrollments(token);

  const filteredIncidents = useMemo(
    () =>
      statusFilter
        ? incidents.filter((incident) => incident.estado === statusFilter)
        : incidents,
    [incidents, statusFilter],
  );
  const isBusy = isLoading || isSaving || isLoadingEnrollments;
  const activeEnrollments = enrollments.filter(
    (enrollment) => enrollment.estado === "ACTIVA",
  );
  const canCreate = activeEnrollments.length > 0;

  const handleSubmit = async (payload: IncidentPayload) => {
    setModalError(null);

    try {
      if (selectedIncident) {
        await editIncident(selectedIncident.id, payload);
      } else {
        await addIncident(payload);
      }
      setIsModalOpen(false);
      setSelectedIncident(null);
    } catch (saveError) {
      setModalError(
        saveError instanceof Error
          ? saveError.message
          : "No se pudo registrar la incidencia.",
      );
    }
  };

  const reloadAll = () => {
    void reload();
    void reloadEnrollments();
  };

  const openCreateModal = () => {
    setSelectedIncident(null);
    setModalError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (incident: Incident) => {
    setSelectedIncident(incident);
    setModalError(null);
    setIsModalOpen(true);
  };

  const openStatusModal = (incident: Incident, status: IncidentStatus) => {
    if (incident.estado === status) return;

    setStatusTarget(incident);
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
      await editIncident(statusTarget.id, {
        estado: statusAction.status,
      });
      setStatusTarget(null);
      setStatusAction(null);
    } catch (saveError) {
      setStatusError(
        saveError instanceof Error
          ? saveError.message
          : "No se pudo cambiar el estado de la incidencia.",
      );
    }
  };

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-theme-xs sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-brand-600">Seguimiento</p>
          <h2 className="mt-2 text-2xl font-bold text-gray-900">
            Incidencias
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            Registra y administra incidencias academicas, conductuales o de
            asistencia vinculadas a estudiantes matriculados.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-70"
            disabled={isBusy}
            onClick={reloadAll}
            type="button"
          >
            {isLoading || isLoadingEnrollments
              ? "Actualizando..."
              : "Actualizar"}
          </button>
          <select
            className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-50"
            disabled={isBusy}
            onChange={(event) =>
              setStatusFilter(
                event.target.value === ""
                  ? null
                  : (event.target.value as IncidentStatus),
              )
            }
            value={statusFilter ?? ""}
          >
            <option value="">Todos</option>
            {incidentStatusOptions.map((option) => (
              <option key={option.value} value={option.value}>
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
            Nueva incidencia
          </button>
        </div>
      </section>

      {(error || enrollmentsError) && (
        <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error ?? enrollmentsError}
        </div>
      )}

      {!canCreate && !isLoadingEnrollments && (
        <div className="rounded-lg border border-brand-100 bg-brand-50 px-4 py-3 text-sm text-brand-700">
          Para registrar una incidencia necesitas al menos una matricula activa.
        </div>
      )}

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-theme-xs">
        <div className="border-b border-gray-100 px-6 py-4">
          <h3 className="text-lg font-bold text-gray-900">Listado</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1180px] text-left">
            <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
              <tr>
                <th className="px-6 py-4 font-semibold">Codigo</th>
                <th className="px-6 py-4 font-semibold">Estudiante</th>
                <th className="px-6 py-4 font-semibold">Seccion</th>
                <th className="px-6 py-4 font-semibold">Tipo</th>
                <th className="px-6 py-4 font-semibold">Nivel</th>
                <th className="px-6 py-4 font-semibold">Fecha</th>
                <th className="px-6 py-4 font-semibold">Estado</th>
                <th className="px-6 py-4 text-right font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {isLoading ? (
                <tr>
                  <td className="px-6 py-8 text-center text-gray-500" colSpan={8}>
                    Cargando incidencias...
                  </td>
                </tr>
              ) : filteredIncidents.length === 0 ? (
                <tr>
                  <td className="px-6 py-8 text-center text-gray-500" colSpan={8}>
                    No hay incidencias registradas.
                  </td>
                </tr>
              ) : (
                filteredIncidents.map((incident) => (
                  <tr className="hover:bg-gray-50" key={incident.id}>
                    <td className="px-6 py-4 font-semibold text-gray-900">
                      {incident.estudiante_codigo}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      <div className="max-w-xs">
                        <p className="font-semibold text-gray-900">
                          {incident.estudiante_label}
                        </p>
                        <p className="mt-1 line-clamp-2 text-xs text-gray-500">
                          {incident.descripcion}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {incident.seccion_label}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {incidentTypeLabels[incident.tipo]}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {incident.nivel
                        ? incidentLevelLabels[incident.nivel as keyof typeof incidentLevelLabels]
                        : "-"}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {formatDateTime(incident.fecha_registro)}
                    </td>
                    <td className="px-6 py-4">
                      <select
                        aria-label={`Cambiar estado de incidencia ${incident.id}`}
                        className={`rounded-lg border px-3 py-2 text-xs font-semibold outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-50 disabled:cursor-not-allowed disabled:opacity-70 ${
                          statusStyles[incident.estado]
                        }`}
                        disabled={isSaving}
                        onChange={(event) =>
                          openStatusModal(
                            incident,
                            event.target.value as IncidentStatus,
                          )
                        }
                        value={incident.estado}
                      >
                        {incidentStatusOptions.map((option) => (
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
                          onClick={() => openEditModal(incident)}
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
        <IncidentModal
          enrollments={enrollments}
          error={modalError}
          incident={selectedIncident}
          isSaving={isSaving}
          onClose={() => {
            if (!isSaving) {
              setIsModalOpen(false);
              setSelectedIncident(null);
            }
          }}
          onSubmit={handleSubmit}
        />
      )}

      {statusTarget && (
        <ConfirmStatusModal
          actionLabel={statusAction?.label ?? "cambiar estado"}
          entityLabel={`de la incidencia ${statusTarget.id}`}
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
