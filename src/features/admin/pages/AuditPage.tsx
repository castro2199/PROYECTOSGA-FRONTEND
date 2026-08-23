import { useMemo, useState } from "react";
import { useAudit } from "../hooks/useAudit";

type AuditPageProps = {
  token: string;
};

type AuditMetricProps = {
  label: string;
  value: number;
};

const PAGE_SIZE = 10;

const actionStyles: Record<string, string> = {
  ACTUALIZAR: "border-brand-100 bg-brand-50 text-brand-700",
  CREAR: "border-success-100 bg-success-50 text-success-700",
  ELIMINAR: "border-red-100 bg-red-50 text-red-700",
};

function formatDateTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("es-PE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatLabel(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function AuditMetric({ label, value }: AuditMetricProps) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-theme-xs">
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );
}

export function AuditPage({ token }: AuditPageProps) {
  const [ordering, setOrdering] = useState("-fecha");
  const [page, setPage] = useState(1);
  const [searchDraft, setSearchDraft] = useState("");
  const [search, setSearch] = useState("");

  const filters = useMemo(
    () => ({
      ordering,
      page,
      search,
    }),
    [ordering, page, search],
  );
  const { count, error, isLoading, next, previous, records, reload } = useAudit(
    token,
    filters,
  );
  const actionTotals = useMemo(() => {
    return records.reduce<Record<string, number>>((totals, record) => {
      totals[record.accion] = (totals[record.accion] ?? 0) + 1;
      return totals;
    }, {});
  }, [records]);
  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));

  const handleSearch = () => {
    setPage(1);
    setSearch(searchDraft);
  };

  const clearSearch = () => {
    setPage(1);
    setSearch("");
    setSearchDraft("");
  };

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-theme-xs">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-sm font-semibold text-brand-600">Auditoria</p>
            <h2 className="mt-2 text-2xl font-bold text-gray-900">
              Registro de auditoria
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              Consulta acciones registradas por usuario, modulo, entidad y
              fecha dentro del sistema.
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
        </div>

        <div className="mt-6 grid gap-3 lg:grid-cols-[1fr_180px_auto_auto]">
          <input
            className="h-11 rounded-lg border border-gray-200 px-4 text-sm outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-50"
            onChange={(event) => setSearchDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                handleSearch();
              }
            }}
            placeholder="Buscar por usuario, accion, modulo o entidad"
            value={searchDraft}
          />
          <select
            className="h-11 rounded-lg border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-700 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-50"
            disabled={isLoading}
            onChange={(event) => {
              setPage(1);
              setOrdering(event.target.value);
            }}
            value={ordering}
          >
            <option value="-fecha">Mas recientes</option>
            <option value="fecha">Mas antiguos</option>
            <option value="modulo">Modulo A-Z</option>
            <option value="accion">Accion A-Z</option>
          </select>
          <button
            className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white shadow-theme-sm transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-70"
            disabled={isLoading}
            onClick={handleSearch}
            type="button"
          >
            Buscar
          </button>
          <button
            className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-70"
            disabled={isLoading || (!search && !searchDraft)}
            onClick={clearSearch}
            type="button"
          >
            Limpiar
          </button>
        </div>
      </section>

      {error && (
        <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AuditMetric label="Total registros" value={count} />
        <AuditMetric label="Creados en pagina" value={actionTotals.CREAR ?? 0} />
        <AuditMetric
          label="Actualizados en pagina"
          value={actionTotals.ACTUALIZAR ?? 0}
        />
        <AuditMetric
          label="Eliminados en pagina"
          value={actionTotals.ELIMINAR ?? 0}
        />
      </section>

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-theme-xs">
        <div className="flex flex-col gap-2 border-b border-gray-100 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-lg font-bold text-gray-900">Listado</h3>
          <p className="text-sm text-gray-500">
            Pagina {page} de {totalPages}
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1040px] text-left">
            <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
              <tr>
                <th className="px-6 py-4 font-semibold">Fecha</th>
                <th className="px-6 py-4 font-semibold">Usuario</th>
                <th className="px-6 py-4 font-semibold">Accion</th>
                <th className="px-6 py-4 font-semibold">Modulo</th>
                <th className="px-6 py-4 font-semibold">Entidad</th>
                <th className="px-6 py-4 font-semibold">ID entidad</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {isLoading ? (
                <tr>
                  <td className="px-6 py-8 text-center text-gray-500" colSpan={6}>
                    Cargando registros de auditoria...
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td className="px-6 py-8 text-center text-gray-500" colSpan={6}>
                    No hay registros de auditoria.
                  </td>
                </tr>
              ) : (
                records.map((record) => (
                  <tr className="hover:bg-gray-50" key={record.id}>
                    <td className="px-6 py-4 text-gray-600">
                      {formatDateTime(record.fecha)}
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-gray-900">
                        {record.user_full_name || record.user_username || "-"}
                      </p>
                      {record.user_username && (
                        <p className="mt-1 text-xs text-gray-500">
                          @{record.user_username}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-lg border px-3 py-1 text-xs font-semibold ${
                          actionStyles[record.accion] ??
                          "border-gray-200 bg-gray-100 text-gray-600"
                        }`}
                      >
                        {formatLabel(record.accion)}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-gray-900">
                      {formatLabel(record.modulo)}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {record.entidad}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {record.entidad_id ?? "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 border-t border-gray-100 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-gray-500">
            Mostrando {records.length} de {count} registros
          </p>
          <div className="flex gap-2">
            <button
              className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isLoading || !previous || page <= 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              type="button"
            >
              Anterior
            </button>
            <button
              className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isLoading || !next}
              onClick={() => setPage((current) => current + 1)}
              type="button"
            >
              Siguiente
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
