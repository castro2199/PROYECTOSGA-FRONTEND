import { useState } from "react";
import { PaginationControls } from "../../../shared/components/PaginationControls";
import { useClientPagination } from "../../../shared/hooks/useClientPagination";
import { CourseAssignmentModal } from "../components/CourseAssignmentModal";
import { ConfirmStatusModal } from "../components/ConfirmStatusModal";
import { useAcademicCourses } from "../hooks/useAcademicCourses";
import { useAcademicSections } from "../hooks/useAcademicSections";
import { useAcademicYears } from "../hooks/useAcademicYears";
import { useCourseAssignments } from "../hooks/useCourseAssignments";
import { useTeachers } from "../hooks/useTeachers";
import {
  ACADEMIC_LIFECYCLE_STATUS,
  COURSE_ASSIGNMENT_STATUS_LABELS,
  courseAssignmentStatusOptions,
  type CourseAssignmentStatus,
} from "../types/academicStatus.types";
import type {
  CourseAssignment,
  CourseAssignmentPayload,
} from "../types/academicCatalog.types";

type CourseAssignmentsPageProps = {
  token: string;
};

type StatusAction = {
  label: string;
  status: CourseAssignmentStatus;
};

const statusStyles = {
  0: "border-gray-200 bg-gray-100 text-gray-600",
  1: "border-success-100 bg-success-50 text-success-700",
  2: "border-brand-100 bg-brand-50 text-brand-700",
};

function getStatusActionLabel(status: CourseAssignmentStatus) {
  const label = COURSE_ASSIGNMENT_STATUS_LABELS[status] ?? "estado";

  return `cambiar el estado a ${label}`;
}

