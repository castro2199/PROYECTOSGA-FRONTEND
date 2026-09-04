export type InstitutionalEmailStatus = "PENDIENTE" | "ENVIADO" | "FALLIDO";

export type InstitutionalEmail = {
  accion_texto: string | null;
  accion_url: string | null;
  asunto: string;
  detalle_error: string | null;
  destinatario: number;
  destinatario_email: string;
  destinatario_nombre: string;
  enviado_por: number | null;
  enviado_por_username: string;
  estado: InstitutionalEmailStatus;
  fecha_creacion: string;
  fecha_envio: string | null;
  id: number;
  incidencia: number | null;
  mensaje: string;
  rol_destinatario: string;
};

export type InstitutionalEmailPayload = {
  accion_ruta?: string;
  accion_texto?: string;
  asunto: string;
  mensaje: string;
  usuario_id: number;
};

export type InstitutionalEmailPreview = {
  asunto: string;
  html: string;
  rol: string;
  texto: string;
};
