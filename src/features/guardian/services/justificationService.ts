import { formatApiObject } from "../../admin/utils/apiMessages";
import { authFetch } from "../../auth/services/authService";

export type JustificationStatus =
  | "PENDIENTE_CARGA"
  | "PENDIENTE_REVISION"
  | "APROBADA"
  | "RECHAZADA"
  | string;

export type AttendanceJustification = {
  id: number;
  asistencia: number;
  estudiante_id: number;
  estudiante_nombre: string;
  asignacion_curso_id: number;
  curso_nombre: string;
  grado_nombre: string;
  seccion_nombre: string;
  anio_academico: number;
  fecha_inasistencia: string;
  estado_asistencia: string;
  apoderado: number;
  apoderado_nombre: string;
  motivo: string;
  estado: JustificationStatus;
  estado_label: string;
  archivo_nombre: string;
  archivo_mime_type: string;
  archivo_tamano: number;
  archivo_disponible: boolean;
  comentario_revision: string | null;
  revisado_por_nombre: string | null;
  fecha_solicitud: string;
  fecha_revision: string | null;
};

export type JustificationFilters = {
  asignacion_curso?: number;
  estado?: string;
  estudiante?: number;
  page?: number;
  pageSize?: number;
};

export type JustificationListResponse = {
  count: number | null;
  next: string | null;
  previous: string | null;
  results: AttendanceJustification[];
};

type SignedUpload = {
  url: string;
  metodo?: string;
  headers: Record<string, string>;
};

type UploadRequestResponse = {
  justificacion: Pick<AttendanceJustification, "id" | "estado" | "estado_label">;
  carga: SignedUpload;
};

export type JustificationUploadStage =
  | "requesting"
  | "uploading"
  | "confirming";

export type JustificationUploadCallbacks = {
  onProgress?: (progress: number | null) => void;
  onStage?: (stage: JustificationUploadStage) => void;
};

export class JustificationRequestError extends Error {
  details: unknown;
  status: number;

