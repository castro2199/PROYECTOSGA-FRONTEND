import type { FormEvent } from "react";
import { useMemo, useState } from "react";
import type {
  UserAccount,
  UserAccountPayload,
  UserRole,
} from "../types/userAccount.types";
import { userRoleOptions } from "../types/userAccount.types";

type UserRoleModalProps = {
  error: string | null;
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (payload: UserAccountPayload) => Promise<void>;
  user?: UserAccount | null;
};

type FormState = {
  dni: string;
  email: string;
  first_name: string;
  last_name: string;
  password: string;
  roles: UserRole[];
  telefono: string;
  username: string;
};

const initialForm: FormState = {
  dni: "",
  email: "",
  first_name: "",
  last_name: "",
  password: "",
  roles: [],
  telefono: "",
  username: "",
};

function buildInitialForm(user: UserAccount | null | undefined): FormState {
  if (!user) return initialForm;

  return {
    dni: user.dni ?? "",
    email: user.email ?? "",
    first_name: user.first_name ?? "",
    last_name: user.last_name ?? "",
    password: "",
    roles: user.groups.filter((group): group is UserRole =>
      userRoleOptions.includes(group as UserRole),
    ),
    telefono: user.telefono ?? "",
    username: user.username ?? "",
  };
}

function validate(form: FormState, isEditing: boolean) {
  const errors: Partial<Record<keyof FormState, string>> = {};

  if (!form.username.trim()) {
    errors.username = "Ingresa el usuario.";
  }

  if (!isEditing && !form.password) {
    errors.password = "Ingresa una contraseña inicial.";
  }

  if (!form.first_name.trim()) {
    errors.first_name = "Ingresa el nombre.";
  }

  if (!form.last_name.trim()) {
    errors.last_name = "Ingresa los apellidos.";
  }

  if (form.roles.length === 0) {
    errors.roles = "Selecciona al menos un rol.";
  }

  return errors;
}

