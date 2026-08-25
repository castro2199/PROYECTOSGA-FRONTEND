import type { AuthUser } from "../../auth/types/auth.types";

type AdminDashboardPageProps = {
  dashboard: unknown;
  primaryRole: string | null;
  user: AuthUser;
};

type Metric = {
  label: string;
  value: number | string;
};

type DashboardList = {
  items: unknown[];
  title: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function formatLabel(value: string) {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
    .replace(/\bSummary\b/g, "Resumen");
}

function collectMetrics(value: unknown, prefix = ""): Metric[] {
  if (!isRecord(value)) return [];

  return Object.entries(value).flatMap(([key, entry]) => {
    const label = prefix ? `${prefix} ${formatLabel(key)}` : formatLabel(key);

    if (typeof entry === "number" || typeof entry === "string") {
      return [{ label, value: entry }];
    }

    if (isRecord(entry)) {
      return collectMetrics(entry, label);
    }

    return [];
  });
}

function collectLists(value: unknown): DashboardList[] {
  if (!isRecord(value)) return [];

  return Object.entries(value).flatMap(([key, entry]) => {
    if (Array.isArray(entry)) {
      return [
        {
          items: entry,
          title: formatLabel(key),
        },
      ];
    }

    if (isRecord(entry)) return collectLists(entry);

    return [];
  });
}

function itemLabel(item: unknown) {
  if (!isRecord(item)) return String(item);

  const label =
    item.label ??
    item.nombre ??
    item.name ??
    item.title ??
    item.curso_nombre ??
    item.curso__nombre ??
    item.curso ??
    item.seccion ??
    item.estudiante;

  if (label) return String(label);

  return Object.entries(item)
    .slice(0, 3)
    .map(([key, value]) => `${formatLabel(key)}: ${String(value)}`)
    .join(" / ");
}

function itemValue(item: unknown) {
  if (!isRecord(item)) return null;

  const value = item.total ?? item.value ?? item.cantidad ?? item.count;
  return value === undefined || value === null ? null : String(value);
}

export function AdminDashboardPage({
  dashboard,
  primaryRole,
  user,
}: AdminDashboardPageProps) {
  const displayName = user.full_name || user.username;
  const source = isRecord(dashboard) ? dashboard : {};
  const metrics = collectMetrics(source).slice(0, 8);
  const lists = collectLists(source).slice(0, 4);

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-theme-xs">
        <div className="grid gap-6 p-6 lg:grid-cols-[1fr_280px] lg:items-center">
          <div>
            <p className="text-sm font-semibold text-brand-600">
              Bienvenido, {displayName}
            </p>
            <h2 className="mt-2 text-2xl font-bold text-gray-900">
              Dashboard {primaryRole ? `- ${primaryRole}` : ""}
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-gray-600">
              Resumen actualizado de tu actividad academica y opciones disponibles.
            </p>
          </div>

          <div className="rounded-2xl border border-brand-100 bg-brand-50 p-5">
            <p className="text-sm font-semibold text-brand-700">Rol activo</p>
            <p className="mt-2 text-2xl font-bold text-gray-900">
              {primaryRole ?? "Usuario"}
            </p>
          </div>
        </div>
      </section>

      {metrics.length > 0 ? (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric) => (
            <article
              className="rounded-2xl border border-gray-200 bg-white p-5 shadow-theme-xs"
              key={metric.label}
            >
              <p className="text-sm font-medium text-gray-500">
                {metric.label}
              </p>
              <strong className="mt-3 block text-3xl font-bold text-gray-900">
                {metric.value}
              </strong>
            </article>
          ))}
        </section>
      ) : (
        <section className="rounded-2xl border border-gray-200 bg-white px-6 py-10 text-center text-sm text-gray-500 shadow-theme-xs">
          No se encontraron indicadores numericos para mostrar.
        </section>
      )}

      {lists.length > 0 && (
        <section className="grid gap-6 xl:grid-cols-2">
          {lists.map((list) => (
            <div
              className="rounded-2xl border border-gray-200 bg-white p-6 shadow-theme-xs"
              key={list.title}
            >
              <h3 className="text-lg font-bold text-gray-900">{list.title}</h3>
              <div className="mt-5 space-y-3">
                {list.items.slice(0, 8).map((item, index) => (
                  <div
                    className="flex items-center justify-between gap-4 rounded-xl border border-gray-100 px-4 py-3 text-sm"
                    key={`${list.title}-${index}`}
                  >
                    <span className="font-semibold text-gray-800">
                      {itemLabel(item)}
                    </span>
                    {itemValue(item) && (
                      <span className="rounded-lg bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                        {itemValue(item)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
