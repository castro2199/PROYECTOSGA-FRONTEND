import { useState } from "react";
import { ConfirmStatusModal } from "../components/ConfirmStatusModal";
import { UserRoleModal } from "../components/UserRoleModal";
import { useUserAccounts } from "../hooks/useUserAccounts";
import type {
  UserAccount,
  UserAccountPayload,
} from "../types/userAccount.types";

type UserRolesPageProps = {
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

function getProfileLabel(user: UserAccount) {
  if (user.is_superuser) return "Superusuario";
  if (user.is_staff) return "Staff";
  if (user.estudiante_id) return "Estudiante";
  if (user.docente_id) return "Docente";
  if (user.apoderado_id) return "Apoderado";
  return "Usuario";
}

export function UserRolesPage({ token }: UserRolesPageProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserAccount | null>(null);
  const [statusAction, setStatusAction] = useState<StatusAction | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [statusTarget, setStatusTarget] = useState<UserAccount | null>(null);

  const {
    addUser,
    editUser,
    error,
    isLoading,
    isSaving,
    reload,
    users,
  } = useUserAccounts(token);

  const handleSubmit = async (payload: UserAccountPayload) => {
    setModalError(null);

    try {
      if (selectedUser) {
        await editUser(selectedUser.id, payload);
      } else {
        await addUser(payload);
      }
      setIsModalOpen(false);
      setSelectedUser(null);
    } catch (saveError) {
      setModalError(
        saveError instanceof Error
          ? saveError.message
          : "No se pudo registrar el usuario.",
      );
    }
  };

  const openCreateModal = () => {
    setSelectedUser(null);
    setModalError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (user: UserAccount) => {
    setSelectedUser(user);
    setModalError(null);
    setIsModalOpen(true);
  };

  const openStatusModal = (user: UserAccount, isActive: boolean) => {
    if (user.is_active === isActive) return;

    setStatusTarget(user);
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
      await editUser(statusTarget.id, {
        is_active: statusAction.isActive,
      });
      setStatusTarget(null);
      setStatusAction(null);
    } catch (saveError) {
      setStatusError(
        saveError instanceof Error
          ? saveError.message
          : "No se pudo cambiar el estado del usuario.",
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
            Usuarios y roles
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            Administra las cuentas del sistema y los roles asignados a cada
            usuario.
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
            Nuevo usuario
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
          <table className="w-full min-w-[1120px] text-left">
            <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
              <tr>
                <th className="px-6 py-4 font-semibold">Usuario</th>
                <th className="px-6 py-4 font-semibold">Nombre</th>
                <th className="px-6 py-4 font-semibold">Contacto</th>
                <th className="px-6 py-4 font-semibold">Perfil</th>
                <th className="px-6 py-4 font-semibold">Roles</th>
                <th className="px-6 py-4 font-semibold">Estado</th>
                <th className="px-6 py-4 text-right font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {isLoading ? (
                <tr>
                  <td className="px-6 py-8 text-center text-gray-500" colSpan={7}>
                    Cargando usuarios...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td className="px-6 py-8 text-center text-gray-500" colSpan={7}>
                    No hay usuarios registrados.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr className="hover:bg-gray-50" key={user.id}>
                    <td className="px-6 py-4 font-semibold text-gray-900">
                      {user.username}
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-gray-900">
                        {user.full_name || "Sin nombre"}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        DNI: {user.dni || "No registrado"}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      <p>{user.email || "Sin email"}</p>
                      <p className="mt-1 text-xs text-gray-500">
                        {user.telefono || "Sin telefono"}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {getProfileLabel(user)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex max-w-sm flex-wrap gap-2">
                        {user.groups.length > 0 ? (
                          user.groups.map((group) => (
                            <span
                              className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700"
                              key={group}
                            >
                              {group}
                            </span>
                          ))
                        ) : (
                          <span className="text-sm text-gray-500">Sin rol</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        aria-label={`Cambiar estado del usuario ${user.username}`}
                        className={`rounded-lg border px-3 py-2 text-xs font-semibold outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-50 disabled:cursor-not-allowed disabled:opacity-70 ${
                          statusStyles[String(user.is_active) as "false" | "true"]
                        }`}
                        disabled={isSaving}
                        onChange={(event) =>
                          openStatusModal(user, event.target.value === "true")
                        }
                        value={String(user.is_active)}
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
                          onClick={() => openEditModal(user)}
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
        <UserRoleModal
          error={modalError}
          isSaving={isSaving}
          onClose={() => {
            if (!isSaving) {
              setIsModalOpen(false);
              setSelectedUser(null);
            }
          }}
          onSubmit={handleSubmit}
          user={selectedUser}
        />
      )}

      {statusTarget && (
        <ConfirmStatusModal
          actionLabel={statusAction?.label ?? "cambiar estado"}
          entityLabel={`al usuario ${statusTarget.username}`}
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
