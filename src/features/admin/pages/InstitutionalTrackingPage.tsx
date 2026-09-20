import { useEffect, useMemo, useState } from "react";
import { PaginationControls } from "../../../shared/components/PaginationControls";
import { useClientPagination } from "../../../shared/hooks/useClientPagination";
import {
  getTeacherTrackingDetail,
  getTeacherTrackingSummaries,
  getTrackingIncidents,
  getTrackingObservations,
  getTrackingRecommendations,
} from "../services/institutionalTrackingService";
import type { AIRecommendation } from "../types/aiRecommendation.types";
import { aiRecommendationReviewStatusLabels } from "../types/aiRecommendation.types";
import type { Incident } from "../types/incident.types";
import { incidentStatusLabels } from "../types/incident.types";
import type { Observation } from "../types/observation.types";
import type {
  InstitutionalTrackingTab,
  TeacherTrackingDetail,
  TeacherTrackingSummary,
} from "../types/institutionalTracking.types";

type Props = {
  initialTab?: InstitutionalTrackingTab;
  onBack?: () => void;
  token: string;
};

type TabData = Observation[] | Incident[] | AIRecommendation[];

const tabLabels: Record<InstitutionalTrackingTab, string> = {
  incidents: "Incidencias",
  observations: "Observaciones",
  recommendations: "Recomendaciones IA",
};

function normalize(value: unknown) {
  return String(value ?? "").toLocaleLowerCase("es");
}

function formatDate(value: string | null | undefined) {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString("es-PE", { dateStyle: "medium", timeStyle: "short" });
}

function Badge({ children, tone = "gray" }: { children: string; tone?: "gray" | "green" | "red" | "amber" | "blue" }) {
  const styles = {
    amber: "bg-amber-50 text-amber-700",
    blue: "bg-brand-50 text-brand-700",
    gray: "bg-gray-100 text-gray-700",
    green: "bg-green-50 text-green-700",
    red: "bg-red-50 text-red-700",
  };
  return <span className={`inline-flex rounded-lg px-2.5 py-1 text-xs font-semibold ${styles[tone]}`}>{children}</span>;
}

function Stat({ label, value }: { label: string; value: number }) {
  return <div className="border-l border-gray-200 pl-4 first:border-l-0 first:pl-0"><p className="text-xs font-medium text-gray-500">{label}</p><strong className="mt-1 block text-lg text-gray-900">{value}</strong></div>;
}

function ReadOnlyRecommendationModal({ item, onClose }: { item: AIRecommendation; onClose: () => void }) {
  const recommendation = item as AIRecommendation & Record<string, unknown>;
  const course = String(recommendation.curso_nombre ?? recommendation.asignacion_curso_label ?? "-");
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/50 px-4 py-6"><section className="max-h-full w-full max-w-2xl overflow-y-auto rounded-lg bg-white shadow-theme-xl"><header className="flex items-start justify-between gap-4 border-b border-gray-100 px-6 py-5"><div><p className="text-sm font-semibold text-brand-600">Seguimiento institucional</p><h2 className="mt-1 text-xl font-bold text-gray-900">Detalle de recomendacion</h2></div><button aria-label="Cerrar" className="h-9 w-9 rounded-lg text-xl text-gray-500 hover:bg-gray-100" onClick={onClose} type="button">x</button></header><div className="space-y-5 px-6 py-6"><dl className="grid gap-4 text-sm sm:grid-cols-2"><div><dt className="text-gray-500">Estudiante</dt><dd className="mt-1 font-semibold text-gray-900">{item.estudiante_label}</dd></div><div><dt className="text-gray-500">Docente responsable</dt><dd className="mt-1 font-semibold text-gray-900">{item.docente_revisor_label ?? String(recommendation.docente_label ?? "-")}</dd></div><div><dt className="text-gray-500">Curso</dt><dd className="mt-1 font-semibold text-gray-900">{course}</dd></div><div><dt className="text-gray-500">Periodo</dt><dd className="mt-1 font-semibold text-gray-900">{item.periodo_academico_label ?? "-"}</dd></div><div><dt className="text-gray-500">Estado</dt><dd className="mt-1"><Badge tone={item.estado_revision === "PENDIENTE" ? "amber" : "blue"}>{aiRecommendationReviewStatusLabels[item.estado_revision]}</Badge></dd></div><div><dt className="text-gray-500">Generacion</dt><dd className="mt-1 font-semibold text-gray-900">{formatDate(item.fecha_generacion)}</dd></div></dl><section className="border-t border-gray-100 pt-5"><h3 className="text-sm font-semibold text-gray-900">Contenido</h3><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-700">{item.texto_revisado ?? item.texto_generado}</p></section></div></section></div>;
}

