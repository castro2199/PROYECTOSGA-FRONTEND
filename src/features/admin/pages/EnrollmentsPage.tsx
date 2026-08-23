import { useState } from "react";
import { ConfirmStatusModal } from "../components/ConfirmStatusModal";
import { EnrollmentModal } from "../components/EnrollmentModal";
import { useAcademicSections } from "../hooks/useAcademicSections";
import { useAcademicYears } from "../hooks/useAcademicYears";
import { useEnrollments } from "../hooks/useEnrollments";
import { useStudents } from "../hooks/useStudents";
import type {
  Enrollment,
  EnrollmentPayload,
  EnrollmentStatus,
} from "../types/enrollment.types";
import {
  enrollmentStatusLabels,
  enrollmentStatusOptions,
} from "../types/enrollment.types";

type EnrollmentsPageProps = {
  token: string;
};

type StatusAction = {
  label: string;
  status: EnrollmentStatus;
};

const statusStyles: Record<EnrollmentStatus, string> = {
  ACTIVA: "border-success-100 bg-success-50 text-success-700",
  FINALIZADA: "border-brand-100 bg-brand-50 text-brand-700",
  RETIRADA: "border-red-100 bg-red-50 text-red-700",
  TRASLADADA: "border-gray-200 bg-gray-100 text-gray-600",
};

function getStatusActionLabel(status: EnrollmentStatus) {
  const label = enrollmentStatusLabels[status] ?? "estado";

  return `cambiar el estado a ${label}`;
}

