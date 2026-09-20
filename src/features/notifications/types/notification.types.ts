export type NotificationPriority = "BAJA" | "MEDIA" | "ALTA" | "URGENTE" | string;

export type SgaNotification = {
  id: number;
  destinatario_label: string;
  destinatario_rol: string;
  enviado_por_label: string;
  tipo: string;
  tipo_label: string;
  prioridad: NotificationPriority;
  prioridad_label: string;
  titulo: string;
  mensaje: string;
  accion_url: string | null;
  datos?: unknown | null;
  estado_envio: string;
  fecha_envio: string | null;
  fecha_lectura: string | null;
  leida: boolean;
  creado_en: string | null;
  detalle_error: string | null;
};

export type NotificationsMeta = {
  ultimo_id: number | null;
  intervalo_polling_segundos: number | null;
};

export type NotificationsResponse = {
  items: SgaNotification[];
  meta: NotificationsMeta;
};

export type NotificationRecipient = {
  id: number;
  label: string;
  rol: string;
};

export type NotificationSettings = {
  browserEnabled: boolean;
  soundEnabled: boolean;
};
