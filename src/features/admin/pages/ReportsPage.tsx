import { useReports } from "../hooks/useReports";
import type { ReportsBundle } from "../types/reports.types";

type ReportsPageProps = {
  token: string;
};

type MetricCardProps = {
  icon: string;
  label: string;
  value: number | string;
};

type ReportTableProps = {
  columns: string[];
  rows: Array<Array<number | string>>;
  title: string;
};

function formatLabel(value: string | null | undefined) {
  if (!value) return "-";

  return value
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function MetricCard({ icon, label, value }: MetricCardProps) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-theme-xs">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50">
          <img alt="" className="h-5 w-5" src={icon} />
        </span>
        <div>
          <p className="text-sm font-medium text-gray-500">{label}</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );
}

function ReportTable({ columns, rows, title }: ReportTableProps) {
  return (
    <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-theme-xs">
      <div className="border-b border-gray-100 px-6 py-4">
        <h3 className="text-lg font-bold text-gray-900">{title}</h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-left">
          <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
            <tr>
              {columns.map((column) => (
                <th className="px-6 py-4 font-semibold" key={column}>
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {rows.length === 0 ? (
              <tr>
                <td
                  className="px-6 py-6 text-center text-gray-500"
                  colSpan={columns.length}
                >
                  No hay datos para mostrar.
                </td>
              </tr>
            ) : (
              rows.map((row, rowIndex) => (
                <tr className="hover:bg-gray-50" key={rowIndex}>
                  {row.map((cell, cellIndex) => (
                    <td
                      className={`px-6 py-4 ${
                        cellIndex === 0
                          ? "font-semibold text-gray-900"
                          : "text-gray-600"
                      }`}
                      key={`${rowIndex}-${cellIndex}`}
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function buildMetrics(reports: ReportsBundle) {
  return [
    {
      icon: "/admin-icons/user-circle.svg",
      label: "Estudiantes activos",
      value: reports.summary.personas.estudiantes_activos,
    },
    {
      icon: "/admin-icons/grid.svg",
      label: "Matriculas activas",
      value: reports.summary.academico.matriculas_activas,
    },
    {
      icon: "/admin-icons/table.svg",
      label: "Asignaciones activas",
      value: reports.summary.academico.asignaciones_activas,
    },
    {
      icon: "/admin-icons/check-circle.svg",
      label: "Incidencias abiertas",
      value: reports.summary.seguimiento.incidencias_abiertas,
    },
    {
      icon: "/admin-icons/docs.svg",
      label: "Cursos activos",
      value: reports.summary.academico.cursos_activos,
    },
    {
      icon: "/admin-icons/plug-in.svg",
      label: "Notificaciones enviadas",
      value: reports.summary.notificaciones.ENVIADA ?? 0,
    },
  ];
}

export function ReportsPage({ token }: ReportsPageProps) {
  const { error, isLoading, reload, reports } = useReports(token);

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-theme-xs sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-brand-600">Reportes</p>
          <h2 className="mt-2 text-2xl font-bold text-gray-900">
            Panel de reportes
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            Consulta indicadores de gestion academica, matriculas, incidencias
            y notificaciones del sistema.
          </p>
        </div>

        <button
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-70"
          disabled={isLoading}
          onClick={() => void reload()}
          type="button"
        >
          <img alt="" className="h-4 w-4" src="/admin-icons/docs.svg" />
          {isLoading ? "Actualizando..." : "Actualizar"}
        </button>
      </section>

      {error && (
        <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {isLoading ? (
        <section className="rounded-2xl border border-gray-200 bg-white px-6 py-10 text-center text-sm text-gray-500 shadow-theme-xs">
          Cargando reportes...
        </section>
      ) : reports ? (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {buildMetrics(reports).map((metric) => (
              <MetricCard
                icon={metric.icon}
                key={metric.label}
                label={metric.label}
                value={metric.value}
              />
            ))}
          </section>

          <div className="grid gap-6 xl:grid-cols-2">
            <ReportTable
              columns={["Docente", "Cursos asignados"]}
              rows={reports.academic.cursos_por_docente.map((item) => [
                `${item.docente__perfil__user__first_name} ${item.docente__perfil__user__last_name}`,
                item.total,
              ])}
              title="Cursos por docente"
            />

            <ReportTable
              columns={["Curso", "Asignaciones"]}
              rows={reports.academic.asignaciones_por_curso.map((item) => [
                item.curso__nombre,
                item.total,
              ])}
              title="Asignaciones por curso"
            />

            <ReportTable
              columns={["Seccion", "Anio", "Estudiantes"]}
              rows={reports.academic.estudiantes_por_seccion.map((item) => [
                `${item.seccion__grado__nombre} - ${item.seccion__nombre}`,
                item.anio_academico__anio,
                item.total,
              ])}
              title="Estudiantes por seccion"
            />

            <ReportTable
              columns={["Estado", "Matriculas"]}
              rows={reports.enrollments.por_estado.map((item) => [
                formatLabel(item.estado),
                item.total,
              ])}
              title="Matriculas por estado"
            />

            <ReportTable
              columns={["Grado", "Matriculas"]}
              rows={reports.enrollments.por_grado.map((item) => [
                item.seccion__grado__nombre,
                item.total,
              ])}
              title="Matriculas por grado"
            />

            <ReportTable
              columns={["Tipo", "Incidencias"]}
              rows={reports.incidents.por_tipo.map((item) => [
                formatLabel(item.tipo),
                item.total,
              ])}
              title="Incidencias por tipo"
            />

            <ReportTable
              columns={["Estado", "Incidencias"]}
              rows={reports.incidents.por_estado.map((item) => [
                formatLabel(item.estado),
                item.total,
              ])}
              title="Incidencias por estado"
            />

            <ReportTable
              columns={["Estado envio", "Notificaciones"]}
              rows={reports.notifications.por_estado_envio.map((item) => [
                formatLabel(item.estado_envio),
                item.total,
              ])}
              title="Notificaciones por estado"
            />
          </div>
        </>
      ) : (
        <section className="rounded-2xl border border-gray-200 bg-white px-6 py-10 text-center text-sm text-gray-500 shadow-theme-xs">
          No se encontraron reportes disponibles.
        </section>
      )}
    </div>
  );
}
