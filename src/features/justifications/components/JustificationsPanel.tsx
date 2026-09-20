import { Download, RefreshCw } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  getAdministrativeJustifications,
  getGuardianJustifications,
  getJustificationDownloadUrl,
  getStudentJustifications,
  getTeacherJustification,
  getTeacherJustifications,
  reviewTeacherJustification,
  type AttendanceJustification,
  type JustificationFilters,
  type JustificationListResponse,
} from "../../guardian/services/justificationService";

export type JustificationViewerRole = "teacher" | "student" | "guardian" | "admin";

type Props = {
  assignmentId?: number;
  studentId?: number;
  role: JustificationViewerRole;
  title?: string;
};

const PAGE_SIZE = 10;
const STATUS_OPTIONS = [
  { label: "Todos los estados", value: "" },
  { label: "Carga pendiente", value: "PENDIENTE_CARGA" },
  { label: "En revision", value: "PENDIENTE_REVISION" },
  { label: "Aprobada", value: "APROBADA" },
  { label: "Rechazada", value: "RECHAZADA" },
];

function errorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "No se pudieron cargar las justificaciones.";
}

function formatDate(value: string | null | undefined) {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString("es-PE", {
        dateStyle: "medium",
        timeStyle: value.includes("T") ? "short" : undefined,
      });
}

function stateStyle(status: string) {
  if (status === "APROBADA") return "bg-green-100 text-green-800";
  if (status === "RECHAZADA") return "bg-red-100 text-red-800";
  if (status === "PENDIENTE_REVISION") return "bg-amber-100 text-amber-900";
  return "bg-gray-100 text-gray-700";
}

function StateBadge({ item }: { item: AttendanceJustification }) {
  return (
    <span className={`inline-flex rounded-lg px-2.5 py-1 text-xs font-semibold ${stateStyle(item.estado)}`}>
      {item.estado_label}
    </span>
  );
}

async function listForRole(
  role: JustificationViewerRole,
  filters: JustificationFilters,
  signal: AbortSignal,
) {
  if (role === "teacher") return getTeacherJustifications(filters, signal);
  if (role === "student") return getStudentJustifications(filters, signal);
  if (role === "guardian") return getGuardianJustifications(filters, signal);
  return getAdministrativeJustifications(filters, signal);
}

type DetailDialogProps = {
  isLoading: boolean;
  isSaving: boolean;
  item: AttendanceJustification;
  onClose: () => void;
  onDownload: (id: number) => Promise<void>;
  onReview?: (state: "APROBADA" | "RECHAZADA", comment: string) => Promise<void>;
};