  constructor(message: string, status: number, details: unknown) {
    super(message);
    this.name = "JustificationRequestError";
    this.status = status;
    this.details = details;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function messageFrom(data: unknown, fallback: string) {
  if (isRecord(data)) {
    const message = formatApiObject(data);
    if (message) return message;
  }

  return fallback;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await authFetch(path, init);
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const fallback = response.status === 403
      ? "No tienes permiso para acceder a este recurso."
      : response.status === 401
        ? "Tu sesion expiro. Inicia sesion nuevamente."
        : "No se pudo completar la solicitud.";
    throw new JustificationRequestError(
      messageFrom(data, fallback),
      response.status,
      data,
    );
  }

  return data as T;
}

function appendFilters(path: string, filters: JustificationFilters = {}) {
  const params = new URLSearchParams();
  if (filters.asignacion_curso) {
    params.set("asignacion_curso", String(filters.asignacion_curso));
  }
  if (filters.estudiante) params.set("estudiante", String(filters.estudiante));
  if (filters.estado) params.set("estado", filters.estado);
  if (filters.page && filters.page > 1) params.set("page", String(filters.page));
  if (filters.pageSize) params.set("page_size", String(filters.pageSize));
  return params.size ? `${path}?${params.toString()}` : path;
}

function normalizeJustification(value: unknown): AttendanceJustification | null {
  if (!isRecord(value) || !Number.isFinite(Number(value.id))) return null;

  return {
    id: Number(value.id),
    asistencia: Number(value.asistencia) || 0,
    estudiante_id: Number(value.estudiante_id) || 0,
    estudiante_nombre: String(value.estudiante_nombre ?? "Estudiante"),
    asignacion_curso_id: Number(value.asignacion_curso_id) || 0,
    curso_nombre: String(value.curso_nombre ?? "Curso"),
    grado_nombre: String(value.grado_nombre ?? ""),
    seccion_nombre: String(value.seccion_nombre ?? ""),
    anio_academico: Number(value.anio_academico) || 0,
    fecha_inasistencia: String(value.fecha_inasistencia ?? ""),
    estado_asistencia: String(value.estado_asistencia ?? ""),
    apoderado: Number(value.apoderado) || 0,
    apoderado_nombre: String(value.apoderado_nombre ?? ""),
    motivo: String(value.motivo ?? ""),
    estado: String(value.estado ?? "PENDIENTE_CARGA"),
    estado_label: String(value.estado_label ?? value.estado ?? "Pendiente"),
    archivo_nombre: String(value.archivo_nombre ?? ""),
    archivo_mime_type: String(value.archivo_mime_type ?? ""),
    archivo_tamano: Number(value.archivo_tamano) || 0,
    archivo_disponible: Boolean(value.archivo_disponible),
    comentario_revision:
      typeof value.comentario_revision === "string"
        ? value.comentario_revision
        : null,
    revisado_por_nombre:
      typeof value.revisado_por_nombre === "string"
        ? value.revisado_por_nombre
        : null,
    fecha_solicitud: String(value.fecha_solicitud ?? ""),
    fecha_revision:
      typeof value.fecha_revision === "string" ? value.fecha_revision : null,
  };
}

function normalizeList(data: unknown): JustificationListResponse {
  const source = isRecord(data) ? data : {};
  const rawItems = Array.isArray(data)
    ? data
    : Array.isArray(source.results)
      ? source.results
      : Array.isArray(source.items)
        ? source.items
        : [];

  return {
    count: Number.isFinite(Number(source.count)) ? Number(source.count) : null,
    next: typeof source.next === "string" ? source.next : null,
    previous: typeof source.previous === "string" ? source.previous : null,
    results: rawItems
      .map(normalizeJustification)
      .filter((item): item is AttendanceJustification => Boolean(item)),
  };
}

async function getJustifications(
  path: string,
  filters?: JustificationFilters,
  signal?: AbortSignal,
) {
  const data = await request<unknown>(appendFilters(path, filters), { signal });
  return normalizeList(data);
}

export function getGuardianJustifications(
  filters?: JustificationFilters,
  signal?: AbortSignal,
) {
  return getJustifications("/api/apoderado/justificaciones/", filters, signal);
}

export function getTeacherJustifications(
  filters?: JustificationFilters,
  signal?: AbortSignal,
) {
  return getJustifications("/api/docente/justificaciones/", filters, signal);
}

export function getStudentJustifications(
  filters?: JustificationFilters,
  signal?: AbortSignal,
) {
  return getJustifications("/api/estudiante/justificaciones/", filters, signal);
}

export function getAdministrativeJustifications(
  filters?: JustificationFilters,
  signal?: AbortSignal,
) {
  return getJustifications("/api/administracion/justificaciones/", filters, signal);
}

export function getTeacherJustification(justificationId: number) {
  return request<unknown>(`/api/docente/justificaciones/${justificationId}/`).then(
    (data) => {
      const justification = normalizeJustification(data);
      if (!justification) {
        throw new JustificationRequestError(
          "El servidor no devolvio una justificacion valida.",
          500,
          data,
        );
      }
      return justification;
    },
  );
}

export function reviewTeacherJustification(
  justificationId: number,
  payload: { estado: "APROBADA" | "RECHAZADA"; comentario: string },
) {
  return request<unknown>(
    `/api/docente/justificaciones/${justificationId}/revisar/`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  ).then((data) => {
    const justification = normalizeJustification(data);
    if (!justification) {
      throw new JustificationRequestError(
        "El servidor no devolvio una justificacion valida.",
        500,
        data,
      );
    }
    return justification;
  });
}

function uploadFile(
  upload: SignedUpload,
  file: File,
  onProgress?: (progress: number | null) => void,
) {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(upload.metodo || "PUT", upload.url, true);
    Object.entries(upload.headers).forEach(([key, value]) => {
      xhr.setRequestHeader(key, value);
    });
    xhr.upload.onprogress = (event) => {
      onProgress?.(
        event.lengthComputable ? Math.round((event.loaded / event.total) * 100) : null,
      );
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress?.(100);
        resolve();
        return;
      }

      reject(
        new JustificationRequestError(
          xhr.status === 403
            ? "No se pudo subir el sustento. La URL de carga vencio o ya no es valida. Solicita una nueva carga."
            : "No se pudo subir el sustento a almacenamiento. Intenta nuevamente.",
          xhr.status,
          null,
        ),
      );
    };
    xhr.onerror = () =>
      reject(
        new JustificationRequestError(
          "No se pudo conectar con el almacenamiento para subir el sustento.",
          0,
          null,
        ),
      );
    xhr.onabort = () =>
      reject(
        new JustificationRequestError("La carga del sustento fue cancelada.", 0, null),
      );
    xhr.send(file);
  });
}

export async function submitJustification(
  attendanceId: number,
  file: File,
  motivo: string,
  callbacks: JustificationUploadCallbacks = {},
) {
  callbacks.onStage?.("requesting");
  const result = await request<UploadRequestResponse>(
    "/api/apoderado/justificaciones/solicitar-carga/",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        asistencia_id: attendanceId,
        nombre_archivo: file.name,
        mime_type: file.type,
        tamano: file.size,
        motivo,
      }),
    },
  );

  callbacks.onStage?.("uploading");
  await uploadFile(result.carga, file, callbacks.onProgress);
  callbacks.onStage?.("confirming");
  const confirmed = await request<unknown>(
    `/api/apoderado/justificaciones/${result.justificacion.id}/confirmar/`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ confirmar: true }),
    },
  );
  const justification = normalizeJustification(confirmed);

  if (!justification) {
    throw new JustificationRequestError(
      "El servidor no devolvio la justificacion confirmada.",
      500,
      confirmed,
    );
  }

  return justification;
}

export async function getJustificationDownloadUrl(justificationId: number) {
  const data = await request<unknown>(`/api/justificaciones/${justificationId}/descarga/`);
  const source = isRecord(data) ? data : {};
  const url = source.url ?? source.download_url ?? source.archivo_url;

  if (typeof url !== "string" || !/^https?:\/\//i.test(url)) {
    throw new JustificationRequestError(
      "El servidor no devolvio una URL temporal valida para el sustento.",
      500,
      data,
    );
  }

  return url;
}

export function removeJustification(id: number) {
  return request<unknown>(`/api/apoderado/justificaciones/${id}/`, {
    method: "DELETE",
  });
}
