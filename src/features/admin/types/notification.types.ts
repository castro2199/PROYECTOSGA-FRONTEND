export type NotificationDeliveryStatus =
  | "PENDIENTE"
  | "ENVIADA"
  | "FALLIDA"
  | "LEIDA";

export type AdminNotification = {
  activo: boolean;
  apoderado: number;
  apoderado_email: string;
  apoderado_label: string;
  estudiante_codigo: string;
  estudiante_label: string;
  estado_envio: NotificationDeliveryStatus;
  fecha_envio: string | null;
  fecha_lectura: string | null;
  id: number;
  incidencia: number;
  incidencia_label: string;
  mensaje: string;
  titulo: string;
};

export type AdminNotificationPayload = {
  apoderado: number;
  incidencia: number;
  mensaje: string;
  titulo: string;
};
