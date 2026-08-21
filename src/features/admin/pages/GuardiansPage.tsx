import type { ChangeEvent } from "react";
import { useRef, useState } from "react";
import { AssignStudentModal } from "../components/AssignStudentModal";
import { ConfirmStatusModal } from "../components/ConfirmStatusModal";
import { GuardianModal } from "../components/GuardianModal";
import { useGuardianStudentLinks } from "../hooks/useGuardianStudentLinks";
import { useGuardians } from "../hooks/useGuardians";
import { useStudents } from "../hooks/useStudents";
import {
  downloadGuardiansTemplate,
  uploadGuardiansBulk,
} from "../services/guardiansService";
import type { GuardianStudentLinkPayload } from "../types/guardianStudentLink.types";
import type { Guardian, GuardianPayload } from "../types/guardian.types";
import { formatBulkUploadResult } from "../utils/apiMessages";

type GuardiansPageProps = {
  token: string;
};

type StatusAction = {
  isActive: boolean;
  label: string;
};

const statusStyles = {
  false: "border-gray-200 bg-gray-100 text-gray-600",
  true: "border-success-100 bg-success-50 text-success-700",
};

export function GuardiansPage({ token }: GuardiansPageProps) {
  const bulkInputRef = useRef<HTMLInputElement | null>(null);
  const [bulkError, setBulkError] = useState<string | null>(null);
  const [bulkMessage, setBulkMessage] = useState<string | null>(null);
  const [isBulkDownloading, setIsBulkDownloading] = useState(false);
  const [isBulkUploading, setIsBulkUploading] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [selectedAssignGuardian, setSelectedAssignGuardian] =
    useState<Guardian | null>(null);
  const [selectedGuardian, setSelectedGuardian] = useState<Guardian | null>(
    null,
  );
  const [statusAction, setStatusAction] = useState<StatusAction | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [statusTarget, setStatusTarget] = useState<Guardian | null>(null);

  const {
    addGuardian,
    editGuardian,
    error,
    guardians,
    isLoading,
    isSaving,
    reload,
  } = useGuardians(token);
  const {
    addLink,
    error: linksError,
    isLoading: isLoadingLinks,
    isSaving: isSavingLink,
    links,
    reload: reloadLinks,
  } = useGuardianStudentLinks(token);
  const {
    error: studentsError,
    isLoading: isLoadingStudents,
    students,
  } = useStudents(token);

  const guardianLinkCount = links.reduce<Record<number, number>>(
    (summary, link) => {
      summary[link.apoderado] = (summary[link.apoderado] ?? 0) + 1;
      return summary;
    },
    {},
  );

  const handleSubmit = async (payload: GuardianPayload) => {
    setModalError(null);

    try {
      if (selectedGuardian) {
        await editGuardian(selectedGuardian.id, payload);
      } else {
        await addGuardian(payload);
      }
      setIsModalOpen(false);
      setSelectedGuardian(null);
    } catch (saveError) {
      setModalError(
        saveError instanceof Error
          ? saveError.message
          : "No se pudo registrar el apoderado.",
      );
    }
  };

  const handleDownloadTemplate = async () => {
    setBulkError(null);
    setBulkMessage(null);
    setIsBulkDownloading(true);

    try {
      const blob = await downloadGuardiansTemplate(token);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "Plantilla_Registro_Apoderados.xlsx";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (downloadError) {
      setBulkError(
        downloadError instanceof Error
          ? downloadError.message
          : "No se pudo descargar la plantilla.",
      );
    } finally {
      setIsBulkDownloading(false);
    }
  };

  const handleBulkFileChange = async (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    setBulkError(null);
    setBulkMessage(null);
    setIsBulkUploading(true);

    try {
      const result = await uploadGuardiansBulk(token, file);
      setBulkMessage(formatBulkUploadResult(result, file.name));
      await reload();
    } catch (uploadError) {
      setBulkError(
        uploadError instanceof Error
          ? uploadError.message
          : "No se pudo procesar la carga masiva.",
      );
    } finally {
      setIsBulkUploading(false);
    }
  };

  const openCreateModal = () => {
    setSelectedGuardian(null);
    setModalError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (guardian: Guardian) => {
    setSelectedGuardian(guardian);
    setModalError(null);
    setIsModalOpen(true);
  };

  const openAssignModal = (guardian: Guardian) => {
    setSelectedAssignGuardian(guardian);
    setLinkError(null);
    setIsAssignModalOpen(true);
  };

  const handleAssignStudent = async (payload: GuardianStudentLinkPayload) => {
    setLinkError(null);

    try {
      await addLink(payload);
      setIsAssignModalOpen(false);
      setSelectedAssignGuardian(null);
      await reloadLinks();
    } catch (saveError) {
      setLinkError(
        saveError instanceof Error
          ? saveError.message
          : "No se pudo asignar el estudiante.",
      );
    }
  };

  const openStatusModal = (guardian: Guardian, isActive: boolean) => {
    if (guardian.activo === isActive) return;

    setStatusTarget(guardian);
    setStatusAction({
      isActive,
      label: isActive ? "activar" : "desactivar",
    });
    setStatusError(null);
  };

  const confirmStatusChange = async () => {
    if (!statusTarget || !statusAction) return;
    setStatusError(null);

    try {
      await editGuardian(statusTarget.id, {
        is_active: statusAction.isActive,
      });
      setStatusTarget(null);
      setStatusAction(null);
    } catch (saveError) {
      setStatusError(
        saveError instanceof Error
          ? saveError.message
          : "No se pudo cambiar el estado del apoderado.",
      );
    }
  };

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-theme-xs sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-brand-600">
            Gestion de usuarios
          </p>
          <h2 className="mt-2 text-2xl font-bold text-gray-900">
            Apoderados
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            Administra las cuentas de apoderados vinculadas al seguimiento y
            notificaciones estudiantiles.
          </p>
        </div>

        <div className="flex flex-col items-stretch gap-2 sm:items-end">
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-70"
              disabled={isLoading || isSaving}
              onClick={() => void reload()}
              type="button"
            >
              {isLoading ? "Actualizando..." : "Actualizar"}
            </button>
            <button
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white shadow-theme-sm transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-70"
              disabled={isLoading || isSaving}
              onClick={openCreateModal}
              type="button"
            >
              <img
                alt=""
                className="h-4 w-4 brightness-0 invert"
                src="/admin-icons/plus.svg"
              />
              Nuevo apoderado
            </button>
          </div>

          <input
            accept=".xlsx,.xls"
            className="hidden"
            onChange={(event) => void handleBulkFileChange(event)}
            ref={bulkInputRef}
            type="file"
          />
          <button
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white shadow-theme-sm transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-70"
            disabled={isLoading || isSaving || isBulkUploading}
            onClick={() => bulkInputRef.current?.click()}
            type="button"
          >
            {isBulkUploading ? "Procesando..." : "Carga masiva"}
          </button>
          <button
            className="text-sm font-semibold text-green-600 underline underline-offset-4 transition hover:text-green-700 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isBulkDownloading}
            onClick={() => void handleDownloadTemplate()}
            type="button"
          >
            {isBulkDownloading ? "Descargando..." : "Descargar plantilla"}
          </button>
        </div>
      </section>

      {bulkMessage && (
        <div className="rounded-lg border border-brand-100 bg-brand-50 px-4 py-3 text-sm text-brand-700">
          {bulkMessage}
        </div>
      )}

      {bulkError && (
        <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          {bulkError}
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {(linksError || studentsError) && (
        <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          {linksError ?? studentsError}
        </div>
      )}

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-theme-xs">
        <div className="border-b border-gray-100 px-6 py-4">
          <h3 className="text-lg font-bold text-gray-900">Listado</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1080px] text-left">
            <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
              <tr>
                <th className="px-6 py-4 font-semibold">Apoderado</th>
                <th className="px-6 py-4 font-semibold">Usuario</th>
                <th className="px-6 py-4 font-semibold">DNI</th>
                <th className="px-6 py-4 font-semibold">Contacto</th>
                <th className="px-6 py-4 font-semibold">Estado</th>
                <th className="px-6 py-4 font-semibold">Estudiantes</th>
                <th className="px-6 py-4 text-right font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {isLoading ? (
                <tr>
                  <td className="px-6 py-8 text-center text-gray-500" colSpan={7}>
                    Cargando apoderados...
                  </td>
                </tr>
              ) : guardians.length === 0 ? (
                <tr>
                  <td className="px-6 py-8 text-center text-gray-500" colSpan={7}>
                    No hay apoderados registrados.
                  </td>
                </tr>
              ) : (
                guardians.map((guardian) => (
                  <tr className="hover:bg-gray-50" key={guardian.id}>
                    <td className="px-6 py-4 font-semibold text-gray-900">
                      {guardian.full_name}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {guardian.username_display}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {guardian.dni_display || "No registrado"}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      <p>{guardian.email_display || "Sin email"}</p>
                      <p className="mt-1 text-xs text-gray-500">
                        {guardian.telefono_display || "Sin telefono"}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        aria-label={`Cambiar estado del apoderado ${guardian.full_name}`}
                        className={`rounded-lg border px-3 py-2 text-xs font-semibold outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-50 disabled:cursor-not-allowed disabled:opacity-70 ${
                          statusStyles[String(guardian.activo) as "false" | "true"]
                        }`}
                        disabled={isSaving}
                        onChange={(event) =>
                          openStatusModal(guardian, event.target.value === "true")
                        }
                        value={String(guardian.activo)}
                      >
                        <option value="true">Activo</option>
                        <option value="false">Inactivo</option>
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        className="inline-flex items-center justify-center rounded-lg border border-brand-200 bg-brand-50 px-3 py-2 text-xs font-semibold text-brand-700 transition hover:bg-brand-100 disabled:cursor-not-allowed disabled:opacity-70"
                        disabled={isSaving || isLoadingStudents || isLoadingLinks}
                        onClick={() => openAssignModal(guardian)}
                        type="button"
                      >
                        Asignar estudiante
                        {guardianLinkCount[guardian.id]
                          ? ` (${guardianLinkCount[guardian.id]})`
                          : ""}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand-600 disabled:cursor-not-allowed disabled:opacity-70"
                          disabled={isSaving}
                          onClick={() => openEditModal(guardian)}
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
        <GuardianModal
          error={modalError}
          guardian={selectedGuardian}
          isSaving={isSaving}
          onClose={() => {
            if (!isSaving) {
              setIsModalOpen(false);
              setSelectedGuardian(null);
            }
          }}
          onSubmit={handleSubmit}
        />
      )}

      {isAssignModalOpen && selectedAssignGuardian && (
        <AssignStudentModal
          error={linkError}
          guardian={selectedAssignGuardian}
          isSaving={isSavingLink}
          onClose={() => {
            if (!isSavingLink) {
              setIsAssignModalOpen(false);
              setSelectedAssignGuardian(null);
            }
          }}
          onSubmit={handleAssignStudent}
          students={students}
        />
      )}

      {statusTarget && (
        <ConfirmStatusModal
          actionLabel={statusAction?.label ?? "cambiar estado"}
          entityLabel={`al apoderado ${statusTarget.full_name}`}
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
