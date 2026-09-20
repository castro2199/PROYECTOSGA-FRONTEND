import { useCallback, useEffect, useMemo, useState } from "react";
import { PaginationControls } from "../../../shared/components/PaginationControls";
import { useClientPagination } from "../../../shared/hooks/useClientPagination";
import { useAuth } from "../../auth/hooks/useAuth";
import { TeacherRecordModal } from "../components/TeacherRecordModal";
import { TeacherCommunicationModal } from "../components/TeacherCommunicationModal";
import {
  getTeacherCoursePeriods,
  getTeacherCourses,
  getTeacherCourseStudents,
  getTeacherRecommendation,
  getTeacherRecommendations,
  publishTeacherRecommendation,
  reviewTeacherRecommendation,
  type RecommendationReviewStatus,
  type TeacherCourse,
  type TeacherPeriod,
  type TeacherRecommendation,
  type TeacherStudent,
} from "../services/teacherService";

type Props = {
  embedded?: boolean;
  selectedCourseId?: number;
};

const STATUS_OPTIONS: Array<{
  label: string;
  value: RecommendationReviewStatus | "";
}> = [
  { label: "Todos los estados", value: "" },
  { label: "Pendiente", value: "PENDIENTE" },
  { label: "Aprobada", value: "APROBADA" },
  { label: "Editada", value: "EDITADA" },
  { label: "Rechazada", value: "RECHAZADA" },
];

const STATUS_STYLES: Record<RecommendationReviewStatus, string> = {
  APROBADA: "bg-green-50 text-green-700",
  EDITADA: "bg-blue-50 text-blue-700",
  PENDIENTE: "bg-amber-50 text-amber-700",
  RECHAZADA: "bg-red-50 text-red-700",
};

const inputClass =
  "h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-50 disabled:bg-gray-50";

function errorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "No se pudo completar la operacion.";
}

function formatDate(value: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString("es-PE", {
        dateStyle: "medium",
        timeStyle: "short",
      });
}

function recommendationItems(data: unknown): TeacherRecommendation[] {
  if (Array.isArray(data)) return data as TeacherRecommendation[];
  if (!data || typeof data !== "object") return [];
  const record = data as Record<string, unknown>;
  const items = record.results ?? record.items ?? record.data;
  return Array.isArray(items) ? (items as TeacherRecommendation[]) : [];
}

function StatusBadge({ recommendation }: { recommendation: TeacherRecommendation }) {
  return (
    <span
      className={`inline-flex rounded-lg px-2.5 py-1 text-xs font-semibold ${
        STATUS_STYLES[recommendation.estado_revision] ?? "bg-gray-100 text-gray-700"
      }`}
    >
      {recommendation.estado_revision_label || recommendation.estado_revision}
    </span>
  );
}

