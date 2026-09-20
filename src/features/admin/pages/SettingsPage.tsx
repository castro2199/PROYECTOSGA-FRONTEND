import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { useAcademicYears } from "../hooks/useAcademicYears";
import { useSettings } from "../hooks/useSettings";
import { useAuth } from "../../auth/hooks/useAuth";
import { BackupsPanel } from "../components/BackupsPanel";
import type { InstitutionalSettings } from "../types/settings.types";

type SettingsPageProps = {
  token: string;
};

type FormState = {
  activo: boolean;
  anio_academico_activo: string;
  codigo_modular: string;
  direccion: string;
  director: string;
  email: string;
  logo_url: string;
  nombre_institucion: string;
  telefono: string;
  zona_horaria: string;
};

const initialForm: FormState = {
  activo: true,
  anio_academico_activo: "",
  codigo_modular: "",
  direccion: "",
  director: "",
  email: "",
  logo_url: "",
  nombre_institucion: "",
  telefono: "",
  zona_horaria: "America/Lima",
};

function buildForm(settings: InstitutionalSettings): FormState {
  return {
    activo: settings.activo,
    anio_academico_activo: settings.anio_academico_activo
      ? String(settings.anio_academico_activo)
      : "",
    codigo_modular: settings.codigo_modular ?? "",
    direccion: settings.direccion ?? "",
    director: settings.director ?? "",
    email: settings.email ?? "",
    logo_url: settings.logo_url ?? "",
    nombre_institucion: settings.nombre_institucion,
    telefono: settings.telefono ?? "",
    zona_horaria: settings.zona_horaria || "America/Lima",
  };
}

function emptyToNull(value: string) {
  const cleanValue = value.trim();
  return cleanValue ? cleanValue : null;
}

function formatDateTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("es-PE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function validate(form: FormState) {
  const errors: Partial<Record<keyof FormState, string>> = {};

  if (!form.nombre_institucion.trim()) {
    errors.nombre_institucion = "Ingresa el nombre de la institucion.";
  }

  if (!form.zona_horaria.trim()) {
    errors.zona_horaria = "Ingresa la zona horaria.";
  }

  if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = "Ingresa un correo valido.";
  }

  if (form.logo_url.trim()) {
    try {
      new URL(form.logo_url);
    } catch {
      errors.logo_url = "Ingresa una URL valida.";
    }
  }

  return errors;
}

