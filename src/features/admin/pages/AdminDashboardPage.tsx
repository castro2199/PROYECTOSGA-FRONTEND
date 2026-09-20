import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { AuthUser } from "../../auth/types/auth.types";
import { DashboardRequestError, getDashboard } from "../services/dashboardService";

type Props = {
  accessToken: string;
  dashboard: unknown;
  onNavigate: (path: string) => void;
  primaryRole: string | null;
  user: AuthUser;
};

type RecordValue = Record<string, unknown>;
type ChartRow = Record<string, string | number>;

const CHART_COLORS = ["#2563eb", "#0f766e", "#b45309", "#7c3aed", "#be123c"];

function isRecord(value: unknown): value is RecordValue {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function records(value: unknown): RecordValue[] {
  return Array.isArray(value) ? value.filter(isRecord) : [];
}

function text(value: unknown) {
  return typeof value === "string" || typeof value === "number" ? String(value) : "";
}

function formatLabel(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function optionValue(option: unknown) {
  if (!isRecord(option)) return text(option);
  return text(option.value ?? option.id ?? option.codigo ?? option.key ?? option.slug);
}

function optionLabel(option: unknown) {
  if (!isRecord(option)) return text(option);
  return text(option.label ?? option.nombre ?? option.name ?? option.title) || optionValue(option);
}

function filterLabel(key: string) {
  const labels: Record<string, string> = {
    anio: "Año", anio_academico: "Año", periodo: "Periodo", periodo_academico: "Periodo",
    grado: "Grado", seccion: "Sección", docente: "Docente", curso: "Curso",
    asignacion: "Curso asignado", asignacion_curso: "Curso asignado",
    estudiante: "Estudiante", estudiantes: "Estudiante",
  };
  return labels[key] ?? formatLabel(key);
}

function filterKeys(options: RecordValue) {
  const order = ["anio", "anio_academico", "periodo", "periodo_academico", "grado", "seccion", "docente", "curso", "asignacion", "asignacion_curso", "estudiante", "estudiantes"];
  const known = order.filter((key) => Array.isArray(options[key]));
  return [...known, ...Object.keys(options).filter((key) => Array.isArray(options[key]) && !known.includes(key))];
}

function readAppliedFilters(value: unknown): Record<string, string> {
  if (!isRecord(value)) return {};
  return Object.fromEntries(Object.entries(value).flatMap(([key, item]) => {
    const normalized = isRecord(item) ? optionValue(item) : text(item);
    return normalized ? [[key, normalized]] : [];
  }));
}

function sameFilters(left: Record<string, string>, right: Record<string, string>) {
  const keys = Object.keys(left);
  return keys.length === Object.keys(right).length && keys.every((key) => left[key] === right[key]);
}

function asIndicators(value: unknown): RecordValue[] {
  if (Array.isArray(value)) return records(value);
  if (!isRecord(value)) return [];
  return Object.entries(value).flatMap(([key, item]) => {
    if (isRecord(item)) return [{ ...item, title: item.title ?? item.titulo ?? formatLabel(key) }];
    if (typeof item === "number" || typeof item === "string") return [{ title: formatLabel(key), value: item }];
    return [];
  });
}

function statusStyle(value: unknown) {
  const status = text(value).toLowerCase().replace(/\s/g, "_");
  if (["bien", "ok", "positivo", "success"].includes(status)) return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (["alerta", "warning", "riesgo", "attention"].includes(status)) return "border-amber-200 bg-amber-50 text-amber-900";
  return "border-slate-200 bg-slate-50 text-slate-700";
}

function statusLabel(value: unknown) {
  return text(value).replace(/_/g, " ") || "Sin datos";
}

function chartRows(chart: RecordValue): ChartRow[] {
  const raw = chart.data ?? chart.datos ?? chart.items ?? chart.valores;
  if (Array.isArray(raw) && raw.every(isRecord)) {
    return raw.map((item) => Object.fromEntries(Object.entries(item).flatMap(([key, value]) =>
      typeof value === "string" || typeof value === "number" ? [[key, value]] : [],
    )));
  }
  const labels = Array.isArray(chart.labels) ? chart.labels : Array.isArray(chart.etiquetas) ? chart.etiquetas : [];
  const series = records(chart.datasets ?? chart.series);
  if (labels.length && series.length) {
    return labels.map((label, index) => {
      const row: ChartRow = { etiqueta: text(label) };
      series.forEach((seriesItem, seriesIndex) => {
        const values = seriesItem.data ?? seriesItem.datos ?? seriesItem.valores;
        const value = Array.isArray(values) ? values[index] : undefined;
        const numeric = typeof value === "number" ? value : Number(value);
        if (Number.isFinite(numeric)) {
          row[text(seriesItem.label ?? seriesItem.nombre ?? seriesItem.name) || `serie_${seriesIndex + 1}`] = numeric;
        }
      });
      return row;
    });
  }
  if (!Array.isArray(raw) || !labels.length) return [];
  return raw.flatMap((value, index) => {
    const numeric = typeof value === "number" ? value : Number(value);
    return Number.isFinite(numeric) ? [{ etiqueta: text(labels[index]), valor: numeric }] : [];
  });
}

function numericKeys(rows: ChartRow[]) {
  const keys = new Set<string>();
  rows.forEach((row) => Object.entries(row).forEach(([key, value]) => {
    if (typeof value === "number" && Number.isFinite(value)) keys.add(key);
  }));
  return [...keys];
}

function chartCategory(rows: ChartRow[], keys: string[]) {
  return rows.flatMap((row) => Object.keys(row)).find((key) => !keys.includes(key)) ?? "etiqueta";
}

function valuesAreZero(rows: ChartRow[], keys: string[]) {
  const values = rows.flatMap((row) => keys.map((key) => row[key]).filter((value): value is number => typeof value === "number"));
  return values.length > 0 && values.every((value) => value === 0);
}

function priorityRows(value: unknown) {
  if (Array.isArray(value)) return records(value);
  if (!isRecord(value)) return [];
  return records(value.items ?? value.results ?? value.estudiantes);
}

function priorityName(item: RecordValue) {
  return text(item.estudiante_nombre ?? item.estudiante_label ?? item.estudiante ?? item.nombre ?? item.label);
}

function priorityReasons(item: RecordValue) {
  const value = item.motivos ?? item.razones ?? item.factores ?? item.descripcion;
  if (Array.isArray(value)) return value.map(text).filter(Boolean);
  const single = text(value);
  return single ? [single] : [];
}

function parseDashboard(value: unknown) {
  const source = isRecord(value) ? value : {};
  const charts: RecordValue[] = Array.isArray(source.graficos)
    ? records(source.graficos)
    : isRecord(source.graficos)
      ? Object.entries(source.graficos).flatMap(([key, chart]): RecordValue[] => isRecord(chart) ? [{ ...chart, title: chart.title ?? chart.titulo ?? formatLabel(key) }] : [])
      : [];
  return {
    applied: readAppliedFilters(source.filtros_aplicados),
    charts,
    filters: isRecord(source.opciones_filtro) ? source.opciones_filtro : {},
    indicators: asIndicators(source.indicadores),
    meta: isRecord(source.meta) ? source.meta : {},
    priorities: priorityRows(source.prioridades),
    summary: source.summary ?? source.items,
  };
}

function DashboardSkeleton() {
  return <div aria-label="Cargando dashboard" className="animate-pulse space-y-5"><div className="h-36 rounded-lg bg-gray-200" /><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[0, 1, 2, 3].map((item) => <div className="h-36 rounded-lg bg-gray-200" key={item} />)}</div><div className="grid gap-5 xl:grid-cols-2"><div className="h-80 rounded-lg bg-gray-200" /><div className="h-80 rounded-lg bg-gray-200" /></div></div>;
}

function DashboardChart({ chart }: { chart: RecordValue }) {
  const rows = chartRows(chart);
  const keys = numericKeys(rows);
  const category = chartCategory(rows, keys);
  const kind = text(chart.tipo ?? chart.type).toLowerCase();
  const title = text(chart.titulo ?? chart.title ?? chart.nombre) || "Gráfico";
  const description = text(chart.interpretacion ?? chart.descripcion);
  const empty = !rows.length || !keys.length || valuesAreZero(rows, keys);

  return <section className="min-w-0 border border-gray-200 bg-white p-5 shadow-theme-xs"><h3 className="text-base font-bold text-gray-900">{title}</h3>{description && <p className="mt-1 text-sm leading-6 text-gray-600">{description}</p>}{empty ? <div className="flex h-64 items-center justify-center text-center text-sm text-gray-500">No hay datos para representar con los filtros seleccionados.</div> : <div aria-label={title} className="mt-4 h-64" role="img"><ResponsiveContainer height="100%" width="100%">{kind.includes("linea") || kind.includes("line") ? <LineChart data={rows} margin={{ top: 8, right: 8, bottom: 8, left: 0 }}><CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" /><XAxis dataKey={category} tick={{ fontSize: 12 }} /><YAxis tick={{ fontSize: 12 }} /><Tooltip /><Legend />{keys.map((key, index) => <Line dataKey={key} dot={false} key={key} name={formatLabel(key)} stroke={CHART_COLORS[index % CHART_COLORS.length]} strokeWidth={2} />)}</LineChart> : kind.includes("pie") || kind.includes("circular") ? <PieChart><Tooltip /><Legend /><Pie data={rows} dataKey={keys[0]} nameKey={category} outerRadius={82}>{rows.map((_, index) => <Cell fill={CHART_COLORS[index % CHART_COLORS.length]} key={index} />)}</Pie></PieChart> : <BarChart data={rows} margin={{ top: 8, right: 8, bottom: 8, left: 0 }}><CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" /><XAxis dataKey={category} tick={{ fontSize: 12 }} /><YAxis tick={{ fontSize: 12 }} /><Tooltip /><Legend />{keys.map((key, index) => <Bar dataKey={key} fill={CHART_COLORS[index % CHART_COLORS.length]} key={key} name={formatLabel(key)} radius={[3, 3, 0, 0]} />)}</BarChart>}</ResponsiveContainer></div>}</section>;
}

function roleInfo(primaryRole: string | null) {
  const role = (primaryRole ?? "").toLocaleLowerCase("es");
  if (role.includes("docente")) return { title: "Seguimiento de mis cursos", description: "Revisa los avances de tus cursos y prioriza acciones pedagogicas con criterio profesional.", actions: [["Asistencia", "/docente/mis-cursos"], ["Calificaciones", "/docente/mis-cursos"], ["Observaciones", "/docente/mis-cursos"], ["Recomendaciones IA", "/docente/recomendaciones-ia"]] };
  if (role.includes("estudiante") || role.includes("alumno")) return { title: "Mi avance academico", description: "Consulta tus avances para identificar con calma los aspectos que puedes seguir reforzando.", actions: [["Mis cursos", "/estudiante/mis-cursos"]] };
  if (role.includes("apoderado") || role.includes("padre") || role.includes("madre")) return { title: "Seguimiento de mis estudiantes", description: "Acompaña el avance de tus estudiantes con información actualizada de sus cursos.", actions: [["Mis estudiantes", "/apoderado/mis-estudiantes"], ["Recomendaciones publicadas", "/apoderado/mis-estudiantes"], ["Notificaciones", "/apoderado/notificaciones"]] };
  return { title: "Seguimiento institucional", description: "Supervisa el seguimiento educativo y consulta los casos que requieren una revisión oportuna.", actions: [["Incidencias", "/admin/seguimiento/incidencias"], ["Observaciones", "/admin/seguimiento/observaciones"], ["Recomendaciones IA", "/admin/seguimiento/recomendaciones-ia"]] };
}

export function AdminDashboardPage({ accessToken, dashboard, onNavigate, primaryRole, user }: Props) {
  const initial = useMemo(() => parseDashboard(dashboard), [dashboard]);
  const [data, setData] = useState<unknown>(dashboard);
  const [filters, setFilters] = useState<Record<string, string>>(initial.applied);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const firstQuery = useRef(true);
  const view = useMemo(() => parseDashboard(data), [data]);
  const role = roleInfo(primaryRole);
  const isTeacher = (primaryRole ?? "").toLocaleLowerCase("es").includes("docente");
  const summaryItems = asIndicators(view.summary);
  const hasContent = view.indicators.length > 0 || view.charts.length > 0 || view.priorities.length > 0 || summaryItems.length > 0;

  useEffect(() => {
    setData(dashboard);
    const nextFilters = parseDashboard(dashboard).applied;
    setFilters((current) => sameFilters(current, nextFilters) ? current : nextFilters);
  }, [dashboard]);

  useEffect(() => {
    if (firstQuery.current) { firstQuery.current = false; return; }
    const controller = new AbortController();
    setIsLoading(true);
    setError(null);
    void getDashboard(filters, controller.signal).then((result) => {
      setData(result);
      const applied = parseDashboard(result).applied;
      setFilters((current) => sameFilters(current, applied) ? current : applied);
    }).catch((requestError: unknown) => {
      if (requestError instanceof DOMException && requestError.name === "AbortError") return;
      if (requestError instanceof DashboardRequestError && requestError.status === 401) { setError("Tu sesion expiro. Inicia sesion nuevamente."); return; }
      setError(requestError instanceof Error ? requestError.message : "No se pudo actualizar el dashboard.");
    }).finally(() => { if (!controller.signal.aborted) setIsLoading(false); });
    return () => controller.abort();
  }, [accessToken, filters]);

  return <div className="space-y-6"><section className="border border-gray-200 bg-white p-5 shadow-theme-xs sm:p-6"><div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between"><div><p className="text-sm font-semibold text-brand-600">{primaryRole ?? "Usuario"}</p><h2 className="mt-1 text-2xl font-bold text-gray-900">{role.title}</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-gray-600">{role.description}</p><p className="mt-3 text-sm text-gray-500">{user.full_name || user.username}</p></div><div className="flex flex-wrap gap-2 lg:justify-end">{role.actions.map(([label, path]) => <button className="h-10 rounded-lg border border-brand-200 px-3 text-sm font-semibold text-brand-700 hover:bg-brand-50" key={label} onClick={() => onNavigate(path)} type="button">{label}</button>)}</div></div>{filterKeys(view.filters).length > 0 && <div className="mt-5 grid gap-3 border-t border-gray-100 pt-5 sm:grid-cols-2 xl:grid-cols-3">{filterKeys(view.filters).map((key) => { const options = Array.isArray(view.filters[key]) ? view.filters[key] : []; return <label className="min-w-0 text-sm font-semibold text-gray-700" key={key}><span className="mb-2 block">{filterLabel(key)}</span><select className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm font-normal text-gray-800 outline-none focus:border-brand-500 disabled:bg-gray-50" disabled={isLoading} onChange={(event) => setFilters((current) => ({ ...current, [key]: event.target.value }))} value={filters[key] ?? ""}><option value="">Todos</option>{options.map((option, index) => { const value = optionValue(option); return value ? <option key={`${value}-${index}`} value={value}>{optionLabel(option)}</option> : null; })}</select></label>; })}</div>}</section>
    {isLoading && <DashboardSkeleton />}
    {!isLoading && error && <section className="border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-800"><p className="font-semibold">No se pudo cargar el dashboard</p><p className="mt-1">{error}</p></section>}
    {!isLoading && !error && !hasContent && <section className="border border-dashed border-gray-300 bg-white px-6 py-12 text-center text-sm leading-6 text-gray-600 shadow-theme-xs">No hay información de seguimiento para los filtros seleccionados.</section>}
    {!isLoading && !error && view.indicators.length > 0 && <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{view.indicators.map((item, index) => { const title = text(item.titulo ?? item.title ?? item.nombre) || "Indicador"; const value = text(item.valor ?? item.value ?? item.cantidad); const unit = text(item.unidad ?? item.unit); const interpretation = text(item.interpretacion ?? item.descripcion ?? item.detail); const status = item.estado ?? item.status; return <article className={`border p-4 shadow-theme-xs ${statusStyle(status)}`} key={`${title}-${index}`}><div className="flex items-start justify-between gap-3"><h3 className="text-sm font-bold">{title}</h3><span className="shrink-0 rounded-md border border-current px-2 py-1 text-xs font-semibold capitalize">{statusLabel(status)}</span></div><p className="mt-4 text-3xl font-bold text-gray-900">{value}{unit && <span className="ml-1 text-base font-semibold">{unit}</span>}</p>{interpretation && <p className="mt-3 text-sm leading-5">{interpretation}</p>}</article>; })}</section>}
    {!isLoading && !error && view.charts.length > 0 && <section className="grid gap-5 xl:grid-cols-2">{view.charts.map((chart, index) => <DashboardChart chart={chart} key={`${text(chart.id ?? chart.title ?? chart.titulo)}-${index}`} />)}</section>}
    {!isLoading && !error && view.priorities.length > 0 && <section className="overflow-hidden border border-gray-200 bg-white shadow-theme-xs"><div className="border-b border-gray-100 px-5 py-5"><h3 className="text-lg font-bold text-gray-900">Seguimiento prioritario</h3>{text(view.meta.criterio_priorizacion) && <p className="mt-2 text-sm leading-6 text-gray-600">Criterio: {text(view.meta.criterio_priorizacion)}</p>}<p className="mt-2 text-sm leading-6 text-gray-600">La priorización es orientativa y requiere interpretación humana antes de tomar decisiones.</p></div><div className="overflow-x-auto"><table className="w-full min-w-[680px] text-left text-sm"><thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500"><tr><th className="px-5 py-3">Estudiante</th><th className="px-5 py-3">Curso</th><th className="px-5 py-3">Motivos de seguimiento</th>{isTeacher && <th className="px-5 py-3 text-right">Acción</th>}</tr></thead><tbody className="divide-y divide-gray-100">{view.priorities.map((item, index) => { const assignment = text(item.asignacion_curso ?? item.asignacion_id); const trackingPath = text(item.ruta_seguimiento ?? item.seguimiento_url) || (assignment ? `/docente/mis-cursos/${assignment}/seguimiento` : ""); const reasons = priorityReasons(item); return <tr className="align-top" key={`${priorityName(item)}-${index}`}><td className="px-5 py-4 font-semibold text-gray-900">{priorityName(item) || "Estudiante"}</td><td className="px-5 py-4 text-gray-700">{text(item.curso_nombre ?? item.curso ?? item.asignacion_label) || "-"}</td><td className="px-5 py-4 text-gray-700">{reasons.length ? <ul className="space-y-1">{reasons.map((reason, reasonIndex) => <li key={reasonIndex}>{reason}</li>)}</ul> : "-"}</td>{isTeacher && <td className="px-5 py-4 text-right">{trackingPath && <button className="rounded-lg border border-brand-200 px-3 py-2 text-xs font-semibold text-brand-700 hover:bg-brand-50" onClick={() => onNavigate(trackingPath)} type="button">Ver seguimiento</button>}</td>}</tr>; })}</tbody></table></div></section>}
    {!isLoading && !error && summaryItems.length > 0 && <section className="border border-gray-200 bg-white shadow-theme-xs"><div className="border-b border-gray-100 px-5 py-4"><h3 className="font-bold text-gray-900">Datos complementarios</h3></div><dl className="grid divide-y divide-gray-100 sm:grid-cols-2 sm:divide-x sm:divide-y-0">{summaryItems.map((item, index) => <div className="px-5 py-4" key={index}><dt className="text-sm text-gray-500">{text(item.titulo ?? item.title ?? item.label) || "Dato"}</dt><dd className="mt-1 text-lg font-bold text-gray-900">{text(item.valor ?? item.value ?? item.cantidad)}</dd></div>)}</dl></section>}
  </div>;
}