function TextList({ items }: { items?: string[] }) {
  if (!items?.length) return <p className="text-sm text-gray-500">Sin informacion.</p>;
  return (
    <ul className="space-y-2">
      {items.map((item, index) => (
        <li className="flex gap-2 text-sm leading-6 text-gray-700" key={`${item}-${index}`}>
          <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function PublishRecommendationModal({
  isSaving,
  onClose,
  onPublished,
  recommendation,
}: {
  isSaving: boolean;
  onClose: () => void;
  onPublished: (payload: { notificar_estudiante: boolean; notificar_apoderados: boolean; prioridad: "BAJA" | "MEDIA" | "ALTA" | "URGENTE"; mensaje_adicional: string }) => Promise<void>;
  recommendation: TeacherRecommendation;
}) {
  const [notifyStudent, setNotifyStudent] = useState(true);
  const [notifyGuardians, setNotifyGuardians] = useState(false);
  const [priority, setPriority] = useState<"BAJA" | "MEDIA" | "ALTA" | "URGENTE">("ALTA");
  const [message, setMessage] = useState("");
  return <div className="fixed inset-0 z-[60] flex items-center justify-center bg-gray-950/50 px-4"><form className="w-full max-w-lg rounded-lg bg-white p-6 shadow-theme-xl" onSubmit={(event) => { event.preventDefault(); void onPublished({ notificar_estudiante: notifyStudent, notificar_apoderados: notifyGuardians, prioridad: priority, mensaje_adicional: message }); }}><h2 className="text-xl font-bold text-gray-900">Publicar recomendación</h2><p className="mt-2 text-sm leading-6 text-gray-600">{recommendation.estudiante_label} recibirá la recomendación publicada según los destinatarios seleccionados.</p><div className="mt-5 space-y-3"><label className="flex items-center gap-3 text-sm font-semibold text-gray-800"><input checked={notifyStudent} onChange={(event) => setNotifyStudent(event.target.checked)} type="checkbox" /> Notificar al estudiante</label><label className="flex items-center gap-3 text-sm font-semibold text-gray-800"><input checked={notifyGuardians} onChange={(event) => setNotifyGuardians(event.target.checked)} type="checkbox" /> Notificar a apoderados</label><label className="block text-sm font-semibold text-gray-700">Prioridad<select className="mt-2 h-10 w-full rounded-lg border border-gray-200 bg-white px-3 font-normal" onChange={(event) => setPriority(event.target.value as typeof priority)} value={priority}><option value="BAJA">Baja</option><option value="MEDIA">Media</option><option value="ALTA">Alta</option><option value="URGENTE">Urgente</option></select></label><label className="block text-sm font-semibold text-gray-700">Mensaje adicional<textarea className="mt-2 min-h-24 w-full rounded-lg border border-gray-200 px-3 py-2 font-normal" maxLength={2000} onChange={(event) => setMessage(event.target.value)} value={message} /></label></div><footer className="mt-6 flex justify-end gap-3"><button className="h-10 rounded-lg border border-gray-200 px-4 text-sm font-semibold text-gray-700" disabled={isSaving} onClick={onClose} type="button">Cancelar</button><button className="h-10 rounded-lg bg-brand-500 px-4 text-sm font-semibold text-white disabled:opacity-50" disabled={isSaving || (!notifyStudent && !notifyGuardians)} type="submit">{isSaving ? "Publicando..." : "Confirmar publicación"}</button></footer></form></div>;
}

function RecommendationDetailModal({
  isSaving,
  onClose,
  onReview,
  onPublish,
  onCommunicate,
  recommendation,
  requestError,
}: {
  isSaving: boolean;
  onClose: () => void;
  onReview: (
    status: Exclude<RecommendationReviewStatus, "PENDIENTE">,
    revisedText?: string,
  ) => Promise<void>;
  onPublish: () => void;
  onCommunicate: () => void;
  recommendation: TeacherRecommendation;
  requestError: string | null;
}) {
  const [revisedText, setRevisedText] = useState(
    recommendation.texto_revisado ||
      recommendation.texto_final ||
      recommendation.texto_generado ||
      "",
  );
  const [localError, setLocalError] = useState<string | null>(null);
  const content = recommendation.contenido_generado ?? {};

  const submitEdited = async () => {
    const value = revisedText.trim();
    if (value.length < 10) {
      setLocalError("El texto revisado debe tener al menos 10 caracteres.");
      return;
    }
    setLocalError(null);
    await onReview("EDITADA", value);
  };

  const reject = async () => {
    if (!window.confirm("Confirma que deseas rechazar esta recomendacion.")) return;
    await onReview("RECHAZADA");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/50 px-4 py-6">
      <div className="max-h-full w-full max-w-4xl overflow-y-auto rounded-lg bg-white shadow-theme-xl">
        <header className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-5 sm:px-6">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-bold text-gray-900">Detalle de recomendacion</h2>
              <StatusBadge recommendation={recommendation} />
            </div>
            <p className="mt-2 text-sm text-gray-600">
              {recommendation.estudiante_codigo} - {recommendation.estudiante_label}
            </p>
            <p className="mt-1 text-sm text-gray-500">
              {recommendation.curso_nombre || recommendation.asignacion_curso_label} / {recommendation.periodo_academico_label || "Sin periodo"}
            </p>
          </div>
          <button
            aria-label="Cerrar"
            className="h-9 w-9 shrink-0 rounded-lg text-xl text-gray-500 hover:bg-gray-100 disabled:opacity-50"
            disabled={isSaving}
            onClick={onClose}
            type="button"
          >
            x
          </button>
        </header>

        <div className="space-y-5 p-5 sm:p-6">
          <section>
            <h3 className="text-sm font-bold text-gray-900">Resumen</h3>
            <p className="mt-2 text-sm leading-6 text-gray-700">
              {content.resumen || recommendation.texto_final || recommendation.texto_generado}
            </p>
          </section>

          <div className="grid gap-5 md:grid-cols-2">
            <section className="rounded-lg border border-gray-200 p-4">
              <h3 className="mb-3 text-sm font-bold text-gray-900">Fortalezas</h3>
              <TextList items={content.fortalezas} />
            </section>
            <section className="rounded-lg border border-gray-200 p-4">
              <h3 className="mb-3 text-sm font-bold text-gray-900">Aspectos por reforzar</h3>
              <TextList items={content.aspectos_reforzar} />
            </section>
            <section className="rounded-lg border border-gray-200 p-4">
              <h3 className="mb-3 text-sm font-bold text-gray-900">Acciones para el docente</h3>
              <TextList items={content.acciones_docente} />
            </section>
            <section className="rounded-lg border border-gray-200 p-4">
              <h3 className="mb-3 text-sm font-bold text-gray-900">Acciones para el estudiante</h3>
              <TextList items={content.acciones_estudiante} />
            </section>
          </div>

          <section className="rounded-lg border border-gray-200 p-4">
            <h3 className="text-sm font-bold text-gray-900">Comunicacion con el apoderado</h3>
            <p className="mt-2 text-sm leading-6 text-gray-700">
              {content.comunicacion_apoderado || "Sin informacion."}
            </p>
          </section>

          <section className="border-t border-gray-100 pt-5">
            <label className="mb-2 block text-sm font-bold text-gray-900" htmlFor="reviewed-recommendation">
              Texto revisado por el docente
            </label>
            <textarea
              className="min-h-32 w-full rounded-lg border border-gray-200 px-4 py-3 text-sm leading-6 outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-50 disabled:bg-gray-50"
              disabled={isSaving}
              id="reviewed-recommendation"
              maxLength={5000}
              onChange={(event) => setRevisedText(event.target.value)}
              value={revisedText}
            />
            {localError && <p className="mt-2 text-sm font-medium text-red-700">{localError}</p>}
          </section>

          {requestError && <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{requestError}</div>}

          <footer className="flex flex-col-reverse gap-2 border-t border-gray-100 pt-5 sm:flex-row sm:justify-end">
            <button className="h-11 rounded-lg border border-gray-200 px-4 text-sm font-semibold text-gray-700 disabled:opacity-50" disabled={isSaving} onClick={onClose} type="button">Cerrar</button>
            {recommendation.estado_revision === "PENDIENTE" && <button className="h-11 rounded-lg border border-red-200 px-4 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50" disabled={isSaving} onClick={reject} type="button">Rechazar</button>}
            {recommendation.estado_revision === "PENDIENTE" && <button className="h-11 rounded-lg border border-brand-200 px-4 text-sm font-semibold text-brand-700 hover:bg-brand-50 disabled:opacity-50" disabled={isSaving} onClick={submitEdited} type="button">Editar</button>}
            {(["APROBADA", "EDITADA"] as RecommendationReviewStatus[]).includes(recommendation.estado_revision) && <button className="h-11 rounded-lg border border-emerald-200 px-4 text-sm font-semibold text-emerald-700 hover:bg-emerald-50 disabled:opacity-50" disabled={isSaving} onClick={onPublish} type="button">Publicar</button>}
            {(["APROBADA", "EDITADA"] as RecommendationReviewStatus[]).includes(recommendation.estado_revision) && <button className="h-11 rounded-lg border border-brand-200 px-4 text-sm font-semibold text-brand-700 hover:bg-brand-50 disabled:opacity-50" disabled={isSaving} onClick={onCommunicate} type="button">Comunicar</button>}
            {recommendation.estado_revision === "PENDIENTE" && <button className="h-11 rounded-lg bg-brand-500 px-4 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-50" disabled={isSaving} onClick={() => onReview("APROBADA")} type="button">{isSaving ? "Actualizando..." : "Aprobar"}</button>}
          </footer>
        </div>
      </div>
    </div>
  );
}

export function TeacherRecommendationsPage({ embedded = false, selectedCourseId }: Props) {
  const { refreshSessionData } = useAuth();
  const [courses, setCourses] = useState<TeacherCourse[]>([]);
  const [students, setStudents] = useState<TeacherStudent[]>([]);
  const [periods, setPeriods] = useState<TeacherPeriod[]>([]);
  const [courseId, setCourseId] = useState(selectedCourseId ? String(selectedCourseId) : "");
  const [studentId, setStudentId] = useState("");
  const [periodId, setPeriodId] = useState("");
  const [status, setStatus] = useState<RecommendationReviewStatus | "">("");
  const [recommendations, setRecommendations] = useState<TeacherRecommendation[]>([]);
  const [selected, setSelected] = useState<TeacherRecommendation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showGenerate, setShowGenerate] = useState(false);
  const [publishingRecommendation, setPublishingRecommendation] = useState<TeacherRecommendation | null>(null);
  const [publicationResult, setPublicationResult] = useState<string | null>(null);
  const [communicationRecommendation, setCommunicationRecommendation] = useState<TeacherRecommendation | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getTeacherCourses()
      .then((items) => setCourses(items.filter((item) => item.estado === 1)))
      .catch((requestError) => setError(errorMessage(requestError)));
  }, []);

  useEffect(() => {
    if (!courseId) {
      setStudents([]);
      setPeriods([]);
      return;
    }

    let ignore = false;
    Promise.all([
      getTeacherCourseStudents(Number(courseId)),
      getTeacherCoursePeriods(Number(courseId)),
    ])
      .then(([studentItems, periodItems]) => {
        if (!ignore) {
          setStudents(studentItems);
          setPeriods(periodItems);
        }
      })
      .catch((requestError) => {
        if (!ignore) setError(errorMessage(requestError));
      });
    return () => {
      ignore = true;
    };
  }, [courseId]);

  const filters = useMemo(
    () => ({
      asignacion_curso: courseId ? Number(courseId) : undefined,
      matricula: studentId ? Number(studentId) : undefined,
      periodo_academico: periodId ? Number(periodId) : undefined,
      estado_revision: status || undefined,
    }),
    [courseId, periodId, status, studentId],
  );

  const loadRecommendations = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await getTeacherRecommendations(filters);
      setRecommendations(recommendationItems(response));
    } catch (requestError) {
      setRecommendations([]);
      setError(errorMessage(requestError));
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    void loadRecommendations();
  }, [loadRecommendations]);
  const pagination = useClientPagination(recommendations);

  const changeCourse = (value: string) => {
    setCourseId(value);
    setStudentId("");
    setPeriodId("");
    setStudents([]);
    setPeriods([]);
  };

  const openDetail = async (id: number) => {
    setIsLoadingDetail(true);
    setError(null);
    try {
      setSelected(await getTeacherRecommendation(id));
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const refreshAfterMutation = async () => {
    await Promise.all([loadRecommendations(), refreshSessionData()]);
  };

  const review = async (
    reviewStatus: Exclude<RecommendationReviewStatus, "PENDIENTE">,
    revisedText?: string,
  ) => {
    if (!selected) return;
    setIsSaving(true);
    setError(null);
    try {
      const updated = await reviewTeacherRecommendation(selected.id, {
        estado_revision: reviewStatus,
        ...(reviewStatus === "EDITADA" ? { texto_revisado: revisedText } : {}),
      });
      setSelected(updated);
      await refreshAfterMutation();
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setIsSaving(false);
    }
  };

  const generationSaved = async () => {
    setShowGenerate(false);
    await refreshAfterMutation();
  };

  const publish = async (payload: { notificar_estudiante: boolean; notificar_apoderados: boolean; prioridad: "BAJA" | "MEDIA" | "ALTA" | "URGENTE"; mensaje_adicional: string }) => {
    if (!publishingRecommendation) return;
    setIsSaving(true);
    setError(null);
    try {
      const result = await publishTeacherRecommendation(publishingRecommendation.id, payload);
      const created = String(result.creadas ?? 0);
      const already = String(result.ya_notificados ?? 0);
      const sent = String(result.correos_enviados ?? 0);
      const failed = String(result.correos_fallidos ?? 0);
      setPublicationResult(`Publicación registrada. Creadas: ${created}; ya notificadas: ${already}; correos enviados: ${sent}; correos fallidos: ${failed}.`);
      setPublishingRecommendation(null);
      await refreshAfterMutation();
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally { setIsSaving(false); }
  };

  return (
    <div className="space-y-5">
      {!embedded && (
        <section className="flex flex-col gap-4 rounded-lg border border-gray-200 bg-white p-5 shadow-theme-xs lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-brand-600">Rol Docente</p>
            <h2 className="mt-2 text-2xl font-bold text-gray-900">Recomendaciones IA</h2>
            <p className="mt-2 text-sm leading-6 text-gray-600">Genera y revisa recomendaciones pedagogicas antes de publicarlas.</p>
          </div>
          <button className="h-11 rounded-lg bg-brand-500 px-4 text-sm font-semibold text-white hover:bg-brand-600" onClick={() => setShowGenerate(true)} type="button">Generar recomendacion</button>
        </section>
      )}

      {embedded && (
        <div className="flex justify-end">
          <button className="h-11 rounded-lg bg-brand-500 px-4 text-sm font-semibold text-white hover:bg-brand-600" onClick={() => setShowGenerate(true)} type="button">Generar recomendacion</button>
        </div>
      )}

      <section className="grid gap-4 rounded-lg border border-gray-200 bg-white p-4 shadow-theme-xs sm:grid-cols-2 xl:grid-cols-4">
        {!selectedCourseId && <div><label className="mb-2 block text-sm font-semibold text-gray-700">Curso</label><select className={inputClass} onChange={(event) => changeCourse(event.target.value)} value={courseId}><option value="">Todos los cursos</option>{courses.map((course) => <option key={course.id} value={course.id}>{course.curso_nombre} / {course.grado_nombre} {course.seccion_nombre}</option>)}</select></div>}
        <div><label className="mb-2 block text-sm font-semibold text-gray-700">Estudiante</label><select className={inputClass} disabled={!courseId} onChange={(event) => setStudentId(event.target.value)} value={studentId}><option value="">Todos los estudiantes</option>{students.map((student) => <option key={student.id} value={student.id}>{student.codigo_estudiante} - {student.estudiante_nombre}</option>)}</select></div>
        <div><label className="mb-2 block text-sm font-semibold text-gray-700">Periodo</label><select className={inputClass} disabled={!courseId} onChange={(event) => setPeriodId(event.target.value)} value={periodId}><option value="">Todos los periodos</option>{periods.map((period) => <option key={period.id} value={period.id}>{period.nombre}</option>)}</select></div>
        <div><label className="mb-2 block text-sm font-semibold text-gray-700">Estado</label><select className={inputClass} onChange={(event) => setStatus(event.target.value as RecommendationReviewStatus | "")} value={status}>{STATUS_OPTIONS.map((option) => <option key={option.value || "all"} value={option.value}>{option.label}</option>)}</select></div>
      </section>

      {error && <section className="rounded-lg border border-red-100 bg-red-50 px-5 py-4 text-sm font-medium text-red-700">{error}</section>}
      {publicationResult && <section className="rounded-lg border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-medium text-emerald-800">{publicationResult}</section>}
      {(isLoading || isLoadingDetail) && <section className="rounded-lg border border-gray-200 bg-white px-6 py-10 text-center text-sm text-gray-500">Cargando recomendaciones...</section>}

      {!isLoading && recommendations.length === 0 && !error && <section className="rounded-lg border border-dashed border-gray-200 bg-white px-6 py-10 text-center text-sm text-gray-500">No hay recomendaciones para los filtros seleccionados.</section>}

      {!isLoading && recommendations.length > 0 && (
        <section className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-theme-xs">
          <div className="hidden overflow-x-auto md:block"><table className="min-w-full text-left text-sm"><thead className="bg-gray-50 text-xs uppercase text-gray-500"><tr><th className="px-5 py-4">Estudiante</th><th className="px-5 py-4">Curso</th><th className="px-5 py-4">Periodo</th><th className="px-5 py-4">Estado</th><th className="px-5 py-4">Generacion</th><th className="px-5 py-4 text-right">Accion</th></tr></thead><tbody className="divide-y divide-gray-100">{pagination.pageItems.map((item) => <tr key={item.id}><td className="px-5 py-4"><p className="font-semibold text-gray-900">{item.estudiante_label}</p><p className="mt-1 text-xs text-gray-500">{item.estudiante_codigo}</p></td><td className="px-5 py-4 text-gray-700">{item.curso_nombre || item.asignacion_curso_label}</td><td className="px-5 py-4 text-gray-600">{item.periodo_academico_label || "-"}</td><td className="px-5 py-4"><StatusBadge recommendation={item} /></td><td className="px-5 py-4 text-gray-600">{formatDate(item.fecha_generacion)}</td><td className="px-5 py-4 text-right"><button className="rounded-lg border border-brand-200 px-3 py-2 text-xs font-semibold text-brand-700 hover:bg-brand-50" onClick={() => openDetail(item.id)} type="button">Ver detalle</button></td></tr>)}</tbody></table></div>
          <div className="divide-y divide-gray-100 md:hidden">{pagination.pageItems.map((item) => <article className="p-5" key={item.id}><div className="flex items-start justify-between gap-3"><div><h3 className="font-bold text-gray-900">{item.estudiante_label}</h3><p className="mt-1 text-xs text-gray-500">{item.estudiante_codigo}</p></div><StatusBadge recommendation={item} /></div><p className="mt-4 text-sm font-semibold text-gray-800">{item.curso_nombre || item.asignacion_curso_label}</p><p className="mt-1 text-xs text-gray-500">{item.periodo_academico_label || "Sin periodo"} / {formatDate(item.fecha_generacion)}</p><button className="mt-4 w-full rounded-lg border border-brand-200 px-3 py-2 text-sm font-semibold text-brand-700" onClick={() => openDetail(item.id)} type="button">Ver detalle</button></article>)}</div>
          <PaginationControls currentPage={pagination.currentPage} isLoading={isLoading} itemLabel="recomendaciones" onPageChange={pagination.setCurrentPage} pageSize={pagination.pageSize} totalItems={pagination.totalItems} totalPages={pagination.totalPages} />
        </section>
      )}

      {showGenerate && <TeacherRecordModal courseAssignmentId={selectedCourseId} module="recommendations" onClose={() => setShowGenerate(false)} onSaved={generationSaved} />}
      {selected && <RecommendationDetailModal isSaving={isSaving} key={`${selected.id}-${selected.estado_revision}`} onClose={() => setSelected(null)} onCommunicate={() => setCommunicationRecommendation(selected)} onPublish={() => setPublishingRecommendation(selected)} onReview={review} recommendation={selected} requestError={error} />}
      {publishingRecommendation && <PublishRecommendationModal isSaving={isSaving} onClose={() => setPublishingRecommendation(null)} onPublished={publish} recommendation={publishingRecommendation} />}
      {communicationRecommendation && communicationRecommendation.asignacion_curso && <TeacherCommunicationModal contextLabel={`la recomendacion de ${communicationRecommendation.estudiante_label}`} onClose={() => setCommunicationRecommendation(null)} onSent={() => setPublicationResult("Comunicacion enviada correctamente.")} payload={{ asignacion_curso_id: communicationRecommendation.asignacion_curso, matricula_id: communicationRecommendation.matricula, periodo_academico_id: communicationRecommendation.periodo_academico, recomendacion_id: communicationRecommendation.id, tipo: "RECOMENDACION" }} />}
    </div>
  );
}
