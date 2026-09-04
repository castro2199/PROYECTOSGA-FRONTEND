import { useEffect, useMemo, useState } from "react";
import { PaginationControls } from "../../../shared/components/PaginationControls";
import { useClientPagination } from "../../../shared/hooks/useClientPagination";
import { getStudentModuleData } from "../services/studentService";
import type {
  StudentAttendance,
  StudentCourse,
  StudentGrade,
  StudentModuleKey,
  StudentParticipation,
} from "../services/studentService";

type Props = {
  embedded?: boolean;
  module: StudentModuleKey;
  onOpenCourse?: (courseId: number, module?: StudentModuleKey) => void;
  selectedCourseId?: number;
  selectedCourseName?: string;
};

const CONFIG: Record<StudentModuleKey, { title: string; description: string }> = {
  attendance: { title: "Mi asistencia", description: "Consulta semanal de asistencias, tardanzas y faltas por curso." },
  courses: { title: "Mis cursos", description: "Cursos, docentes y secciones correspondientes al anio academico." },
  grades: { title: "Mis calificaciones", description: "Resultados por periodo, competencia y criterio de evaluacion." },
  participation: { title: "Mi participacion", description: "Participaciones registradas por tus docentes en cada curso." },
  tracking: { title: "Mi seguimiento", description: "Resumen de avance academico y acompanamiento estudiantil." },
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function itemsFrom(data: unknown) {
  if (Array.isArray(data)) return data.filter(isRecord);
  if (!isRecord(data)) return [];
  const items = data.results ?? data.items ?? data.data ?? data.registros ?? data.detalle;
  return Array.isArray(items) ? items.filter(isRecord) : [];
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

function dateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
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

function EmptyState({ children }: { children: string }) {
  return <section className="rounded-lg border border-dashed border-gray-200 bg-white px-6 py-10 text-center text-sm text-gray-500">{children}</section>;
}

function Metric({ label, value }: { label: string; value: number | string }) {
  return <article className="rounded-lg border border-gray-200 bg-white p-4 shadow-theme-xs"><p className="text-xs font-semibold uppercase text-gray-500">{label}</p><strong className="mt-2 block text-2xl text-gray-900">{value}</strong></article>;
}

const COURSE_ACTIONS: Array<{ label: string; module: StudentModuleKey }> = [
  { label: "Mi asistencia", module: "attendance" },
  { label: "Mis calificaciones", module: "grades" },
  { label: "Mi participacion", module: "participation" },
  { label: "Mi seguimiento", module: "tracking" },
];

function CoursesView({
  courses,
  onOpenCourse,
}: {
  courses: StudentCourse[];
  onOpenCourse?: (courseId: number, module?: StudentModuleKey) => void;
}) {
  if (courses.length === 0) return <EmptyState>No tienes cursos asignados actualmente.</EmptyState>;
  return <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{courses.map((course) => <article className="rounded-lg border border-gray-200 bg-white p-5 shadow-theme-xs" key={course.id}><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase text-brand-600">{course.grado_nombre} - Seccion {course.seccion_nombre}</p><h3 className="mt-2 text-lg font-bold text-gray-900">{course.curso_nombre}</h3></div><span className="rounded-lg bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700">{course.anio_academico}</span></div><div className="mt-5 border-t border-gray-100 pt-4"><p className="text-xs font-medium text-gray-500">Docente</p><p className="mt-1 text-sm font-semibold text-gray-800">{course.docente_nombre}</p></div>{onOpenCourse && <div className="mt-5 border-t border-gray-100 pt-4"><button className="w-full rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600" onClick={() => onOpenCourse(course.id)} type="button">Abrir curso</button><div className="mt-3 grid grid-cols-2 gap-2">{COURSE_ACTIONS.map((action) => <button className="min-h-10 rounded-lg border border-gray-200 px-2 py-2 text-xs font-semibold text-gray-700 hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700" key={action.module} onClick={() => onOpenCourse(course.id, action.module)} type="button">{action.label}</button>)}</div></div>}</article>)}</section>;
}

const ATTENDANCE_STYLES: Record<string, string> = {
  FALTA: "bg-red-50 text-red-700",
  JUSTIFICADA: "bg-amber-50 text-amber-700",
  PRESENTE: "bg-green-50 text-green-700",
  TARDE: "bg-yellow-50 text-yellow-700",
};

function AttendanceView({ records, selectedCourseId }: { records: StudentAttendance[]; selectedCourseId?: number }) {
  const [weekStart, setWeekStart] = useState(() => mondayOf(new Date()));
  const [courseId, setCourseId] = useState(selectedCourseId ? String(selectedCourseId) : "");
  const weekDays = useMemo(() => Array.from({ length: 5 }, (_, index) => moveDays(weekStart, index)), [weekStart]);
  const courses = useMemo(() => [...new Map(records.map((record) => [record.asignacion_curso_id, record.curso_nombre])).entries()], [records]);
  const filtered = courseId ? records.filter((record) => String(record.asignacion_curso_id) === courseId) : records;
  const weekRecords = filtered.filter((record) => weekDays.some((day) => dateKey(day) === record.fecha));
  const rows = courseId ? courses.filter(([id]) => String(id) === courseId) : courses;
  const count = (status: StudentAttendance["estado"]) => filtered.filter((item) => item.estado === status).length;

  return <div className="space-y-4"><section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><Metric label="Presentes" value={count("PRESENTE")} /><Metric label="Tardanzas" value={count("TARDE")} /><Metric label="Faltas" value={count("FALTA")} /><Metric label="Justificadas" value={count("JUSTIFICADA")} /></section><section className="rounded-lg border border-gray-200 bg-white p-4 shadow-theme-xs"><div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">{!selectedCourseId && <div className="w-full max-w-sm"><label className="mb-2 block text-sm font-semibold text-gray-700">Curso</label><select className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm" onChange={(event) => setCourseId(event.target.value)} value={courseId}><option value="">Todos los cursos</option>{courses.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select></div>}<div className="flex gap-2"><button aria-label="Semana anterior" className="h-10 w-10 rounded-lg border border-gray-200" onClick={() => setWeekStart((current) => moveDays(current, -7))} type="button">&lt;</button><button className="h-10 rounded-lg border border-gray-200 px-3 text-sm font-semibold" onClick={() => setWeekStart(mondayOf(new Date()))} type="button">Semana actual</button><button aria-label="Semana siguiente" className="h-10 w-10 rounded-lg border border-gray-200" onClick={() => setWeekStart((current) => moveDays(current, 7))} type="button">&gt;</button></div></div></section>{filtered.length === 0 ? <EmptyState>Todavia no tienes registros de asistencia en este curso.</EmptyState> : <section className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-theme-xs"><div className="overflow-x-auto"><table className="min-w-[850px] table-fixed text-sm"><thead className="bg-gray-50"><tr><th className="w-56 px-4 py-4 text-left">Curso</th>{weekDays.map((day) => <th className="px-3 py-3 text-center" key={dateKey(day)}><span className="block text-xs uppercase text-gray-500">{day.toLocaleDateString("es-PE", { weekday: "short" })}</span><span className="mt-1 block text-gray-800">{day.toLocaleDateString("es-PE", { day: "2-digit", month: "2-digit" })}</span></th>)}</tr></thead><tbody className="divide-y divide-gray-100">{rows.map(([id, name]) => <tr key={id}><td className="px-4 py-5 font-semibold text-gray-900">{name}</td>{weekDays.map((day) => { const item = weekRecords.find((record) => record.asignacion_curso_id === id && record.fecha === dateKey(day)); return <td className="px-2 py-4 text-center" key={dateKey(day)}>{item ? <span className={`inline-flex min-h-9 min-w-24 items-center justify-center rounded-lg px-2 text-xs font-semibold ${ATTENDANCE_STYLES[item.estado]}`}>{item.estado_label}</span> : <span className="text-gray-300">-</span>}{item?.justificacion && <p className="mt-2 text-xs text-gray-500" title={item.justificacion}>{item.justificacion}</p>}</td>; })}</tr>)}</tbody></table></div></section>}</div>;
}

const GRADE_STYLES: Record<string, string> = { AD: "bg-green-100 text-green-800", A: "bg-blue-100 text-blue-800", B: "bg-amber-100 text-amber-800", C: "bg-red-100 text-red-800" };

function GradesView({ records, selectedCourseId }: { records: StudentGrade[]; selectedCourseId?: number }) {
  const [courseId, setCourseId] = useState(selectedCourseId ? String(selectedCourseId) : "");
  const [periodId, setPeriodId] = useState("");
  const courses = [...new Map(records.map((record) => [record.asignacion_curso_id, record.curso_nombre])).entries()];
  const periods = [...new Map(records.map((record) => [record.periodo_academico_id, record.periodo_nombre])).entries()];
  const filtered = records.filter((record) => (!courseId || String(record.asignacion_curso_id) === courseId) && (!periodId || String(record.periodo_academico_id) === periodId));
  return <div className="space-y-4"><section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{(["AD", "A", "B", "C"] as const).map((grade) => <Metric key={grade} label={grade} value={filtered.filter((record) => record.valor === grade).length} />)}</section><section className={`grid gap-4 rounded-lg border border-gray-200 bg-white p-4 shadow-theme-xs ${selectedCourseId ? "" : "sm:grid-cols-2"}`}>{!selectedCourseId && <div><label className="mb-2 block text-sm font-semibold text-gray-700">Curso</label><select className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm" onChange={(event) => setCourseId(event.target.value)} value={courseId}><option value="">Todos los cursos</option>{courses.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select></div>}<div><label className="mb-2 block text-sm font-semibold text-gray-700">Periodo</label><select className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm" onChange={(event) => setPeriodId(event.target.value)} value={periodId}><option value="">Todos los periodos</option>{periods.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select></div></section>{filtered.length === 0 ? <EmptyState>No hay calificaciones para los filtros seleccionados.</EmptyState> : <section className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-theme-xs"><div className="hidden overflow-x-auto md:block"><table className="min-w-full text-left text-sm"><thead className="bg-gray-50"><tr><th className="px-5 py-4">Curso</th><th className="px-5 py-4">Periodo</th><th className="px-5 py-4">Criterio</th><th className="px-5 py-4">Calificacion</th><th className="px-5 py-4">Observacion</th></tr></thead><tbody className="divide-y divide-gray-100">{filtered.map((record) => <tr key={record.id}><td className="px-5 py-4 font-semibold text-gray-900">{record.curso_nombre}</td><td className="px-5 py-4 text-gray-600">{record.periodo_nombre}</td><td className="px-5 py-4"><p className="font-medium text-gray-800">{record.criterio_nombre}</p><p className="mt-1 text-xs text-gray-500">{record.competencia_nombre}</p></td><td className="px-5 py-4"><span className={`inline-flex h-9 min-w-12 items-center justify-center rounded-lg px-3 font-bold ${GRADE_STYLES[record.valor]}`}>{record.valor}</span><p className="mt-1 text-xs text-gray-500">{record.valor_label}</p></td><td className="max-w-xs px-5 py-4 text-gray-600">{record.observacion || "-"}</td></tr>)}</tbody></table></div><div className="divide-y divide-gray-100 md:hidden">{filtered.map((record) => <article className="p-5" key={record.id}><div className="flex items-start justify-between gap-3"><div><h3 className="font-bold text-gray-900">{record.curso_nombre}</h3><p className="mt-1 text-xs text-gray-500">{record.periodo_nombre}</p></div><span className={`rounded-lg px-3 py-2 font-bold ${GRADE_STYLES[record.valor]}`}>{record.valor}</span></div><p className="mt-4 text-sm font-semibold text-gray-800">{record.criterio_nombre}</p><p className="mt-2 text-sm text-gray-600">{record.observacion || "Sin observacion."}</p></article>)}</div></section>}</div>;
}

function ParticipationView({ records, selectedCourseId }: { records: StudentParticipation[]; selectedCourseId?: number }) {
  const [courseId, setCourseId] = useState(selectedCourseId ? String(selectedCourseId) : "");
  const courses = [...new Map(records.map((record) => [record.asignacion_curso_id, record.curso_nombre])).entries()];
  const filtered = (courseId ? records.filter((record) => String(record.asignacion_curso_id) === courseId) : records).sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
  return <div className="space-y-4">{!selectedCourseId && <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-theme-xs"><label className="mb-2 block text-sm font-semibold text-gray-700">Curso</label><select className="h-10 w-full max-w-sm rounded-lg border border-gray-200 bg-white px-3 text-sm" onChange={(event) => setCourseId(event.target.value)} value={courseId}><option value="">Todos los cursos</option>{courses.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select></section>}{filtered.length === 0 ? <EmptyState>No hay participaciones registradas.</EmptyState> : <section className="divide-y divide-gray-100 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-theme-xs">{filtered.map((record) => <article className="grid gap-3 p-5 sm:grid-cols-[1fr_auto]" key={record.id}><div><div className="flex flex-wrap items-center gap-2"><h3 className="font-bold text-gray-900">{record.curso_nombre}</h3><span className="rounded-lg bg-brand-50 px-2 py-1 text-xs font-semibold text-brand-700">{record.tipo_label}</span></div><p className="mt-2 text-sm text-gray-600">{record.observacion || "Sin observacion."}</p><p className="mt-2 text-xs text-gray-500">{formatValue(record.fecha)}{record.periodo_nombre ? ` / ${record.periodo_nombre}` : ""}</p></div>{record.valor && <strong className="text-lg text-gray-900">{record.valor}</strong>}</article>)}</section>}</div>;
}

type PublishedRecommendation = {
  id: number;
  asignacion_curso?: number;
  curso_nombre?: string;
  periodo_nombre?: string;
  texto?: string;
  texto_final?: string;
  estado_revision?: string;
  fecha_revision?: string | null;
};

function collectRecommendations(value: unknown): PublishedRecommendation[] {
  if (Array.isArray(value)) return value.flatMap(collectRecommendations);
  if (!isRecord(value)) return [];

  const own = Array.isArray(value.recomendaciones)
    ? value.recomendaciones.filter(isRecord).map((item) => item as PublishedRecommendation)
    : [];
  const nested = Object.entries(value)
    .filter(([key]) => key !== "recomendaciones")
    .flatMap(([, item]) => collectRecommendations(item));

  return [...own, ...nested];
}

function RecommendationsView({ recommendations }: { recommendations: PublishedRecommendation[] }) {
  return <section className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-theme-xs"><div className="border-b border-gray-100 px-5 py-4"><h3 className="font-bold text-gray-900">Recomendaciones</h3></div><div className="divide-y divide-gray-100">{recommendations.map((item) => <article className="p-5" key={item.id}><div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between"><div><h4 className="font-semibold text-gray-900">{item.curso_nombre || "Recomendacion pedagogica"}</h4><p className="mt-1 text-xs text-gray-500">{item.periodo_nombre || "Sin periodo"}</p></div>{item.fecha_revision && <span className="text-xs text-gray-500">{formatValue(item.fecha_revision)}</span>}</div><p className="mt-3 text-sm leading-6 text-gray-700">{item.texto || item.texto_final || "Sin contenido."}</p></article>)}</div></section>;
}

function TrackingView({ data, selectedCourseId, selectedCourseName }: { data: unknown; selectedCourseId?: number; selectedCourseName?: string }) {
  const source = isRecord(data) ? data : {};
  const recommendations = collectRecommendations(data).filter((item) => {
    if (!item.estado_revision || !["APROBADA", "EDITADA"].includes(item.estado_revision)) return false;
    if (!selectedCourseId) return true;
    if (item.asignacion_curso) return Number(item.asignacion_curso) === selectedCourseId;
    return !selectedCourseName || !item.curso_nombre || item.curso_nombre === selectedCourseName;
  });
  if (Object.keys(source).length === 0 && recommendations.length === 0) return <EmptyState>No hay informacion de seguimiento disponible.</EmptyState>;
  const metrics = Object.entries(source).flatMap(([key, value]) => typeof value === "string" || typeof value === "number" || typeof value === "boolean" ? [{ label: formatLabel(key), value: formatValue(value) }] : []).slice(0, 8);
  const lists = Object.entries(source).filter(([key, value]) => key !== "recomendaciones" && Array.isArray(value)) as Array<[string, unknown[]]>;
  return <div className="space-y-4">{metrics.length > 0 && <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{metrics.map((metric) => <Metric key={metric.label} label={metric.label} value={metric.value} />)}</section>}{recommendations.length > 0 && <RecommendationsView recommendations={recommendations} />}{lists.map(([key, values]) => <section className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-theme-xs" key={key}><div className="border-b border-gray-100 px-5 py-4"><h3 className="font-bold text-gray-900">{formatLabel(key)}</h3></div>{values.length === 0 ? <p className="px-5 py-8 text-center text-sm text-gray-500">Sin registros.</p> : <div className="divide-y divide-gray-100">{values.map((value, index) => <article className="grid gap-2 px-5 py-4 sm:grid-cols-2" key={index}>{isRecord(value) ? Object.entries(value).filter(([field]) => field !== "recomendaciones").slice(0, 8).map(([field, fieldValue]) => <div className="text-sm" key={field}><span className="font-medium text-gray-500">{formatLabel(field)}: </span><span className="text-gray-800">{formatValue(fieldValue)}</span></div>) : <p className="text-sm text-gray-700">{formatValue(value)}</p>}</article>)}</div>}</section>)}</div>;
}

export function StudentModulePage({ embedded = false, module, onOpenCourse, selectedCourseId, selectedCourseName }: Props) {
  const [data, setData] = useState<unknown>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const config = CONFIG[module];

  useEffect(() => {
    let ignore = false;
    setIsLoading(true);
    setError(null);
    getStudentModuleData<unknown>(module).then((response) => { if (!ignore) setData(response); }).catch((requestError: unknown) => { if (!ignore) setError(requestError instanceof Error ? requestError.message : "No se pudo cargar la informacion."); }).finally(() => { if (!ignore) setIsLoading(false); });
    return () => { ignore = true; };
  }, [module, refreshKey]);

  const items = itemsFrom(data);
  const pagination = useClientPagination(items, 6);
  return <div className="space-y-5">{!embedded && <section className="flex flex-col gap-4 rounded-lg border border-gray-200 bg-white p-5 shadow-theme-xs sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-semibold text-brand-600">Portal del estudiante</p><h2 className="mt-2 text-2xl font-bold text-gray-900">{config.title}</h2><p className="mt-2 text-sm leading-6 text-gray-600">{config.description}</p></div><button className="h-10 rounded-lg border border-gray-200 px-4 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50" disabled={isLoading} onClick={() => setRefreshKey((value) => value + 1)} type="button">Actualizar</button></section>}{isLoading && <section className="rounded-lg border border-gray-200 bg-white px-6 py-10 text-center text-sm text-gray-500">Cargando informacion...</section>}{!isLoading && error && <section className="rounded-lg border border-red-100 bg-red-50 px-6 py-8 text-sm font-medium text-red-700">{error}</section>}{!isLoading && !error && module === "courses" && <><CoursesView courses={pagination.pageItems as StudentCourse[]} onOpenCourse={onOpenCourse} /><section className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-theme-xs"><PaginationControls currentPage={pagination.currentPage} itemLabel="cursos" onPageChange={pagination.setCurrentPage} pageSize={pagination.pageSize} totalItems={pagination.totalItems} totalPages={pagination.totalPages} /></section></>}{!isLoading && !error && module === "attendance" && <AttendanceView records={items as StudentAttendance[]} selectedCourseId={selectedCourseId} />}{!isLoading && !error && module === "grades" && <GradesView records={items as StudentGrade[]} selectedCourseId={selectedCourseId} />}{!isLoading && !error && module === "participation" && <ParticipationView records={items as StudentParticipation[]} selectedCourseId={selectedCourseId} />}{!isLoading && !error && module === "tracking" && <TrackingView data={data} selectedCourseId={selectedCourseId} selectedCourseName={selectedCourseName} />}</div>;
}