function JustificationDetailDialog({
  isLoading,
  isSaving,
  item,
  onClose,
  onDownload,
  onReview,
}: DetailDialogProps) {
  const [comment, setComment] = useState(item.comentario_revision ?? "");
  const [error, setError] = useState<string | null>(null);
  const canReview = Boolean(onReview) && item.estado === "PENDIENTE_REVISION";

  useEffect(() => {
    setComment(item.comentario_revision ?? "");
    setError(null);
  }, [item]);

  const review = async (state: "APROBADA" | "RECHAZADA") => {
    const trimmed = comment.trim();
    if (trimmed.length < 10 || trimmed.length > 500) {
      setError("El comentario debe tener entre 10 y 500 caracteres.");
      return;
    }

    if (state === "RECHAZADA" && !window.confirm("Se rechazara esta justificacion. Deseas continuar?")) {
      return;
    }

    setError(null);
    try {
      await onReview?.(state, trimmed);
    } catch (requestError) {
      setError(errorMessage(requestError));
    }
  };

  return (
    <div aria-modal="true" className="fixed inset-0 z-[70] flex items-center justify-center bg-gray-950/50 p-4" role="dialog">
      <section className="max-h-full w-full max-w-2xl overflow-y-auto rounded-lg bg-white shadow-theme-xl">
        <header className="flex items-start justify-between gap-4 border-b border-gray-100 px-6 py-5">
          <div>
            <p className="text-sm font-semibold text-brand-600">Justificacion</p>
            <h2 className="mt-1 text-xl font-bold text-gray-900">{item.estudiante_nombre}</h2>
          </div>
          <button aria-label="Cerrar" className="flex h-9 w-9 items-center justify-center rounded-lg text-lg text-gray-500 hover:bg-gray-100" disabled={isSaving} onClick={onClose} type="button">x</button>
        </header>

        <div className="space-y-5 p-6">
          {isLoading ? (
            <p className="rounded-lg bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">Cargando detalle...</p>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <StateBadge item={item} />
                <span className="text-sm text-gray-500">Asistencia: {item.estado_asistencia || "-"}</span>
              </div>
              <dl className="grid gap-4 rounded-lg bg-gray-50 p-4 text-sm sm:grid-cols-2">
                <div><dt className="text-gray-500">Curso</dt><dd className="mt-1 font-semibold text-gray-900">{item.curso_nombre}</dd></div>
                <div><dt className="text-gray-500">Fecha de inasistencia</dt><dd className="mt-1 font-semibold text-gray-900">{formatDate(item.fecha_inasistencia)}</dd></div>
                <div><dt className="text-gray-500">Solicitada por</dt><dd className="mt-1 font-semibold text-gray-900">{item.apoderado_nombre || "-"}</dd></div>
                <div><dt className="text-gray-500">Fecha de solicitud</dt><dd className="mt-1 font-semibold text-gray-900">{formatDate(item.fecha_solicitud)}</dd></div>
              </dl>
              <div>
                <h3 className="text-sm font-semibold text-gray-700">Motivo</h3>
                <p className="mt-2 rounded-lg border border-gray-100 p-4 text-sm leading-6 text-gray-700">{item.motivo || "Sin motivo registrado."}</p>
              </div>
              <div className="flex flex-col gap-3 rounded-lg border border-gray-200 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0"><p className="truncate text-sm font-semibold text-gray-900">{item.archivo_nombre || "Sustento"}</p><p className="mt-1 text-xs text-gray-500">{item.archivo_mime_type || "Archivo adjunto"}{item.archivo_tamano ? ` / ${(item.archivo_tamano / 1024 / 1024).toFixed(2)} MiB` : ""}</p></div>
                {item.archivo_disponible ? <button className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-brand-200 px-3 text-sm font-semibold text-brand-700 hover:bg-brand-50" disabled={isSaving} onClick={() => void onDownload(item.id)} type="button"><Download size={16} /> Descargar</button> : <span className="text-sm text-gray-500">Archivo no disponible</span>}
              </div>
              {item.comentario_revision && <div><h3 className="text-sm font-semibold text-gray-700">Revision docente</h3><p className="mt-2 rounded-lg border border-gray-100 p-4 text-sm leading-6 text-gray-700">{item.comentario_revision}</p><p className="mt-2 text-xs text-gray-500">{item.revisado_por_nombre || "Docente"} / {formatDate(item.fecha_revision)}</p></div>}
              {canReview && <div className="border-t border-gray-100 pt-5"><label className="block text-sm font-semibold text-gray-700">Comentario de revision<textarea className="mt-2 min-h-28 w-full rounded-lg border border-gray-200 px-3 py-3 text-sm outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-50" disabled={isSaving} maxLength={500} minLength={10} onChange={(event) => setComment(event.target.value)} required value={comment} /></label><p className="mt-1 text-xs text-gray-500">{comment.length}/500 caracteres</p>{error && <p className="mt-3 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}<div className="mt-4 flex flex-wrap justify-end gap-3"><button className="h-10 rounded-lg border border-red-200 px-4 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50" disabled={isSaving} onClick={() => void review("RECHAZADA")} type="button">{isSaving ? "Guardando..." : "Rechazar"}</button><button className="h-10 rounded-lg bg-green-600 px-4 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50" disabled={isSaving} onClick={() => void review("APROBADA")} type="button">{isSaving ? "Guardando..." : "Aprobar"}</button></div></div>}
            </>
          )}
        </div>
      </section>
    </div>
  );
}

export function JustificationsPanel({ assignmentId, studentId, role, title = "Justificaciones" }: Props) {
  const [list, setList] = useState<JustificationListResponse | null>(null);
  const [status, setStatus] = useState("");
  const [typedAssignmentId, setTypedAssignmentId] = useState("");
  const [typedStudentId, setTypedStudentId] = useState("");
  const [page, setPage] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [selected, setSelected] = useState<AttendanceJustification | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [isReviewSaving, setIsReviewSaving] = useState(false);
  const hasLoadedRef = useRef(false);

  const filters = useMemo<JustificationFilters>(() => ({
    asignacion_curso: assignmentId ?? (Number(typedAssignmentId) || undefined),
    estudiante: studentId ?? (Number(typedStudentId) || undefined),
    estado: status || undefined,
    page,
    pageSize: PAGE_SIZE,
  }), [assignmentId, page, status, studentId, typedAssignmentId, typedStudentId]);

  useEffect(() => {
    const controller = new AbortController();
    const initialLoad = !hasLoadedRef.current;
    if (initialLoad) setIsLoading(true);
    else setIsRefreshing(true);
    setError(null);

    void listForRole(role, filters, controller.signal)
      .then((response) => {
        if (controller.signal.aborted) return;
        setList(response);
        hasLoadedRef.current = true;
      })
      .catch((requestError: unknown) => {
        if (controller.signal.aborted) return;
        setError(errorMessage(requestError));
      })
      .finally(() => {
        if (controller.signal.aborted) return;
        setIsLoading(false);
        setIsRefreshing(false);
      });

    return () => controller.abort();
  }, [filters, refreshKey, role]);

  const records = list?.results ?? [];
  const total = list?.count ?? records.length;
  const totalFromServer = list?.count;
  const hasPrevious = page > 1 && (Boolean(list?.previous) || list?.count !== null);
  const hasNext = Boolean(list?.next) || (
    totalFromServer !== null &&
    totalFromServer !== undefined &&
    page < Math.ceil(totalFromServer / PAGE_SIZE)
  );
  const canReview = role === "teacher";
  const canFilterInstitutionally = role === "admin" && !assignmentId && !studentId;

  const changeStatus = (next: string) => {
    setStatus(next);
    setPage(1);
  };

  const download = async (id: number) => {
    setDownloadingId(id);
    setError(null);
    try {
      const url = await getJustificationDownloadUrl(id);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setDownloadingId(null);
    }
  };

  const openDetail = async (item: AttendanceJustification) => {
    setSelected(item);
    if (!canReview) return;

    setIsDetailLoading(true);
    try {
      const detail = await getTeacherJustification(item.id);
      setSelected(detail);
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setIsDetailLoading(false);
    }
  };

  const review = async (state: "APROBADA" | "RECHAZADA", comment: string) => {
    if (!selected) return;
    setIsReviewSaving(true);
    try {
      const updated = await reviewTeacherJustification(selected.id, {
        estado: state,
        comentario: comment,
      });
      setSelected(updated);
      setList((current) => current ? {
        ...current,
        results: current.results.map((item) => item.id === updated.id ? updated : item),
      } : current);
      setNotice(
        state === "APROBADA"
          ? "Justificacion aprobada. La asistencia se actualizo como justificada."
          : "Justificacion rechazada. El apoderado fue notificado por el backend.",
      );
    } finally {
      setIsReviewSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-theme-xs">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900">{title}</h3>
            <p className="mt-1 text-sm text-gray-500">Sustentos de inasistencias y su estado de revision.</p>
          </div>
          <button aria-label="Actualizar justificaciones" className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-gray-200 px-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50" disabled={isRefreshing} onClick={() => setRefreshKey((current) => current + 1)} title="Actualizar" type="button"><RefreshCw size={16} className={isRefreshing ? "animate-spin" : ""} /> Actualizar</button>
        </div>
        <div className={`mt-4 grid gap-3 ${canFilterInstitutionally ? "md:grid-cols-3" : "sm:grid-cols-2"}`}>
          <label className="text-sm font-semibold text-gray-700">Estado<select className="mt-2 h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm font-normal" onChange={(event) => changeStatus(event.target.value)} value={status}>{STATUS_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
          {canFilterInstitutionally && <label className="text-sm font-semibold text-gray-700">Asignacion de curso<input className="mt-2 h-10 w-full rounded-lg border border-gray-200 px-3 text-sm font-normal" inputMode="numeric" min="1" onChange={(event) => { setTypedAssignmentId(event.target.value); setPage(1); }} placeholder="ID de asignacion" type="number" value={typedAssignmentId} /></label>}
          {canFilterInstitutionally && <label className="text-sm font-semibold text-gray-700">Estudiante<input className="mt-2 h-10 w-full rounded-lg border border-gray-200 px-3 text-sm font-normal" inputMode="numeric" min="1" onChange={(event) => { setTypedStudentId(event.target.value); setPage(1); }} placeholder="ID de estudiante" type="number" value={typedStudentId} /></label>}
        </div>
      </section>

      {notice && <p className="rounded-lg border border-green-100 bg-green-50 px-4 py-3 text-sm text-green-800">{notice}</p>}
      {error && <p className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      {isLoading && <section className="rounded-lg border border-gray-200 bg-white px-6 py-10 text-center text-sm text-gray-500">Cargando justificaciones...</section>}

      {!isLoading && records.length === 0 && !error && <section className="rounded-lg border border-dashed border-gray-200 bg-white px-6 py-10 text-center text-sm text-gray-500">No hay justificaciones para los filtros seleccionados.</section>}

      {!isLoading && records.length > 0 && <section className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-theme-xs"><div className="flex items-center justify-between border-b border-gray-100 px-5 py-4"><h4 className="font-bold text-gray-900">{total} justificaciones</h4>{isRefreshing && <span className="text-xs text-gray-500">Actualizando sin ocultar los registros...</span>}</div><div className="hidden overflow-x-auto lg:block"><table className="min-w-[900px] text-left text-sm"><thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500"><tr><th className="px-5 py-3">Estudiante</th><th className="px-5 py-3">Curso y fecha</th><th className="px-5 py-3">Estado</th><th className="px-5 py-3">Archivo</th><th className="px-5 py-3"><span className="sr-only">Acciones</span></th></tr></thead><tbody className="divide-y divide-gray-100">{records.map((item) => <tr key={item.id}><td className="px-5 py-4"><p className="font-semibold text-gray-900">{item.estudiante_nombre}</p>{role === "admin" && <p className="mt-1 text-xs text-gray-500">{item.apoderado_nombre || "Sin apoderado"}</p>}</td><td className="px-5 py-4"><p className="font-medium text-gray-800">{item.curso_nombre}</p><p className="mt-1 text-xs text-gray-500">{formatDate(item.fecha_inasistencia)} / {item.estado_asistencia || "-"}</p></td><td className="px-5 py-4"><StateBadge item={item} /></td><td className="px-5 py-4 text-gray-600">{item.archivo_disponible ? item.archivo_nombre || "Disponible" : "No disponible"}</td><td className="px-5 py-4"><div className="flex justify-end gap-2">{item.archivo_disponible && <button aria-label={`Descargar sustento de ${item.estudiante_nombre}`} className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50" disabled={downloadingId === item.id} onClick={() => void download(item.id)} title="Descargar sustento" type="button"><Download size={16} /></button>}<button className="h-9 rounded-lg border border-brand-200 px-3 text-xs font-semibold text-brand-700 hover:bg-brand-50" onClick={() => void openDetail(item)} type="button">{canReview && item.estado === "PENDIENTE_REVISION" ? "Revisar" : "Ver detalle"}</button></div></td></tr>)}</tbody></table></div><div className="divide-y divide-gray-100 lg:hidden">{records.map((item) => <article className="space-y-3 p-5" key={item.id}><div className="flex items-start justify-between gap-3"><div><h4 className="font-bold text-gray-900">{item.estudiante_nombre}</h4><p className="mt-1 text-xs text-gray-500">{item.curso_nombre} / {formatDate(item.fecha_inasistencia)}</p></div><StateBadge item={item} /></div><p className="line-clamp-2 text-sm text-gray-600">{item.motivo || "Sin motivo registrado."}</p><div className="flex gap-2">{item.archivo_disponible && <button className="inline-flex h-9 items-center gap-2 rounded-lg border border-gray-200 px-3 text-xs font-semibold text-gray-700 disabled:opacity-50" disabled={downloadingId === item.id} onClick={() => void download(item.id)} type="button"><Download size={15} /> Archivo</button>}<button className="h-9 rounded-lg border border-brand-200 px-3 text-xs font-semibold text-brand-700" onClick={() => void openDetail(item)} type="button">{canReview && item.estado === "PENDIENTE_REVISION" ? "Revisar" : "Ver detalle"}</button></div></article>)}</div><footer className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 px-5 py-3 text-sm"><span className="text-gray-500">Pagina {page}</span><div className="flex gap-2"><button className="h-9 rounded-lg border border-gray-200 px-3 font-semibold text-gray-700 disabled:opacity-50" disabled={!hasPrevious || isRefreshing} onClick={() => setPage((current) => Math.max(1, current - 1))} type="button">Anterior</button><button className="h-9 rounded-lg border border-gray-200 px-3 font-semibold text-gray-700 disabled:opacity-50" disabled={!hasNext || isRefreshing} onClick={() => setPage((current) => current + 1)} type="button">Siguiente</button></div></footer></section>}

      {selected && <JustificationDetailDialog isLoading={isDetailLoading} isSaving={isReviewSaving} item={selected} onClose={() => setSelected(null)} onDownload={download} onReview={canReview ? review : undefined} />}
    </div>
  );
}
