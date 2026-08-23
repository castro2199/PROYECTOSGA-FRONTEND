export type InstitutionalSettings = {
  id: number;
  nombre_institucion: string;
  codigo_modular: string | null;
  direccion: string | null;
  telefono: string | null;
  email: string | null;
  director: string | null;
  logo_url: string | null;
  zona_horaria: string;
  anio_academico_activo: number | null;
  anio_academico_activo_label: string | null;
  activo: boolean;
  creado_en: string;
  actualizado_en: string;
};

export type InstitutionalSettingsPayload = {
  nombre_institucion: string;
  codigo_modular: string | null;
  direccion: string | null;
  telefono: string | null;
  email: string | null;
  director: string | null;
  logo_url: string | null;
  zona_horaria: string;
  anio_academico_activo: number | null;
  activo: boolean;
};

export type InstitutionalSettingsUpdatePayload =
  Partial<InstitutionalSettingsPayload>;
