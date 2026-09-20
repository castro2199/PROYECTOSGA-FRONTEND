import { useEffect, useMemo, useState } from "react";
import { PaginationControls } from "../../../shared/components/PaginationControls";
import { FollowUpPage } from "../../followup/pages/FollowUpPage";
import { JustifyAttendanceModal } from "../components/JustifyAttendanceModal";
import { useClientPagination } from "../../../shared/hooks/useClientPagination";
import {
  extractGuardianItems,
  extractGuardianStudents,
  getGuardianModuleData,
  markGuardianNotificationRead,
} from "../services/guardianService";
import type {
  GuardianAttendance,
  GuardianGrade,
  GuardianModuleKey,
  GuardianNotification,
  GuardianStudent,
} from "../services/guardianService";

type Props = {
  embedded?: boolean;
  module: GuardianModuleKey;
  onOpenStudent?: (studentId: number, module?: GuardianModuleKey) => void;
  selectedCourseId?: number;
  selectedCourseName?: string;
  selectedStudentId?: number;
};

const CONFIG: Record<GuardianModuleKey, { title: string; description: string }> = {
  attendance: { title: "Asistencia", description: "Consulta semanal de asistencias y faltas de tus estudiantes." },
  grades: { title: "Calificaciones", description: "Resultados por curso, periodo y criterio de evaluacion." },
  notifications: { title: "Notificaciones", description: "Avisos academicos y comunicaciones sobre tus estudiantes." },
  students: { title: "Mis estudiantes", description: "Estudiantes vinculados a tu cuenta de apoderado." },
  tracking: { title: "Seguimiento", description: "Informacion academica y de acompanamiento estudiantil." },
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function mondayOf(date: Date) {
  const result = new Date(date);
  const day = result.getDay();
  result.setDate(result.getDate() - (day === 0 ? 6 : day - 1));
  result.setHours(0, 0, 0, 0);
  return result;
}

function moveDays(date: Date, days: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function formatLabel(value: string) {
  return value.replace(/__/g, " ").replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatValue(value: unknown) {
  if (value === null || value === undefined || value === "") return "-";
  if (typeof value === "boolean") return value ? "Si" : "No";
  if (/^\d{4}-\d{2}-\d{2}/.test(String(value))) {
    const date = new Date(String(value));
    if (!Number.isNaN(date.getTime())) return date.toLocaleDateString("es-PE");
  }
  return String(value);
}

function EmptyState({ children }: { children: string }) {
  return <section className="rounded-lg border border-dashed border-gray-200 bg-white px-6 py-10 text-center text-sm text-gray-500">{children}</section>;
}

function Metric({ label, value }: { label: string; value: number | string }) {
  return <article className="rounded-lg border border-gray-200 bg-white p-4 shadow-theme-xs"><p className="text-xs font-semibold uppercase text-gray-500">{label}</p><strong className="mt-2 block text-2xl text-gray-900">{value}</strong></article>;
}

function StudentsView({ students, onOpenStudent }: { students: GuardianStudent[]; onOpenStudent?: Props["onOpenStudent"] }) {
  if (students.length === 0) return <EmptyState>No tienes estudiantes vinculados actualmente.</EmptyState>;
  return <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{students.map((student) => <article className="rounded-lg border border-gray-200 bg-white p-5 shadow-theme-xs" key={student.id}><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase text-brand-600">{student.codigo_estudiante}</p><h3 className="mt-2 text-lg font-bold text-gray-900">{student.estudiante_nombre}</h3></div>{student.es_principal && <span className="rounded-lg bg-green-50 px-2 py-1 text-xs font-semibold text-green-700">Principal</span>}</div><dl className="mt-5 grid grid-cols-2 gap-3 border-t border-gray-100 pt-4 text-sm"><div><dt className="text-gray-500">Parentesco</dt><dd className="mt-1 font-semibold text-gray-900">{student.parentesco_label}</dd></div><div><dt className="text-gray-500">Matriculas activas</dt><dd className="mt-1 font-semibold text-gray-900">{student.matriculas_activas || "-"}</dd></div></dl>{onOpenStudent && <div className="mt-5 border-t border-gray-100 pt-4"><button className="w-full rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600" onClick={() => onOpenStudent(student.estudiante_id)} type="button">Ver estudiante</button></div>}</article>)}</section>;
}

const ATTENDANCE_STYLES: Record<string, string> = {
  FALTA: "bg-red-50 text-red-700",
  JUSTIFICADA: "bg-amber-50 text-amber-700",
  PRESENTE: "bg-green-50 text-green-700",
  TARDE: "bg-yellow-50 text-yellow-700",
};

function JustificationStatus({ record }: { record: GuardianAttendance }) {
  if (!record.justificacion_activa) return null;
  return (
    <p className="mt-2 rounded-md bg-amber-50 px-2 py-1 text-[11px] font-semibold text-amber-800">
      {record.justificacion_activa.estado_label}
    </p>
  );
}

function AttendanceView({
  records,
  selectedCourseId,
  selectedStudentId,
  onRefresh,
}: {
  records: GuardianAttendance[];
  selectedCourseId?: number;
  selectedStudentId?: number;
  onRefresh: () => void;
}) {
  const [studentId, setStudentId] = useState(selectedStudentId ? String(selectedStudentId) : "");
  const [weekStart, setWeekStart] = useState(() => mondayOf(new Date()));
  const [attendanceToJustify, setAttendanceToJustify] = useState<GuardianAttendance | null>(null);
  const students = [...new Map(records.map((record) => [record.estudiante_id, record.estudiante_nombre])).entries()];
  const studentRecords = studentId ? records.filter((record) => String(record.estudiante_id) === studentId) : records;
  const filtered = selectedCourseId
    ? studentRecords.filter((record) => Number(record.asignacion_curso_id) === selectedCourseId)
    : studentRecords;
  const courses = [...new Map(filtered.map((record) => [record.asignacion_curso_id, record.curso_nombre])).entries()];
  const weekDays = useMemo(() => Array.from({ length: 5 }, (_, index) => moveDays(weekStart, index)), [weekStart]);
  const weekRecords = filtered.filter((record) => weekDays.some((day) => dateKey(day) === record.fecha));
  const count = (status: GuardianAttendance["estado"]) => filtered.filter((record) => record.estado === status).length;

  return (
    <div className="space-y-4">
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Presentes" value={count("PRESENTE")} />
        <Metric label="Tardanzas" value={count("TARDE")} />
        <Metric label="Faltas" value={count("FALTA")} />
        <Metric label="Justificadas" value={count("JUSTIFICADA")} />
      </section>
      <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-theme-xs">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          {!selectedStudentId && <div className="w-full max-w-sm"><label className="mb-2 block text-sm font-semibold text-gray-700">Estudiante</label><select className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm" onChange={(event) => setStudentId(event.target.value)} value={studentId}><option value="">Todos los estudiantes</option>{students.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select></div>}
          <div className="flex gap-2"><button aria-label="Semana anterior" className="h-10 w-10 rounded-lg border border-gray-200" onClick={() => setWeekStart((current) => moveDays(current, -7))} type="button">&lt;</button><button className="h-10 rounded-lg border border-gray-200 px-3 text-sm font-semibold" onClick={() => setWeekStart(mondayOf(new Date()))} type="button">Semana actual</button><button aria-label="Semana siguiente" className="h-10 w-10 rounded-lg border border-gray-200" onClick={() => setWeekStart((current) => moveDays(current, 7))} type="button">&gt;</button></div>
        </div>
      </section>
      {filtered.length === 0 ? <EmptyState>No hay asistencias registradas para este estudiante.</EmptyState> : <section className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-theme-xs"><div className="overflow-x-auto"><table className="min-w-[850px] table-fixed text-sm"><thead className="bg-gray-50"><tr><th className="w-56 px-4 py-4 text-left">Curso</th>{weekDays.map((day) => <th className="px-3 py-3 text-center" key={dateKey(day)}><span className="block text-xs uppercase text-gray-500">{day.toLocaleDateString("es-PE", { weekday: "short" })}</span><span className="mt-1 block">{day.toLocaleDateString("es-PE", { day: "2-digit", month: "2-digit" })}</span></th>)}</tr></thead><tbody className="divide-y divide-gray-100">{courses.map(([id, name]) => <tr key={id}><td className="px-4 py-5 font-semibold text-gray-900">{name}</td>{weekDays.map((day) => { const item = weekRecords.find((record) => record.asignacion_curso_id === id && record.fecha === dateKey(day)); const canJustify = Boolean(item?.puede_justificar) && (item?.estado === "FALTA" || item?.estado === "TARDE"); return <td className="px-2 py-4 text-center align-top" key={dateKey(day)}>{item ? <><span className={`inline-flex min-h-9 min-w-24 items-center justify-center rounded-lg px-2 text-xs font-semibold ${ATTENDANCE_STYLES[item.estado]}`}>{item.estado_label}</span><JustificationStatus record={item} />{canJustify && <button className="mt-2 h-8 rounded-lg border border-brand-200 px-2 text-xs font-semibold text-brand-700 hover:bg-brand-50" onClick={() => setAttendanceToJustify(item)} type="button">Justificar falta</button>}{item.justificacion && <p className="mt-2 text-xs text-gray-500">{item.justificacion}</p>}</> : <span className="text-gray-300">-</span>}</td>; })}</tr>)}</tbody></table></div></section>}
      {attendanceToJustify && <JustifyAttendanceModal attendance={{ id: attendanceToJustify.id, cursoNombre: attendanceToJustify.curso_nombre, estadoLabel: attendanceToJustify.estado_label, estudianteNombre: attendanceToJustify.estudiante_nombre, fecha: attendanceToJustify.fecha }} onClose={() => setAttendanceToJustify(null)} onSaved={() => onRefresh()} />}
    </div>
  );
}


const GRADE_STYLES: Record<string, string> = { AD: "bg-green-100 text-green-800", A: "bg-blue-100 text-blue-800", B: "bg-amber-100 text-amber-800", C: "bg-red-100 text-red-800" };

function GradesView({ records, selectedCourseId, selectedStudentId }: { records: GuardianGrade[]; selectedCourseId?: number; selectedStudentId?: number }) {
  const [studentId, setStudentId] = useState(selectedStudentId ? String(selectedStudentId) : "");
  const [courseId, setCourseId] = useState("");
  const [periodId, setPeriodId] = useState("");
  const students = [...new Map(records.map((record) => [record.estudiante_id, record.estudiante_nombre])).entries()];
  const studentRecords = studentId ? records.filter((record) => String(record.estudiante_id) === studentId) : records;
  const courses = [...new Map(studentRecords.map((record) => [record.asignacion_curso_id, record.curso_nombre])).entries()];
  const periods = [...new Map(studentRecords.map((record) => [record.periodo_academico_id, record.periodo_nombre])).entries()];
  const filtered = studentRecords.filter((record) =>
    (!selectedCourseId || Number(record.asignacion_curso_id) === selectedCourseId) &&
    (!courseId || String(record.asignacion_curso_id) === courseId) &&
    (!periodId || String(record.periodo_academico_id) === periodId),
  );
  return <div className="space-y-4"><section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{(["AD", "A", "B", "C"] as const).map((grade) => <Metric key={grade} label={grade} value={filtered.filter((record) => record.valor === grade).length} />)}</section><section className="grid gap-4 rounded-lg border border-gray-200 bg-white p-4 shadow-theme-xs md:grid-cols-3">{!selectedStudentId && <div><label className="mb-2 block text-sm font-semibold text-gray-700">Estudiante</label><select className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm" onChange={(event) => { setStudentId(event.target.value); setCourseId(""); setPeriodId(""); }} value={studentId}><option value="">Todos</option>{students.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select></div>}{!selectedCourseId && <div><label className="mb-2 block text-sm font-semibold text-gray-700">Curso</label><select className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm" onChange={(event) => setCourseId(event.target.value)} value={courseId}><option value="">Todos</option>{courses.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select></div>}<div><label className="mb-2 block text-sm font-semibold text-gray-700">Periodo</label><select className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm" onChange={(event) => setPeriodId(event.target.value)} value={periodId}><option value="">Todos</option>{periods.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select></div></section>{filtered.length === 0 ? <EmptyState>No hay calificaciones para los filtros seleccionados.</EmptyState> : <section className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-theme-xs"><div className="overflow-x-auto"><table className="min-w-[850px] text-left text-sm"><thead className="bg-gray-50"><tr><th className="px-5 py-4">Curso</th><th className="px-5 py-4">Periodo</th><th className="px-5 py-4">Criterio</th><th className="px-5 py-4">Calificacion</th><th className="px-5 py-4">Observacion</th></tr></thead><tbody className="divide-y divide-gray-100">{filtered.map((record) => <tr key={record.id}><td className="px-5 py-4 font-semibold text-gray-900">{record.curso_nombre}</td><td className="px-5 py-4 text-gray-600">{record.periodo_nombre}</td><td className="px-5 py-4"><p className="font-medium text-gray-800">{record.criterio_nombre}</p><p className="mt-1 text-xs text-gray-500">{record.competencia_nombre}</p></td><td className="px-5 py-4"><span className={`inline-flex h-9 min-w-12 items-center justify-center rounded-lg px-3 font-bold ${GRADE_STYLES[record.valor]}`}>{record.valor}</span><p className="mt-1 text-xs text-gray-500">{record.valor_label}</p></td><td className="max-w-xs px-5 py-4 text-gray-600">{record.observacion || "-"}</td></tr>)}</tbody></table></div></section>}</div>;
}

function recordBelongsToStudent(record: Record<string, unknown>, studentId: number) {
  const id = Number(record.estudiante_id ?? record.estudiante ?? record.alumno_id);
  return !id || id === studentId;
}

function recordBelongsToCourse(record: Record<string, unknown>, courseId: number) {
  const id = Number(
    record.asignacion_curso_id ?? record.asignacion_curso ?? record.curso_id,
  );
  return id === courseId;
}

type GuardianPublishedRecommendation = {
  id: number;
  asignacion_curso?: number;
  curso_nombre?: string;
  periodo_nombre?: string;
  texto?: string;
  texto_final?: string;
  estado_revision?: string;
  fecha_revision?: string | null;
  contextStudentId?: number;
};

function collectGuardianRecommendations(
  value: unknown,
  contextStudentId?: number,
): GuardianPublishedRecommendation[] {
  if (Array.isArray(value)) {
    return value.flatMap((item) =>
      collectGuardianRecommendations(item, contextStudentId),
    );
  }
  if (!isRecord(value)) return [];

  const nextStudentId = Number(
    value.estudiante_id ?? value.estudiante ?? value.alumno_id ?? contextStudentId,
  );
  const own = Array.isArray(value.recomendaciones)
    ? value.recomendaciones.filter(isRecord).map((item) => ({
        ...(item as GuardianPublishedRecommendation),
        contextStudentId: Number.isFinite(nextStudentId)
          ? nextStudentId
          : contextStudentId,
      }))
    : [];
  const nested = Object.entries(value)
    .filter(([key]) => key !== "recomendaciones")
    .flatMap(([, item]) =>
      collectGuardianRecommendations(
        item,
        Number.isFinite(nextStudentId) ? nextStudentId : contextStudentId,
      ),
    );
  return [...own, ...nested];
}

function GuardianRecommendationsView({ recommendations }: { recommendations: GuardianPublishedRecommendation[] }) {
  return <section className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-theme-xs"><div className="border-b border-gray-100 px-5 py-4"><h3 className="font-bold text-gray-900">Recomendaciones</h3></div><div className="divide-y divide-gray-100">{recommendations.map((item) => <article className="p-5" key={item.id}><div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between"><div><h4 className="font-semibold text-gray-900">{item.curso_nombre || "Recomendacion pedagogica"}</h4><p className="mt-1 text-xs text-gray-500">{item.periodo_nombre || "Sin periodo"}</p></div>{item.fecha_revision && <span className="text-xs text-gray-500">{formatValue(item.fecha_revision)}</span>}</div><p className="mt-3 text-sm leading-6 text-gray-700">{item.texto || item.texto_final || "Sin contenido."}</p></article>)}</div></section>;
}

function TrackingView({ data, selectedCourseId, selectedCourseName, selectedStudentId }: { data: unknown; selectedCourseId?: number; selectedCourseName?: string; selectedStudentId?: number }) {
  void data;
  void selectedCourseName;
  return <FollowUpPage courseId={selectedCourseId} embedded guardianStudentId={selectedStudentId} role="guardian" />;
  const source: Record<string, unknown> = isRecord(data) ? (data as Record<string, unknown>) : {};
  const recommendations = collectGuardianRecommendations(data).filter((item) => {
    if (!item.estado_revision || !["APROBADA", "EDITADA"].includes(item.estado_revision)) return false;
    if (selectedStudentId && item.contextStudentId && item.contextStudentId !== selectedStudentId) return false;
    if (!selectedCourseId) return true;
    if (item.asignacion_curso) return Number(item.asignacion_curso) === selectedCourseId;
    return !selectedCourseName || !item.curso_nombre || item.curso_nombre === selectedCourseName;
  });
  if (Object.keys(source).length === 0 && recommendations.length === 0) return <EmptyState>No hay informacion de seguimiento disponible.</EmptyState>;
  const metrics = selectedCourseId ? [] : Object.entries(source).flatMap(([key, value]) => typeof value === "string" || typeof value === "number" || typeof value === "boolean" ? [{ label: formatLabel(key), value: formatValue(value) }] : []).slice(0, 8);
  const lists = Object.entries(source).filter(([key, value]) => key !== "recomendaciones" && Array.isArray(value)).map(([key, value]) => [key, (value as unknown[]).filter((item) =>
    (!selectedStudentId || !isRecord(item) || recordBelongsToStudent(item, selectedStudentId)) &&
    (!selectedCourseId || !isRecord(item) || recordBelongsToCourse(item, selectedCourseId)),
  )] as const);
  const visibleLists = selectedCourseId
    ? lists.filter(([, values]) => values.length > 0)
    : lists;
  if (metrics.length === 0 && visibleLists.length === 0 && recommendations.length === 0) return <EmptyState>No hay seguimiento registrado para este curso.</EmptyState>;
  return <div className="space-y-4">{metrics.length > 0 && <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{metrics.map((metric) => <Metric key={metric.label} label={metric.label} value={metric.value} />)}</section>}{recommendations.length > 0 && <GuardianRecommendationsView recommendations={recommendations} />}{visibleLists.map(([key, values]) => <section className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-theme-xs" key={key}><div className="border-b border-gray-100 px-5 py-4"><h3 className="font-bold text-gray-900">{formatLabel(key)}</h3></div>{values.length === 0 ? <p className="px-5 py-8 text-center text-sm text-gray-500">Sin registros.</p> : <div className="divide-y divide-gray-100">{values.map((value, index) => <article className="grid gap-2 px-5 py-4 sm:grid-cols-2" key={index}>{isRecord(value) ? Object.entries(value).filter(([field]) => field !== "recomendaciones").slice(0, 8).map(([field, fieldValue]) => <div className="text-sm" key={field}><span className="font-medium text-gray-500">{formatLabel(field)}: </span><span className="text-gray-800">{formatValue(fieldValue)}</span></div>) : <p className="text-sm">{formatValue(value)}</p>}</article>)}</div>}</section>)}</div>;
}

function NotificationsView({ notifications, onRead }: { notifications: GuardianNotification[]; onRead: (id: number) => Promise<void> }) {
  const [pendingId, setPendingId] = useState<number | null>(null);
  const unread = notifications.filter((item) => !item.fecha_lectura).length;
  if (notifications.length === 0) return <EmptyState>No tienes notificaciones.</EmptyState>;
  return <div className="space-y-4"><section className="grid gap-3 sm:grid-cols-2"><Metric label="Pendientes" value={unread} /><Metric label="Leidas" value={notifications.length - unread} /></section><section className="divide-y divide-gray-100 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-theme-xs">{[...notifications].sort((a, b) => new Date(b.fecha_envio ?? 0).getTime() - new Date(a.fecha_envio ?? 0).getTime()).map((notification) => <article className={`p-5 ${notification.fecha_lectura ? "bg-white" : "bg-brand-50/40"}`} key={notification.id}><div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><div className="flex flex-wrap items-center gap-2"><h3 className="font-bold text-gray-900">{notification.titulo}</h3>{!notification.fecha_lectura && <span className="rounded-lg bg-brand-100 px-2 py-1 text-xs font-semibold text-brand-700">Nueva</span>}</div><p className="mt-2 text-sm leading-6 text-gray-600">{notification.mensaje}</p><p className="mt-3 text-xs text-gray-500">{notification.estudiante_label} / {notification.incidencia_label} / {formatValue(notification.fecha_envio)}</p></div>{!notification.fecha_lectura && <button className="shrink-0 rounded-lg border border-brand-200 bg-white px-3 py-2 text-xs font-semibold text-brand-700 disabled:opacity-50" disabled={pendingId === notification.id} onClick={async () => { setPendingId(notification.id); try { await onRead(notification.id); } finally { setPendingId(null); } }} type="button">{pendingId === notification.id ? "Actualizando..." : "Marcar como leida"}</button>}</div></article>)}</section></div>;
}

export function GuardianModulePage({ embedded = false, module, onOpenStudent, selectedCourseId, selectedCourseName, selectedStudentId }: Props) {
  const [data, setData] = useState<unknown>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const config = CONFIG[module];

  useEffect(() => {
    let ignore = false;
    setIsLoading(true);
    setError(null);
    getGuardianModuleData<unknown>(module, selectedStudentId).then((response) => { if (!ignore) setData(response); }).catch((requestError: unknown) => { if (!ignore) setError(requestError instanceof Error ? requestError.message : "No se pudo cargar la informacion."); }).finally(() => { if (!ignore) setIsLoading(false); });
    return () => { ignore = true; };
  }, [module, refreshKey, selectedStudentId]);

  const items = extractGuardianItems(data);
  const students = extractGuardianStudents(data);
  const studentsPagination = useClientPagination(students, 6);
  const notificationsPagination = useClientPagination(items, 10);
  const markRead = async (id: number) => {
    try {
      await markGuardianNotificationRead(id);
      setRefreshKey((value) => value + 1);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "No se pudo actualizar la notificacion.");
    }
  };

  return <div className="space-y-5">{!embedded && <section className="flex flex-col gap-4 rounded-lg border border-gray-200 bg-white p-5 shadow-theme-xs sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-semibold text-brand-600">Portal del apoderado</p><h2 className="mt-2 text-2xl font-bold text-gray-900">{config.title}</h2><p className="mt-2 text-sm leading-6 text-gray-600">{config.description}</p></div><button className="h-10 rounded-lg border border-gray-200 px-4 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50" disabled={isLoading} onClick={() => setRefreshKey((value) => value + 1)} type="button">Actualizar</button></section>}{isLoading && <section className="rounded-lg border border-gray-200 bg-white px-6 py-10 text-center text-sm text-gray-500">Cargando informacion...</section>}{!isLoading && error && <section className="rounded-lg border border-red-100 bg-red-50 px-6 py-8 text-sm font-medium text-red-700">{error}</section>}{!isLoading && !error && module === "students" && <><StudentsView onOpenStudent={onOpenStudent} students={studentsPagination.pageItems} /><section className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-theme-xs"><PaginationControls currentPage={studentsPagination.currentPage} itemLabel="estudiantes" onPageChange={studentsPagination.setCurrentPage} pageSize={studentsPagination.pageSize} totalItems={studentsPagination.totalItems} totalPages={studentsPagination.totalPages} /></section></>}{!isLoading && !error && module === "attendance" && <AttendanceView onRefresh={() => setRefreshKey((value) => value + 1)} records={items as GuardianAttendance[]} selectedCourseId={selectedCourseId} selectedStudentId={selectedStudentId} />}{!isLoading && !error && module === "grades" && <GradesView records={items as GuardianGrade[]} selectedCourseId={selectedCourseId} selectedStudentId={selectedStudentId} />}{!isLoading && !error && module === "tracking" && <TrackingView data={data} selectedCourseId={selectedCourseId} selectedCourseName={selectedCourseName} selectedStudentId={selectedStudentId} />}{!isLoading && !error && module === "notifications" && <><NotificationsView notifications={notificationsPagination.pageItems as GuardianNotification[]} onRead={markRead} /><section className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-theme-xs"><PaginationControls currentPage={notificationsPagination.currentPage} itemLabel="notificaciones" onPageChange={notificationsPagination.setCurrentPage} pageSize={notificationsPagination.pageSize} totalItems={notificationsPagination.totalItems} totalPages={notificationsPagination.totalPages} /></section></>}</div>;
}
