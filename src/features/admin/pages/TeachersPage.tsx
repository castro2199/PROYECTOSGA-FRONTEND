import { useState } from "react";
import { ConfirmStatusModal } from "../components/ConfirmStatusModal";
import { TeacherModal } from "../components/TeacherModal";
import { useTeachers } from "../hooks/useTeachers";
import type { Teacher, TeacherPayload } from "../types/academicCatalog.types";

type TeachersPageProps = {
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

export function TeachersPage({ token }: TeachersPageProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [statusTarget, setStatusTarget] = useState<Teacher | null>(null);
  const [statusAction, setStatusAction] = useState<StatusAction | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);

  const {
    addTeacher,
    editTeacher,
    error,
    isLoading,
    isSaving,
    reload,
    teachers,
  } = useTeachers(token);

  const handleSubmit = async (payload: TeacherPayload) => {
    setModalError(null);

    try {
      if (selectedTeacher) {
        await editTeacher(selectedTeacher.id, payload);
      } else {
        await addTeacher(payload);
      }
      setIsModalOpen(false);
      setSelectedTeacher(null);
    } catch (saveError) {
      setModalError(
        saveError instanceof Error
          ? saveError.message
          : "No se pudo registrar el docente.",
      );
    }
  };

  const openCreateModal = () => {
    setSelectedTeacher(null);
    setModalError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setModalError(null);
    setIsModalOpen(true);
  };

  const openStatusModal = (teacher: Teacher, isActive: boolean) => {
    if (teacher.activo === isActive) return;

    setStatusTarget(teacher);
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
      await editTeacher(statusTarget.id, {
        is_active: statusAction.isActive,
      });
      setStatusTarget(null);
      setStatusAction(null);
    } catch (saveError) {
      setStatusError(
        saveError instanceof Error
          ? saveError.message
          : "No se pudo cambiar el estado del docente.",
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
          <h2 className="mt-2 text-2xl font-bold text-gray-900">Docentes</h2>
          <p className="mt-2 text-sm text-gray-500">
            Administra las cuentas docentes que seran vinculadas a cursos,
            secciones y seguimiento academico.
          </p>
        </div>

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
            Nuevo docente
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
          <table className="w-full min-w-[960px] text-left">
            <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
              <tr>
                <th className="px-6 py-4 font-semibold">Docente</th>
                <th className="px-6 py-4 font-semibold">Usuario</th>
                <th className="px-6 py-4 font-semibold">DNI</th>
                <th className="px-6 py-4 font-semibold">Contacto</th>
                <th className="px-6 py-4 font-semibold">Estado</th>
                <th className="px-6 py-4 text-right font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {isLoading ? (
                <tr>
                  <td className="px-6 py-8 text-center text-gray-500" colSpan={6}>
                    Cargando docentes...
                  </td>
                </tr>
              ) : teachers.length === 0 ? (
                <tr>
                  <td className="px-6 py-8 text-center text-gray-500" colSpan={6}>
                    No hay docentes registrados.
                  </td>
                </tr>
              ) : (
                teachers.map((teacher) => (
                  <tr className="hover:bg-gray-50" key={teacher.id}>
                    <td className="px-6 py-4 font-semibold text-gray-900">
                      {teacher.full_name}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {teacher.username_display}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {teacher.dni_display || "No registrado"}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      <p>{teacher.email_display || "Sin email"}</p>
                      <p className="mt-1 text-xs text-gray-500">
                        {teacher.telefono_display || "Sin telefono"}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        aria-label={`Cambiar estado del docente ${teacher.full_name}`}
                        className={`rounded-lg border px-3 py-2 text-xs font-semibold outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-50 disabled:cursor-not-allowed disabled:opacity-70 ${
                          statusStyles[String(teacher.activo) as "false" | "true"]
                        }`}
                        disabled={isSaving}
                        onChange={(event) =>
                          openStatusModal(teacher, event.target.value === "true")
                        }
                        value={String(teacher.activo)}
                      >
                        <option value="true">Activo</option>
                        <option value="false">Inactivo</option>
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand-600 disabled:cursor-not-allowed disabled:opacity-70"
                          disabled={isSaving}
                          onClick={() => openEditModal(teacher)}
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
        <TeacherModal
          error={modalError}
          isSaving={isSaving}
          onClose={() => {
            if (!isSaving) {
              setIsModalOpen(false);
              setSelectedTeacher(null);
            }
          }}
          onSubmit={handleSubmit}
          teacher={selectedTeacher}
        />
      )}

      {statusTarget && (
        <ConfirmStatusModal
          actionLabel={statusAction?.label ?? "cambiar estado"}
          entityLabel={`al docente ${statusTarget.full_name}`}
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
