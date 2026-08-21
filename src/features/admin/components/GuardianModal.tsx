import type { FormEvent } from "react";
import { useMemo, useState } from "react";
import type { Guardian, GuardianPayload } from "../types/guardian.types";

type GuardianModalProps = {
  error: string | null;
  guardian?: Guardian | null;
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (payload: GuardianPayload) => Promise<void>;
};

type FormState = {
  dni: string;
  email: string;
  first_name: string;
  last_name: string;
  password: string;
  telefono: string;
  username: string;
};

const initialForm: FormState = {
  dni: "",
  email: "",
  first_name: "",
  last_name: "",
  password: "",
  telefono: "",
  username: "",
};

function buildInitialForm(guardian: Guardian | null | undefined): FormState {
  if (!guardian) return initialForm;

  return {
    dni: guardian.dni_display,
    email: guardian.email_display,
    first_name: guardian.first_name_display,
    last_name: guardian.last_name_display,
    password: "",
    telefono: guardian.telefono_display,
    username: guardian.username_display,
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

  if (!form.dni.trim()) {
    errors.dni = "Ingresa el DNI.";
  }

  return errors;
}

export function GuardianModal({
  error,
  guardian,
  isSaving,
  onClose,
  onSubmit,
}: GuardianModalProps) {
  const [form, setForm] = useState<FormState>(() => buildInitialForm(guardian));
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>(
    {},
  );

  const isEditing = Boolean(guardian);
  const title = useMemo(
    () =>
      guardian
        ? `Editar apoderado ${guardian.full_name}`
        : "Nuevo apoderado",
    [guardian],
  );

  const updateField = <T extends keyof FormState>(
    field: T,
    value: FormState[T],
  ) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validationErrors = validate(form, isEditing);

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    const payload: GuardianPayload = {
      dni: form.dni.trim(),
      email: form.email.trim(),
      first_name: form.first_name.trim(),
      is_active: guardian?.activo ?? true,
      last_name: form.last_name.trim(),
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
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-theme-xl">
        <div className="flex items-start justify-between border-b border-gray-100 px-6 py-5">
          <div>
            <p className="text-sm font-semibold text-brand-600">
              Gestion de usuarios
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
                DNI
              </label>
              <input
                className={`h-11 w-full rounded-lg border px-4 text-sm outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-50 ${
                  errors.dni ? "border-red-400" : "border-gray-200"
                }`}
                onChange={(event) => updateField("dni", event.target.value)}
                type="text"
                value={form.dni}
              />
              {errors.dni && (
                <p className="mt-2 text-sm text-red-600">{errors.dni}</p>
              )}
            </div>

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
                : guardian
                  ? "Guardar cambios"
                  : "Registrar apoderado"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