export function EnrollmentsPage({ token }: EnrollmentsPageProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [selectedEnrollment, setSelectedEnrollment] =
    useState<Enrollment | null>(null);
  const [statusAction, setStatusAction] = useState<StatusAction | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<EnrollmentStatus | null>(
    null,
  );
  const [statusTarget, setStatusTarget] = useState<Enrollment | null>(null);

  const {
    addEnrollment,
    editEnrollment,
    enrollments,
    error,
    isLoading,
    isSaving,
    reload,
  } = useEnrollments(token, {
    estado: statusFilter,
  });
  const {
    academicYears,
    error: academicYearsError,
    isLoading: isLoadingAcademicYears,
    reload: reloadAcademicYears,
  } = useAcademicYears(token);
  const {
    academicSections,
    error: academicSectionsError,
    isLoading: isLoadingAcademicSections,
    reload: reloadAcademicSections,
  } = useAcademicSections(token);
  const {
    error: studentsError,
    isLoading: isLoadingStudents,
    reload: reloadStudents,
    students,
  } = useStudents(token);

  const isCatalogLoading =
    isLoadingAcademicYears || isLoadingAcademicSections || isLoadingStudents;
  const isBusy = isLoading || isSaving || isCatalogLoading;
  const catalogError =
    academicYearsError ?? academicSectionsError ?? studentsError;
  const canCreate =
    academicYears.length > 0 && academicSections.length > 0 && students.length > 0;

  const handleSubmit = async (payload: EnrollmentPayload) => {
    setModalError(null);

    try {
      if (selectedEnrollment) {
        await editEnrollment(selectedEnrollment.id, payload);
      } else {
        await addEnrollment(payload);
      }
      setIsModalOpen(false);
      setSelectedEnrollment(null);
    } catch (saveError) {
      setModalError(
        saveError instanceof Error
          ? saveError.message
          : "No se pudo registrar la matricula.",
      );
    }
  };

  const reloadAll = () => {
    void reload();
    void reloadAcademicYears();
    void reloadAcademicSections();
    void reloadStudents();
  };

  const openCreateModal = () => {
    setSelectedEnrollment(null);
    setModalError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (enrollment: Enrollment) => {
    setSelectedEnrollment(enrollment);
    setModalError(null);
    setIsModalOpen(true);
  };

  const openStatusModal = (
    enrollment: Enrollment,
    status: EnrollmentStatus,
  ) => {
    if (enrollment.estado === status) return;

    setStatusTarget(enrollment);
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
      await editEnrollment(statusTarget.id, {
        estado: statusAction.status,
      });
      setStatusTarget(null);
      setStatusAction(null);
    } catch (saveError) {
      setStatusError(
        saveError instanceof Error
          ? saveError.message
          : "No se pudo cambiar el estado de la matricula.",
      );
    }
  };

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-theme-xs sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-brand-600">Matriculas</p>
          <h2 className="mt-2 text-2xl font-bold text-gray-900">
            Matriculas
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            Registra y administra la vinculacion de estudiantes con secciones y
            años academicos.
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
            onChange={(event) =>
              setStatusFilter(
                event.target.value === ""
                  ? null
                  : (event.target.value as EnrollmentStatus),
              )
            }
            value={statusFilter ?? ""}
          >
            <option value="">Todos</option>
            {enrollmentStatusOptions.map((option) => (
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
            Nueva matricula
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
          Para registrar una matricula necesitas al menos un estudiante, una
          seccion y un año academico.
        </div>
      )}

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-theme-xs">
        <div className="border-b border-gray-100 px-6 py-4">
          <h3 className="text-lg font-bold text-gray-900">Listado</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1120px] text-left">
            <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
              <tr>
                <th className="px-6 py-4 font-semibold">Codigo</th>
                <th className="px-6 py-4 font-semibold">Estudiante</th>
                <th className="px-6 py-4 font-semibold">Grado</th>
                <th className="px-6 py-4 font-semibold">Seccion</th>
                <th className="px-6 py-4 font-semibold">Año academico</th>
                <th className="px-6 py-4 font-semibold">Fecha</th>
                <th className="px-6 py-4 font-semibold">Estado</th>
                <th className="px-6 py-4 text-right font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {isLoading ? (
                <tr>
                  <td className="px-6 py-8 text-center text-gray-500" colSpan={8}>
                    Cargando matriculas...
                  </td>
                </tr>
              ) : enrollments.length === 0 ? (
                <tr>
                  <td className="px-6 py-8 text-center text-gray-500" colSpan={8}>
                    No hay matriculas registradas.
                  </td>
                </tr>
              ) : (
                enrollments.map((enrollment) => (
                  <tr className="hover:bg-gray-50" key={enrollment.id}>
                    <td className="px-6 py-4 font-semibold text-gray-900">
                      {enrollment.estudiante_codigo}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {enrollment.estudiante_nombre}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {enrollment.grado_label}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {enrollment.seccion_label}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {enrollment.anio_academico_label}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {enrollment.fecha_matricula}
                    </td>
                    <td className="px-6 py-4">
                      <select
                        aria-label={`Cambiar estado de matricula ${enrollment.estudiante_codigo}`}
                        className={`rounded-lg border px-3 py-2 text-xs font-semibold outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-50 disabled:cursor-not-allowed disabled:opacity-70 ${
                          statusStyles[enrollment.estado]
                        }`}
                        disabled={isSaving}
                        onChange={(event) =>
                          openStatusModal(
                            enrollment,
                            event.target.value as EnrollmentStatus,
                          )
                        }
                        value={enrollment.estado}
                      >
                        {enrollmentStatusOptions.map((option) => (
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
                          onClick={() => openEditModal(enrollment)}
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
        <EnrollmentModal
          academicSections={academicSections}
          academicYears={academicYears}
          enrollment={selectedEnrollment}
          error={modalError}
          isSaving={isSaving}
          onClose={() => {
            if (!isSaving) {
              setIsModalOpen(false);
              setSelectedEnrollment(null);
            }
          }}
          onSubmit={handleSubmit}
          students={students}
        />
      )}

      {statusTarget && (
        <ConfirmStatusModal
          actionLabel={statusAction?.label ?? "cambiar estado"}
          entityLabel={`de la matricula ${statusTarget.estudiante_codigo}`}
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