export function UserRoleModal({
  error,
  isSaving,
  onClose,
  onSubmit,
  user,
}: UserRoleModalProps) {
  const [form, setForm] = useState<FormState>(() => buildInitialForm(user));
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>(
    {},
  );

  const isEditing = Boolean(user);
  const title = useMemo(
    () => (user ? `Editar usuario ${user.username}` : "Nuevo usuario"),
    [user],
  );

  const updateField = <T extends keyof FormState>(
    field: T,
    value: FormState[T],
  ) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const toggleRole = (role: UserRole) => {
    setForm((current) => ({
      ...current,
      roles: current.roles.includes(role)
        ? current.roles.filter((item) => item !== role)
        : [...current.roles, role],
    }));
    setErrors((current) => ({ ...current, roles: undefined }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validationErrors = validate(form, isEditing);

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    const payload: UserAccountPayload = {
      dni: form.dni.trim(),
      email: form.email.trim(),
      first_name: form.first_name.trim(),
      is_active: user?.is_active ?? true,
      last_name: form.last_name.trim(),
      roles: form.roles,
      telefono: form.telefono.trim(),
      username: form.username.trim(),
    };

    if (form.password) {
      payload.password = form.password;
    }

    await onSubmit(payload);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/50 px-4">
      <div className="w-full max-w-3xl rounded-2xl bg-white shadow-theme-xl">
        <div className="flex items-start justify-between border-b border-gray-100 px-6 py-5">
          <div>
            <p className="text-sm font-semibold text-brand-600">
              Usuarios y roles
            </p>
            <h2 className="mt-1 text-xl font-bold text-gray-900">{title}</h2>
          </div>
          <button
            className="rounded-lg px-3 py-1 text-2xl leading-none text-gray-400 hover:bg-gray-50 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-70"
            disabled={isSaving}
            onClick={onClose}
            type="button"
          >
            x
          </button>
        </div>

        <form className="space-y-5 px-6 py-6" onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Usuario
              </label>
              <input
                className={`h-11 w-full rounded-lg border px-4 text-sm outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-50 ${
                  errors.username ? "border-red-400" : "border-gray-200"
                }`}
                onChange={(event) =>
                  updateField("username", event.target.value)
                }
                type="text"
                value={form.username}
              />
              {errors.username && (
                <p className="mt-2 text-sm text-red-600">{errors.username}</p>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Contraseña
              </label>
              <input
                className={`h-11 w-full rounded-lg border px-4 text-sm outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-50 ${
                  errors.password ? "border-red-400" : "border-gray-200"
                }`}
                onChange={(event) =>
                  updateField("password", event.target.value)
                }
                placeholder={isEditing ? "Dejar vacio para no cambiar" : ""}
                type="password"
                value={form.password}
              />
              {errors.password && (
                <p className="mt-2 text-sm text-red-600">{errors.password}</p>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Nombres
              </label>
              <input
                className={`h-11 w-full rounded-lg border px-4 text-sm outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-50 ${
                  errors.first_name ? "border-red-400" : "border-gray-200"
                }`}
                onChange={(event) =>
                  updateField("first_name", event.target.value)
                }
                type="text"
                value={form.first_name}
              />
              {errors.first_name && (
                <p className="mt-2 text-sm text-red-600">
                  {errors.first_name}
                </p>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Apellidos
              </label>
              <input
                className={`h-11 w-full rounded-lg border px-4 text-sm outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-50 ${
                  errors.last_name ? "border-red-400" : "border-gray-200"
                }`}
                onChange={(event) =>
                  updateField("last_name", event.target.value)
                }
                type="text"
                value={form.last_name}
              />
              {errors.last_name && (
                <p className="mt-2 text-sm text-red-600">{errors.last_name}</p>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                DNI
              </label>
              <input
                className="h-11 w-full rounded-lg border border-gray-200 px-4 text-sm outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-50"
                onChange={(event) => updateField("dni", event.target.value)}
                type="text"
                value={form.dni}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Email
              </label>
              <input
                className="h-11 w-full rounded-lg border border-gray-200 px-4 text-sm outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-50"
                onChange={(event) => updateField("email", event.target.value)}
                type="email"
                value={form.email}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Telefono
              </label>
              <input
                className="h-11 w-full rounded-lg border border-gray-200 px-4 text-sm outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-50"
                onChange={(event) =>
                  updateField("telefono", event.target.value)
                }
                type="text"
                value={form.telefono}
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">
              Roles
            </label>
            <div className="grid gap-3 sm:grid-cols-5">
              {userRoleOptions.map((role) => (
                <label
                  className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold transition ${
                    form.roles.includes(role)
                      ? "border-brand-200 bg-brand-50 text-brand-700"
                      : "border-gray-200 text-gray-700 hover:bg-gray-50"
                  }`}
                  key={role}
                >
                  <input
                    checked={form.roles.includes(role)}
                    className="h-4 w-4 accent-brand-500"
                    onChange={() => toggleRole(role)}
                    type="checkbox"
                  />
                  {role}
                </label>
              ))}
            </div>
            {errors.roles && (
              <p className="mt-2 text-sm text-red-600">{errors.roles}</p>
            )}
          </div>

          {error && (
            <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex flex-col-reverse gap-3 border-t border-gray-100 pt-5 sm:flex-row sm:justify-end">
            <button
              className="rounded-lg border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-70"
              disabled={isSaving}
              onClick={onClose}
              type="button"
            >
              {isSaving ? "Espere..." : "Cancelar"}
            </button>
            <button
              className="rounded-lg bg-brand-500 px-5 py-3 text-sm font-semibold text-white shadow-theme-sm transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-70"
              disabled={isSaving}
              type="submit"
            >
              {isSaving
                ? "Guardando..."
                : user
                  ? "Guardar cambios"
                  : "Registrar usuario"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