export function SettingsPage({ token }: SettingsPageProps) {
  const { user } = useAuth();
  const { error, isLoading, isSaving, reload, saveSettings, settings } =
    useSettings(token);
  const {
    academicYears,
    error: academicYearsError,
    isLoading: isLoadingAcademicYears,
    reload: reloadAcademicYears,
  } = useAcademicYears(token);
  const [form, setForm] = useState<FormState>(initialForm);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>(
    {},
  );
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (settings) {
      setForm(buildForm(settings));
    }
  }, [settings]);

  const isBusy = isLoading || isSaving || isLoadingAcademicYears;

  const updateField = <T extends keyof FormState>(
    field: T,
    value: FormState[T],
  ) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setSuccessMessage(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validationErrors = validate(form);

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    await saveSettings({
      activo: form.activo,
      anio_academico_activo: form.anio_academico_activo
        ? Number(form.anio_academico_activo)
        : null,
      codigo_modular: emptyToNull(form.codigo_modular),
      direccion: emptyToNull(form.direccion),
      director: emptyToNull(form.director),
      email: emptyToNull(form.email),
      logo_url: emptyToNull(form.logo_url),
      nombre_institucion: form.nombre_institucion.trim(),
      telefono: emptyToNull(form.telefono),
      zona_horaria: form.zona_horaria.trim(),
    });
    setSuccessMessage("Configuracion actualizada correctamente.");
  };

  const reloadAll = () => {
    setSuccessMessage(null);
    void reload();
    void reloadAcademicYears();
  };

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-theme-xs sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-brand-600">Configuracion</p>
          <h2 className="mt-2 text-2xl font-bold text-gray-900">
            Configuracion institucional
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            Administra los datos base de la institucion y el anio academico
            activo del sistema.
          </p>
        </div>

        <button
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-70"
          disabled={isBusy}
          onClick={reloadAll}
          type="button"
        >
          <img alt="" className="h-4 w-4" src="/admin-icons/docs.svg" />
          {isLoading || isLoadingAcademicYears ? "Actualizando..." : "Actualizar"}
        </button>
      </section>

      {(error || academicYearsError) && (
        <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error ?? academicYearsError}
        </div>
      )}

      {successMessage && (
        <div className="rounded-lg border border-success-100 bg-success-50 px-4 py-3 text-sm text-success-700">
          {successMessage}
        </div>
      )}

      {isLoading ? (
        <section className="rounded-2xl border border-gray-200 bg-white px-6 py-10 text-center text-sm text-gray-500 shadow-theme-xs">
          Cargando configuracion...
        </section>
      ) : (
        <form
          className="grid gap-6 xl:grid-cols-[1fr_360px]"
          onSubmit={handleSubmit}
        >
          <section className="space-y-5 rounded-2xl border border-gray-200 bg-white p-6 shadow-theme-xs">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Nombre de la institucion
                </label>
                <input
                  className={`h-11 w-full rounded-lg border px-4 text-sm outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-50 ${
                    errors.nombre_institucion
                      ? "border-red-400"
                      : "border-gray-200"
                  }`}
                  disabled={isSaving}
                  maxLength={200}
                  onChange={(event) =>
                    updateField("nombre_institucion", event.target.value)
                  }
                  value={form.nombre_institucion}
                />
                {errors.nombre_institucion && (
                  <p className="mt-2 text-sm text-red-600">
                    {errors.nombre_institucion}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Codigo modular
                </label>
                <input
                  className="h-11 w-full rounded-lg border border-gray-200 px-4 text-sm outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-50"
                  disabled={isSaving}
                  maxLength={30}
                  onChange={(event) =>
                    updateField("codigo_modular", event.target.value)
                  }
                  value={form.codigo_modular}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Director
                </label>
                <input
                  className="h-11 w-full rounded-lg border border-gray-200 px-4 text-sm outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-50"
                  disabled={isSaving}
                  maxLength={150}
                  onChange={(event) =>
                    updateField("director", event.target.value)
                  }
                  value={form.director}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Telefono
                </label>
                <input
                  className="h-11 w-full rounded-lg border border-gray-200 px-4 text-sm outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-50"
                  disabled={isSaving}
                  maxLength={20}
                  onChange={(event) =>
                    updateField("telefono", event.target.value)
                  }
                  value={form.telefono}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Email
                </label>
                <input
                  className={`h-11 w-full rounded-lg border px-4 text-sm outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-50 ${
                    errors.email ? "border-red-400" : "border-gray-200"
                  }`}
                  disabled={isSaving}
                  onChange={(event) => updateField("email", event.target.value)}
                  value={form.email}
                />
                {errors.email && (
                  <p className="mt-2 text-sm text-red-600">{errors.email}</p>
                )}
              </div>

              <div className="sm:col-span-2">
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Direccion
                </label>
                <input
                  className="h-11 w-full rounded-lg border border-gray-200 px-4 text-sm outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-50"
                  disabled={isSaving}
                  maxLength={250}
                  onChange={(event) =>
                    updateField("direccion", event.target.value)
                  }
                  value={form.direccion}
                />
              </div>

              <div className="sm:col-span-2">
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  URL del logo
                </label>
                <input
                  className={`h-11 w-full rounded-lg border px-4 text-sm outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-50 ${
                    errors.logo_url ? "border-red-400" : "border-gray-200"
                  }`}
                  disabled={isSaving}
                  maxLength={500}
                  onChange={(event) =>
                    updateField("logo_url", event.target.value)
                  }
                  value={form.logo_url}
                />
                {errors.logo_url && (
                  <p className="mt-2 text-sm text-red-600">
                    {errors.logo_url}
                  </p>
                )}
              </div>
            </div>
          </section>

          <aside className="space-y-6">
            <section className="space-y-5 rounded-2xl border border-gray-200 bg-white p-6 shadow-theme-xs">
              <h3 className="text-lg font-bold text-gray-900">
                Parametros del sistema
              </h3>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Anio academico activo
                </label>
                <select
                  className="h-11 w-full rounded-lg border border-gray-200 bg-white px-4 text-sm outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-50"
                  disabled={isSaving || isLoadingAcademicYears}
                  onChange={(event) =>
                    updateField("anio_academico_activo", event.target.value)
                  }
                  value={form.anio_academico_activo}
                >
                  <option value="">Sin anio activo</option>
                  {academicYears.map((year) => (
                    <option key={year.id} value={year.id}>
                      {year.anio} - {year.estado_label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Zona horaria
                </label>
                <input
                  className={`h-11 w-full rounded-lg border px-4 text-sm outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-50 ${
                    errors.zona_horaria ? "border-red-400" : "border-gray-200"
                  }`}
                  disabled={isSaving}
                  maxLength={50}
                  onChange={(event) =>
                    updateField("zona_horaria", event.target.value)
                  }
                  value={form.zona_horaria}
                />
                {errors.zona_horaria && (
                  <p className="mt-2 text-sm text-red-600">
                    {errors.zona_horaria}
                  </p>
                )}
              </div>

              <label className="flex items-center justify-between gap-4 rounded-xl border border-gray-200 px-4 py-3">
                <span>
                  <span className="block text-sm font-semibold text-gray-800">
                    Configuracion activa
                  </span>
                  <span className="mt-1 block text-xs text-gray-500">
                    Permite marcar la configuracion institucional como vigente.
                  </span>
                </span>
                <input
                  checked={form.activo}
                  className="h-5 w-5 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                  disabled={isSaving}
                  onChange={(event) =>
                    updateField("activo", event.target.checked)
                  }
                  type="checkbox"
                />
              </label>
            </section>

            {settings && (
              <section className="rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-600 shadow-theme-xs">
                <h3 className="text-lg font-bold text-gray-900">Auditoria</h3>
                <p className="mt-4">
                  Creado:{" "}
                  <span className="font-semibold text-gray-900">
                    {formatDateTime(settings.creado_en)}
                  </span>
                </p>
                <p className="mt-2">
                  Actualizado:{" "}
                  <span className="font-semibold text-gray-900">
                    {formatDateTime(settings.actualizado_en)}
                  </span>
                </p>
              </section>
            )}

            <button
              className="w-full rounded-lg bg-brand-500 px-5 py-3 text-sm font-semibold text-white shadow-theme-sm transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-70"
              disabled={isBusy}
              type="submit"
            >
              {isSaving ? "Guardando..." : "Guardar configuracion"}
            </button>
          </aside>
        </form>
      )}
      <BackupsPanel isSuperuser={Boolean(user?.is_superuser)} />
    </div>
  );
}
