import { useState } from "react";
import { PaginationControls } from "../../../shared/components/PaginationControls";
import { useClientPagination } from "../../../shared/hooks/useClientPagination";
import { AcademicCourseModal } from "../components/AcademicCourseModal";
import { ConfirmStatusModal } from "../components/ConfirmStatusModal";
import { useAcademicCourses } from "../hooks/useAcademicCourses";
import {
  BASIC_ACADEMIC_STATUS_LABELS,
  basicAcademicStatusOptions,
  type BasicAcademicStatus,
} from "../types/academicStatus.types";
import type {
  AcademicCourse,
  AcademicCoursePayload,
} from "../types/academicCatalog.types";

type AcademicCoursesPageProps = {
  onOpenEvaluation: () => void;
  token: string;
};

type StatusAction = {
  label: string;
  status: BasicAcademicStatus;
};

const statusStyles = {
  0: "border-gray-200 bg-gray-100 text-gray-600",
  1: "border-success-100 bg-success-50 text-success-700",
};

function getStatusActionLabel(status: BasicAcademicStatus) {
  const label = BASIC_ACADEMIC_STATUS_LABELS[status] ?? "estado";

  return `cambiar el estado a ${label}`;
}

export function AcademicCoursesPage({
  onOpenEvaluation,
  token,
}: AcademicCoursesPageProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<AcademicCourse | null>(
    null,
  );
  const [statusFilter, setStatusFilter] = useState<BasicAcademicStatus | null>(
    null,
  );
  const [modalError, setModalError] = useState<string | null>(null);
  const [statusTarget, setStatusTarget] = useState<AcademicCourse | null>(null);
  const [statusAction, setStatusAction] = useState<StatusAction | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);

  const {
    academicCourses,
    addAcademicCourse,
    editAcademicCourse,
    error,
    isLoading,
    isSaving,
    reload,
  } = useAcademicCourses(token, {
    estado: statusFilter,
  });
  const pagination = useClientPagination(academicCourses);

  const handleSubmit = async (payload: AcademicCoursePayload) => {
    setModalError(null);

    try {
      if (selectedCourse) {
        await editAcademicCourse(selectedCourse.id, payload);
      } else {
        await addAcademicCourse(payload);
      }
      setIsModalOpen(false);
      setSelectedCourse(null);
    } catch (saveError) {
      setModalError(
        saveError instanceof Error
          ? saveError.message
          : "No se pudo registrar el curso.",
      );
    }
  };

  const openCreateModal = () => {
    setSelectedCourse(null);
    setModalError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (course: AcademicCourse) => {
    setSelectedCourse(course);
    setModalError(null);
    setIsModalOpen(true);
  };

  const openStatusModal = (
    course: AcademicCourse,
    status: BasicAcademicStatus,
  ) => {
    if (course.estado === status) return;

    setStatusTarget(course);
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
      await editAcademicCourse(statusTarget.id, {
        estado: statusAction.status,
      });
      setStatusTarget(null);
      setStatusAction(null);
    } catch (saveError) {
      setStatusError(
        saveError instanceof Error
          ? saveError.message
          : "No se pudo cambiar el estado del curso.",
      );
    }
  };

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-theme-xs sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-brand-600">
            Gestion academica
          </p>
          <h2 className="mt-2 text-2xl font-bold text-gray-900">Cursos</h2>
          <p className="mt-2 text-sm text-gray-500">
            Administra el catalogo de cursos que se asignaran a grados,
            secciones y docentes.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            className="rounded-lg border border-brand-200 bg-brand-50 px-4 py-2.5 text-sm font-semibold text-brand-700 transition hover:bg-brand-100"
            onClick={onOpenEvaluation}
            type="button"
          >
            Competencias y criterios
          </button>
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
                  : (Number(event.target.value) as BasicAcademicStatus),
              )
            }
            value={statusFilter ?? ""}
          >
            <option value="">Todos</option>
            {basicAcademicStatusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
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
            Nuevo curso
          </button>
        </div>
      </section>

      {error && (
        <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-theme-xs">
        <div className="border-b border-gray-100 px-6 py-4">
          <h3 className="text-lg font-bold text-gray-900">Listado</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left">
            <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
              <tr>
                <th className="px-6 py-4 font-semibold">Curso</th>
                <th className="px-6 py-4 font-semibold">Descripcion</th>
                <th className="px-6 py-4 font-semibold">Estado</th>
                <th className="px-6 py-4 text-right font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {isLoading ? (
                <tr>
                  <td className="px-6 py-8 text-center text-gray-500" colSpan={4}>
                    Cargando cursos...
                  </td>
                </tr>
              ) : academicCourses.length === 0 ? (
                <tr>
                  <td className="px-6 py-8 text-center text-gray-500" colSpan={4}>
                    No hay cursos registrados.
                  </td>
                </tr>
              ) : (
                pagination.pageItems.map((course) => (
                  <tr className="hover:bg-gray-50" key={course.id}>
                    <td className="px-6 py-4 font-semibold text-gray-900">
                      {course.nombre}
                    </td>
                    <td className="max-w-md px-6 py-4 text-gray-600">
                      <span className="line-clamp-2">
                        {course.descripcion || "Sin descripcion"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        aria-label={`Cambiar estado del curso ${course.nombre}`}
                        className={`rounded-lg border px-3 py-2 text-xs font-semibold outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-50 disabled:cursor-not-allowed disabled:opacity-70 ${
                          statusStyles[course.estado] ??
                          "border-gray-200 bg-gray-100 text-gray-600"
                        }`}
                        disabled={isSaving}
                        onChange={(event) =>
                          openStatusModal(
                            course,
                            Number(event.target.value) as BasicAcademicStatus,
                          )
                        }
                        value={course.estado}
                      >
                        {basicAcademicStatusOptions.map((option) => (
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
                          onClick={() => openEditModal(course)}
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
        <PaginationControls currentPage={pagination.currentPage} isLoading={isLoading} itemLabel="cursos" onPageChange={pagination.setCurrentPage} pageSize={pagination.pageSize} totalItems={pagination.totalItems} totalPages={pagination.totalPages} />
      </section>

      {isModalOpen && (
        <AcademicCourseModal
          academicCourse={selectedCourse}
          error={modalError}
          isSaving={isSaving}
          onClose={() => {
            if (!isSaving) {
              setIsModalOpen(false);
              setSelectedCourse(null);
            }
          }}
          onSubmit={handleSubmit}
        />
      )}

      {statusTarget && (
        <ConfirmStatusModal
          actionLabel={statusAction?.label ?? "Cambiar estado"}
          entityLabel={`del curso ${statusTarget.nombre}`}
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