export function InstitutionalTrackingPage({ initialTab = "observations", onBack, token }: Props) {
  const [teachers, setTeachers] = useState<TeacherTrackingSummary[]>([]);
  const [teacherError, setTeacherError] = useState<string | null>(null);
  const [isTeachersLoading, setIsTeachersLoading] = useState(true);
  const [selectedTeacherId, setSelectedTeacherId] = useState<number | null>(null);
  const [detail, setDetail] = useState<TeacherTrackingDetail | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [tab, setTab] = useState<InstitutionalTrackingTab>(initialTab);
  const [tabData, setTabData] = useState<TabData>([]);
  const [tabError, setTabError] = useState<string | null>(null);
  const [isTabLoading, setIsTabLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("");
  const [teacherOrder, setTeacherOrder] = useState("name");
  const [recordSearch, setRecordSearch] = useState("");
  const [recordFilter, setRecordFilter] = useState("");
  const [recordOrder, setRecordOrder] = useState("recent");
  const [detailRecommendation, setDetailRecommendation] = useState<AIRecommendation | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setIsTeachersLoading(true);
    setTeacherError(null);
    getTeacherTrackingSummaries(token, controller.signal)
      .then(setTeachers)
      .catch((error: unknown) => {
        if ((error as { name?: string }).name !== "AbortError") setTeacherError(error instanceof Error ? error.message : "No se pudo cargar el seguimiento docente.");
      })
      .finally(() => { if (!controller.signal.aborted) setIsTeachersLoading(false); });
    return () => controller.abort();
  }, [token]);

  useEffect(() => {
    if (!selectedTeacherId) {
      setDetail(null);
      setDetailError(null);
      return;
    }
    const controller = new AbortController();
    setIsDetailLoading(true);
    setDetailError(null);
    getTeacherTrackingDetail(token, selectedTeacherId, controller.signal)
      .then(setDetail)
      .catch((error: unknown) => {
        if ((error as { name?: string }).name !== "AbortError") setDetailError(error instanceof Error ? error.message : "No se pudo cargar el detalle del docente.");
      })
      .finally(() => { if (!controller.signal.aborted) setIsDetailLoading(false); });
    return () => controller.abort();
  }, [selectedTeacherId, token]);

  useEffect(() => {
    const controller = new AbortController();
    setIsTabLoading(true);
    setTabError(null);
    const load = tab === "observations"
      ? getTrackingObservations(token, selectedTeacherId ?? undefined, controller.signal)
      : tab === "incidents"
        ? getTrackingIncidents(token, selectedTeacherId ?? undefined, controller.signal)
        : getTrackingRecommendations(token, selectedTeacherId ?? undefined, controller.signal);
    load.then((records) => setTabData(records)).catch((error: unknown) => {
      if ((error as { name?: string }).name !== "AbortError") setTabError(error instanceof Error ? error.message : "No se pudo cargar el listado.");
    }).finally(() => { if (!controller.signal.aborted) setIsTabLoading(false); });
    return () => controller.abort();
  }, [selectedTeacherId, tab, token]);

  const filteredTeachers = useMemo(() => {
    const query = normalize(search.trim());
    const records = teachers.filter((teacher) => {
      const matchesSearch = !query || normalize(`${teacher.docente_nombre} ${teacher.username} ${teacher.email} ${teacher.dni}`).includes(query);
      const matchesState = !activeFilter || String(teacher.activo) === activeFilter;
      return matchesSearch && matchesState;
    });
    return [...records].sort((left, right) => teacherOrder === "incidents" ? right.incidencias_abiertas - left.incidencias_abiertas || left.docente_nombre.localeCompare(right.docente_nombre) : teacherOrder === "recommendations" ? right.recomendaciones_pendientes - left.recomendaciones_pendientes || left.docente_nombre.localeCompare(right.docente_nombre) : left.docente_nombre.localeCompare(right.docente_nombre));
  }, [activeFilter, search, teacherOrder, teachers]);
  const teacherPagination = useClientPagination(filteredTeachers);

  const filteredRecords = useMemo(() => {
    const query = normalize(recordSearch.trim());
    const records = tabData.filter((record) => {
      const searchable = JSON.stringify(record);
      if (query && !normalize(searchable).includes(query)) return false;
      if (!recordFilter) return true;
      if (tab === "observations") return String((record as Observation).activo) === recordFilter;
      if (tab === "incidents") return (record as Incident).estado === recordFilter;
      return (record as AIRecommendation).estado_revision === recordFilter;
    });
    return [...records].sort((left, right) => {
      const leftDate = new Date(tab === "observations" ? (left as Observation).fecha : tab === "incidents" ? (left as Incident).fecha_registro : (left as AIRecommendation).fecha_generacion).getTime();
      const rightDate = new Date(tab === "observations" ? (right as Observation).fecha : tab === "incidents" ? (right as Incident).fecha_registro : (right as AIRecommendation).fecha_generacion).getTime();
      return recordOrder === "oldest" ? leftDate - rightDate : rightDate - leftDate;
    });
  }, [recordFilter, recordOrder, recordSearch, tab, tabData]);
  const recordsPagination = useClientPagination(filteredRecords);

  const selectedSummary = selectedTeacherId ? teachers.find((teacher) => teacher.docente_id === selectedTeacherId) ?? null : null;
  const context = detail ?? selectedSummary;
  const selectAll = () => { setSelectedTeacherId(null); setRecordSearch(""); setRecordFilter(""); };
  const selectTeacher = (teacherId: number) => { setSelectedTeacherId(teacherId); setRecordSearch(""); setRecordFilter(""); };

  const renderTabRows = () => {
    if (isTabLoading) return <tr><td className="px-5 py-8 text-center text-gray-500" colSpan={6}>Cargando {tabLabels[tab].toLocaleLowerCase("es")}...</td></tr>;
    if (filteredRecords.length === 0) return <tr><td className="px-5 py-8 text-center text-gray-500" colSpan={6}>{selectedTeacherId ? "Este docente no tiene registros para esta vista." : "No hay registros institucionales para esta vista."}</td></tr>;
    if (tab === "observations") return recordsPagination.pageItems.map((item) => { const record = item as Observation; return <tr className="hover:bg-gray-50" key={record.id}><td className="px-5 py-4"><p className="font-semibold text-gray-900">{record.estudiante_label}</p><p className="mt-1 text-xs text-gray-500">{record.estudiante_codigo}</p></td><td className="px-5 py-4 text-gray-700">{record.docente_label}</td><td className="px-5 py-4 text-gray-700">{record.asignacion_curso_label ?? "-"}</td><td className="max-w-xs px-5 py-4 text-gray-600"><p className="line-clamp-2">{record.descripcion}</p></td><td className="px-5 py-4"><Badge tone={record.activo ? "green" : "gray"}>{record.activo ? "Activa" : "Inactiva"}</Badge></td><td className="px-5 py-4 text-gray-600">{formatDate(record.fecha)}</td></tr>; });
    if (tab === "incidents") return recordsPagination.pageItems.map((item) => { const record = item as Incident; return <tr className="hover:bg-gray-50" key={record.id}><td className="px-5 py-4"><p className="font-semibold text-gray-900">{record.estudiante_label}</p><p className="mt-1 text-xs text-gray-500">{record.estudiante_codigo}</p></td><td className="px-5 py-4 text-gray-700">{record.tipo}</td><td className="max-w-xs px-5 py-4 text-gray-600"><p className="line-clamp-2">{record.descripcion}</p></td><td className="px-5 py-4"><Badge tone={record.estado === "ABIERTA" ? "red" : record.estado === "EN_SEGUIMIENTO" ? "amber" : "green"}>{incidentStatusLabels[record.estado]}</Badge></td><td className="px-5 py-4 text-gray-600">{record.nivel || "-"}</td><td className="px-5 py-4 text-gray-600">{formatDate(record.fecha_registro)}</td></tr>; });
    return recordsPagination.pageItems.map((item) => { const record = item as AIRecommendation & Record<string, unknown>; return <tr className="hover:bg-gray-50" key={record.id}><td className="px-5 py-4"><p className="font-semibold text-gray-900">{record.estudiante_label}</p><p className="mt-1 text-xs text-gray-500">{record.estudiante_codigo}</p></td><td className="px-5 py-4 text-gray-700">{String(record.docente_label ?? record.docente_revisor_label ?? "-")}</td><td className="px-5 py-4 text-gray-700">{String(record.curso_nombre ?? record.asignacion_curso_label ?? "-")}</td><td className="px-5 py-4 text-gray-700">{record.periodo_academico_label ?? "-"}</td><td className="px-5 py-4"><Badge tone={record.estado_revision === "PENDIENTE" ? "amber" : "blue"}>{aiRecommendationReviewStatusLabels[record.estado_revision]}</Badge></td><td className="px-5 py-4 text-right"><button className="rounded-lg border border-brand-200 px-3 py-2 text-xs font-semibold text-brand-700 hover:bg-brand-50" onClick={() => setDetailRecommendation(record)} type="button">Ver detalle</button></td></tr>; });
  };

  return <div className="space-y-6"><section className="flex flex-col gap-4 border-b border-gray-200 pb-5 lg:flex-row lg:items-end lg:justify-between"><div><p className="text-sm font-semibold text-brand-600">Seguimiento institucional</p><h2 className="mt-2 text-2xl font-bold text-gray-900">Actividad por docente</h2><p className="mt-2 text-sm leading-6 text-gray-600">Supervisa asignaciones y registros academicos por docente o desde el panorama institucional.</p></div>{onBack && <button className="h-10 rounded-lg border border-gray-200 px-4 text-sm font-semibold text-gray-700 hover:bg-gray-50" onClick={onBack} type="button">Volver</button>}</section>{teacherError && <section className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{teacherError}</section>}<section className="space-y-4 border border-gray-200 bg-white shadow-theme-xs"><div className="flex flex-col gap-3 border-b border-gray-100 px-5 py-4 lg:flex-row"><input className="h-10 min-w-0 flex-1 rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-brand-500" onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por nombre, usuario, correo o DNI" value={search} /><select className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm" onChange={(event) => setActiveFilter(event.target.value)} value={activeFilter}><option value="">Activos e inactivos</option><option value="true">Activos</option><option value="false">Inactivos</option></select><select className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm" onChange={(event) => setTeacherOrder(event.target.value)} value={teacherOrder}><option value="name">Ordenar: nombre</option><option value="incidents">Ordenar: incidencias abiertas</option><option value="recommendations">Ordenar: recomendaciones pendientes</option></select><button className={`h-10 rounded-lg px-4 text-sm font-semibold ${selectedTeacherId === null ? "bg-brand-500 text-white" : "border border-gray-200 text-gray-700 hover:bg-gray-50"}`} onClick={selectAll} type="button">Todos</button></div><div className="overflow-x-auto"><table className="w-full min-w-[880px] text-left text-sm"><thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500"><tr><th className="px-5 py-3">Docente</th><th className="px-5 py-3">Estado</th><th className="px-5 py-3 text-center">Asignaciones</th><th className="px-5 py-3 text-center">Observaciones</th><th className="px-5 py-3 text-center">Incidencias abiertas</th><th className="px-5 py-3 text-center">Recomendaciones pendientes</th><th className="px-5 py-3 text-right">Accion</th></tr></thead><tbody className="divide-y divide-gray-100">{isTeachersLoading ? <tr><td className="px-5 py-8 text-center text-gray-500" colSpan={7}>Cargando docentes...</td></tr> : filteredTeachers.length === 0 ? <tr><td className="px-5 py-8 text-center text-gray-500" colSpan={7}>No hay docentes que coincidan con los filtros.</td></tr> : teacherPagination.pageItems.map((teacher) => <tr className={`hover:bg-gray-50 ${selectedTeacherId === teacher.docente_id ? "bg-brand-50/50" : ""}`} key={teacher.docente_id}><td className="px-5 py-4"><p className="font-semibold text-gray-900">{teacher.docente_nombre}</p><p className="mt-1 text-xs text-gray-500">{teacher.username} {teacher.email ? `| ${teacher.email}` : ""}</p></td><td className="px-5 py-4"><Badge tone={teacher.activo ? "green" : "gray"}>{teacher.activo ? "Activo" : "Inactivo"}</Badge></td><td className="px-5 py-4 text-center font-semibold text-gray-800">{teacher.asignaciones_activas}</td><td className="px-5 py-4 text-center font-semibold text-gray-800">{teacher.observaciones}</td><td className="px-5 py-4 text-center font-semibold text-red-700">{teacher.incidencias_abiertas}</td><td className="px-5 py-4 text-center font-semibold text-amber-700">{teacher.recomendaciones_pendientes}</td><td className="px-5 py-4 text-right"><button className="rounded-lg border border-brand-200 px-3 py-2 text-xs font-semibold text-brand-700 hover:bg-brand-50" onClick={() => selectTeacher(teacher.docente_id)} type="button">Ver seguimiento</button></td></tr>)}</tbody></table></div><PaginationControls currentPage={teacherPagination.currentPage} isLoading={isTeachersLoading} itemLabel="docentes" onPageChange={teacherPagination.setCurrentPage} pageSize={teacherPagination.pageSize} totalItems={teacherPagination.totalItems} totalPages={teacherPagination.totalPages} /></section><section className="border border-gray-200 bg-white shadow-theme-xs"><div className="border-b border-gray-100 px-5 py-5">{isDetailLoading ? <p className="text-sm text-gray-500">Cargando detalle del docente...</p> : <><div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between"><div><p className="text-sm font-semibold text-brand-600">{selectedTeacherId ? "Docente seleccionado" : "Panorama institucional"}</p><h3 className="mt-1 text-xl font-bold text-gray-900">{context?.docente_nombre ?? "Todos los docentes"}</h3>{context && <p className="mt-1 text-sm text-gray-600">{context.username} {context.email ? `| ${context.email}` : ""}</p>}</div>{context && <Badge tone={context.activo ? "green" : "gray"}>{context.activo ? "Activo" : "Inactivo"}</Badge>}</div>{context && <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4"><Stat label="Asignaciones activas" value={context.asignaciones_activas} /><Stat label="Observaciones" value={context.observaciones} /><Stat label="Incidencias abiertas" value={context.incidencias_abiertas} /><Stat label="Recomendaciones pendientes" value={context.recomendaciones_pendientes} /></div>}{detailError && <p className="mt-4 text-sm text-red-700">{detailError}</p>}{detail?.asignaciones.length ? <div className="mt-5 overflow-x-auto border-t border-gray-100 pt-4"><table className="w-full min-w-[560px] text-left text-sm"><thead className="text-xs uppercase text-gray-500"><tr><th className="pb-2">Curso</th><th className="pb-2">Grado</th><th className="pb-2">Seccion</th><th className="pb-2">Anio</th></tr></thead><tbody className="divide-y divide-gray-100">{detail.asignaciones.map((assignment, index) => <tr key={`${assignment.curso}-${index}`}><td className="py-2 font-medium text-gray-900">{assignment.curso || "-"}</td><td className="py-2 text-gray-700">{assignment.grado || "-"}</td><td className="py-2 text-gray-700">{assignment.seccion || "-"}</td><td className="py-2 text-gray-700">{assignment.anio || "-"}</td></tr>)}</tbody></table></div> : selectedTeacherId && detail && <p className="mt-4 text-sm text-gray-500">Este docente no tiene asignaciones registradas.</p>}</>}</div><div className="flex overflow-x-auto border-b border-gray-100 px-5">{(Object.keys(tabLabels) as InstitutionalTrackingTab[]).map((key) => <button className={`shrink-0 border-b-2 px-4 py-3 text-sm font-semibold ${tab === key ? "border-brand-500 text-brand-700" : "border-transparent text-gray-500 hover:text-gray-800"}`} key={key} onClick={() => { setTab(key); setRecordFilter(""); }} type="button">{tabLabels[key]}</button>)}</div>{tabError && <div className="mx-5 mt-4 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{tabError}</div>}<div className="grid gap-3 border-b border-gray-100 p-5 lg:grid-cols-[1fr_210px_160px]"><input className="h-10 rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-brand-500" onChange={(event) => setRecordSearch(event.target.value)} placeholder={`Buscar en ${tabLabels[tab].toLocaleLowerCase("es")}`} value={recordSearch} /><select className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm" onChange={(event) => setRecordFilter(event.target.value)} value={recordFilter}>{tab === "observations" ? <><option value="">Todos los estados</option><option value="true">Activas</option><option value="false">Inactivas</option></> : tab === "incidents" ? <><option value="">Todos los estados</option><option value="ABIERTA">Abiertas</option><option value="EN_SEGUIMIENTO">En seguimiento</option><option value="CERRADA">Cerradas</option></> : <><option value="">Todas las revisiones</option><option value="PENDIENTE">Pendientes</option><option value="APROBADA">Aprobadas</option><option value="EDITADA">Editadas</option><option value="RECHAZADA">Rechazadas</option></>}</select><select className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm" onChange={(event) => setRecordOrder(event.target.value)} value={recordOrder}><option value="recent">Mas recientes</option><option value="oldest">Mas antiguos</option></select></div><div className="overflow-x-auto"><table className="w-full min-w-[780px] text-left text-sm"><thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500"><tr>{tab === "observations" ? <><th className="px-5 py-3">Estudiante</th><th className="px-5 py-3">Docente</th><th className="px-5 py-3">Curso</th><th className="px-5 py-3">Descripcion</th><th className="px-5 py-3">Estado</th><th className="px-5 py-3">Fecha</th></> : tab === "incidents" ? <><th className="px-5 py-3">Estudiante</th><th className="px-5 py-3">Tipo</th><th className="px-5 py-3">Descripcion</th><th className="px-5 py-3">Estado</th><th className="px-5 py-3">Nivel</th><th className="px-5 py-3">Fecha</th></> : <><th className="px-5 py-3">Estudiante</th><th className="px-5 py-3">Docente</th><th className="px-5 py-3">Curso</th><th className="px-5 py-3">Periodo</th><th className="px-5 py-3">Estado</th><th className="px-5 py-3 text-right">Accion</th></>}</tr></thead><tbody className="divide-y divide-gray-100">{renderTabRows()}</tbody></table></div><PaginationControls currentPage={recordsPagination.currentPage} isLoading={isTabLoading} itemLabel={tabLabels[tab].toLocaleLowerCase("es")} onPageChange={recordsPagination.setCurrentPage} pageSize={recordsPagination.pageSize} totalItems={recordsPagination.totalItems} totalPages={recordsPagination.totalPages} /></section>{detailRecommendation && <ReadOnlyRecommendationModal item={detailRecommendation} onClose={() => setDetailRecommendation(null)} />}</div>;
}