export function CourseAssignmentsPage({ token }: CourseAssignmentsPageProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] =
    useState<CourseAssignment | null>(null);
  const [statusFilter, setStatusFilter] =
    useState<CourseAssignmentStatus | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [statusTarget, setStatusTarget] = useState<CourseAssignment | null>(
    null,
  );
  const [statusAction, setStatusAction] = useState<StatusAction | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);

  const {
    addCourseAssignment,
    courseAssignments,
    editCourseAssignment,
    error,
    isLoading,
    isSaving,
    reload,
  } = useCourseAssignments(token, {
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
    academicCourses,
    error: academicCoursesError,
    isLoading: isLoadingAcademicCourses,
    reload: reloadAcademicCourses,
  } = useAcademicCourses(token);

  const {
    error: teachersError,
    isLoading: isLoadingTeachers,
    reload: reloadTeachers,
    teachers,
  } = useTeachers(token);
  const pagination = useClientPagination(courseAssignments);

  const isCatalogLoading =
    isLoadingAcademicYears ||
    isLoadingAcademicSections ||
    isLoadingAcademicCourses ||
    isLoadingTeachers;
  const isBusy = isLoading || isSaving || isCatalogLoading;
  const catalogError =
    academicYearsError ??
    academicSectionsError ??
    academicCoursesError ??
    teachersError;
  const assignableAcademicYears = academicYears.filter(
    (year) =>
      year.estado === ACADEMIC_LIFECYCLE_STATUS.PLANIFICADO ||
      year.estado === ACADEMIC_LIFECYCLE_STATUS.ACTIVO,
  );
  const canCreate =
    assignableAcademicYears.length > 0 &&
    academicSections.length > 0 &&
    academicCourses.length > 0 &&
    teachers.length > 0;

  const handleSubmit = async (payload: CourseAssignmentPayload) => {
    setModalError(null);

    try {
      if (selectedAssignment) {
        await editCourseAssignment(selectedAssignment.id, payload);
      } else {
        await addCourseAssignment(payload);
      }
      setIsModalOpen(false);
      setSelectedAssignment(null);
    } catch (saveError) {
      setModalError(
        saveError instanceof Error
          ? saveError.message
          : "No se pudo registrar la asignacion.",
      );
    }
  };

  const reloadAll = () => {
    void reload();
    void reloadAcademicYears();
    void reloadAcademicSections();
    void reloadAcademicCourses();
    void reloadTeachers();
  };

  const openCreateModal = () => {
    setSelectedAssignment(null);
    setModalError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (assignment: CourseAssignment) => {
    setSelectedAssignment(assignment);
    setModalError(null);
    setIsModalOpen(true);
  };

  const openStatusModal = (
    assignment: CourseAssignment,
    status: CourseAssignmentStatus,
  ) => {
    if (assignment.estado === status) return;

    setStatusTarget(assignment);
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
      await editCourseAssignment(statusTarget.id, {
        estado: statusAction.status,
      });
      setStatusTarget(null);
      setStatusAction(null);
    } catch (saveError) {
      setStatusError(
        saveError instanceof Error
          ? saveError.message
          : "No se pudo cambiar el estado de la asignacion.",
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
          <h2 className="mt-2 text-2xl font-bold text-gray-900">
            Asignacion de cursos
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            Vincula cursos con docentes, secciones y años academicos para el
            seguimiento estudiantil.
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
                  : (Number(event.target.value) as CourseAssignmentStatus),
              )
            }
            value={statusFilter ?? ""}
          >
            <option value="">Todos</option>
            {courseAssignmentStatusOptions.map((option) => (
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
            Nueva asignacion
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
          Para registrar una asignacion necesitas al menos un año academico
          planificado o activo, una seccion, un curso y un docente.
        </div>
      )}

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-theme-xs">
        <div className="border-b border-gray-100 px-6 py-4">
          <h3 className="text-lg font-bold text-gray-900">Listado</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-left">
            <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
              <tr>
                <th className="px-6 py-4 font-semibold">Curso</th>
                <th className="px-6 py-4 font-semibold">Docente</th>
                <th className="px-6 py-4 font-semibold">Seccion</th>
                <th className="px-6 py-4 font-semibold">Año academico</th>
                <th className="px-6 py-4 font-semibold">Estado</th>
                <th className="px-6 py-4 text-right font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {isLoading ? (
                <tr>
                  <td className="px-6 py-8 text-center text-gray-500" colSpan={6}>
                    Cargando asignaciones...
                  </td>
                </tr>
              ) : courseAssignments.length === 0 ? (
                <tr>
                  <td className="px-6 py-8 text-center text-gray-500" colSpan={6}>
                    No hay asignaciones registradas.
                  </td>
                </tr>
              ) : (
                pagination.pageItems.map((assignment) => (
                  <tr className="hover:bg-gray-50" key={assignment.id}>
                    <td className="px-6 py-4 font-semibold text-gray-900">
                      {assignment.curso_label}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {assignment.docente_label}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {assignment.seccion_label}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {assignment.anio_academico_label}
                    </td>
                    <td className="px-6 py-4">
                      <select
                        aria-label={`Cambiar estado de la asignacion ${assignment.curso_label}`}
                        className={`rounded-lg border px-3 py-2 text-xs font-semibold outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-50 disabled:cursor-not-allowed disabled:opacity-70 ${
                          statusStyles[assignment.estado] ??
                          "border-gray-200 bg-gray-100 text-gray-600"
                        }`}
                        disabled={isSaving}
                        onChange={(event) =>
                          openStatusModal(
                            assignment,
                            Number(event.target.value) as CourseAssignmentStatus,
                          )
                        }
                        value={assignment.estado}
                      >
                        {courseAssignmentStatusOptions.map((option) => (
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
                          onClick={() => openEditModal(assignment)}
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
        <PaginationControls currentPage={pagination.currentPage} isLoading={isBusy} itemLabel="asignaciones" onPageChange={pagination.setCurrentPage} pageSize={pagination.pageSize} totalItems={pagination.totalItems} totalPages={pagination.totalPages} />
      </section>

      {isModalOpen && (
        <CourseAssignmentModal
          academicCourses={academicCourses}
          academicSections={academicSections}
          academicYears={academicYears}
          courseAssignment={selectedAssignment}
          error={modalError}
          isSaving={isSaving}
          onClose={() => {
            if (!isSaving) {
              setIsModalOpen(false);
              setSelectedAssignment(null);
            }
          }}
          onSubmit={handleSubmit}
          teachers={teachers}
        />
      )}

      {statusTarget && (
        <ConfirmStatusModal
          actionLabel={statusAction?.label ?? "Cambiar estado"}
          entityLabel={`de la asignacion ${statusTarget.curso_label}`}
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
