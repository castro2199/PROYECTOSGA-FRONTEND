import { useEffect, useMemo, useState } from "react";
import { PaginationControls } from "../../../shared/components/PaginationControls";
import { useClientPagination } from "../../../shared/hooks/useClientPagination";
import { TeacherRecordModal } from "../components/TeacherRecordModal";
import { TeacherRecommendationsPage } from "./TeacherRecommendationsPage";
import { FollowUpPage } from "../../followup/pages/FollowUpPage";
import { ExportPdfButton } from "../../admin/components/ExportPdfButton";
import {
  getTeacherCourseStudents,
  getTeacherModuleData,
} from "../services/teacherService";
import type { TeacherCourse, TeacherModuleKey } from "../services/teacherService";

type TeacherModulePageProps = {
  embedded?: boolean;
  module: TeacherModuleKey;
  onOpenCourse?: (courseId: number, module?: TeacherModuleKey) => void;
  selectedCourseId?: number;
  token: string;
};

type ModuleConfig = {
  description: string;
  empty: string;
  title: string;
};

type RecordValue = string | number | boolean | null | undefined;

const MODULE_CONFIG: Record<TeacherModuleKey, ModuleConfig> = {
  attendance: {
    description: "Registro y consulta de asistencia de los estudiantes.",
    empty: "No hay registros de asistencia para mostrar.",
    title: "Asistencia",
  },
  courses: {
    description: "Cursos y secciones asignados al docente.",
    empty: "No hay cursos asignados para este docente.",
    title: "Mis cursos",
  },
  grades: {
    description: "Seguimiento de calificaciones por estudiante y curso.",
    empty: "No hay calificaciones registradas.",
    title: "Calificaciones",
  },
  observations: {
    description: "Observaciones academicas y de convivencia registradas.",
    empty: "No hay observaciones registradas.",
    title: "Observaciones",
  },
  participations: {
    description: "Participaciones de estudiantes por curso o actividad.",
    empty: "No hay participaciones registradas.",
    title: "Participaciones",
  },
  recommendations: {
    description: "Recomendaciones generadas o revisadas para seguimiento.",
    empty: "No hay recomendaciones IA registradas.",
    title: "Recomendaciones IA",
  },
  reports: {
    description: "Indicadores y reportes disponibles para el rol docente.",
    empty: "No hay datos de reportes para mostrar.",
    title: "Reportes",
  },
  tracking: {
    description: "Alertas, incidencias y casos en seguimiento estudiantil.",
    empty: "No hay casos de seguimiento registrados.",
    title: "Seguimiento estudiantil",
  },
};

const PREFERRED_COLUMNS: Record<TeacherModuleKey, string[]> = {
  attendance: [
    "estudiante_nombre",
    "estudiante_codigo",
    "curso_nombre",
    "fecha",
    "estado_label",
    "justificacion",
  ],
  courses: [
    "curso_nombre",
    "grado_nombre",
    "seccion_nombre",
    "anio_academico",
    "estudiantes_matriculados",
    "estado_label",
  ],
  grades: [
    "estudiante_nombre",
    "curso_nombre",
    "periodo_nombre",
    "criterio_nombre",
    "valor_label",
    "observacion",
  ],
  observations: [
    "estudiante_nombre",
    "curso_nombre",
    "seccion_nombre",
    "fecha",
    "categoria",
    "descripcion",
  ],
  participations: [
    "estudiante_nombre",
    "curso_nombre",
    "fecha",
    "tipo_label",
    "valor",
    "observacion",
  ],
  recommendations: [
    "estudiante_label",
    "seccion_label",
    "periodo_academico_label",
    "estado_revision",
    "fecha_generacion",
  ],
  reports: [
    "curso__nombre",
    "seccion__grado__nombre",
    "seccion__nombre",
    "anio_academico__anio",
  ],
  tracking: [
    "estudiante_label",
    "seccion_label",
    "tipo",
    "nivel",
    "estado",
    "fecha_registro",
  ],
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function formatLabel(value: string) {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "-";
  if (typeof value === "boolean") return value ? "Si" : "No";
  if (Array.isArray(value)) return `${value.length} registros`;
  if (isRecord(value)) return Object.values(value).slice(0, 2).join(" / ");

  const text = String(value);
  const date = /^\d{4}-\d{2}-\d{2}/.test(text) ? new Date(text) : null;

  if (date && !Number.isNaN(date.getTime())) {
    return date.toLocaleDateString("es-PE");
  }

  return text;
}

function extractItems(data: unknown): Record<string, unknown>[] {
  if (Array.isArray(data)) {
    return data.filter(isRecord);
  }

  if (!isRecord(data)) return [];

  const list =
    data.results ??
    data.items ??
    data.data ??
    data.records ??
    data.registros ??
    data.detalle ??
    data.asignaciones;

  if (Array.isArray(list)) return list.filter(isRecord);

  return [];
}

function collectMetrics(data: unknown): Array<{ label: string; value: RecordValue }> {
  if (!isRecord(data)) return [];

  return Object.entries(data)
    .flatMap(([key, value]) => {
      if (
        typeof value === "number" ||
        typeof value === "string" ||
        typeof value === "boolean"
      ) {
        return [{ label: formatLabel(key), value }];
      }

      if (isRecord(value)) {
        return Object.entries(value)
          .filter(
            ([, nestedValue]) =>
              typeof nestedValue === "number" ||
              typeof nestedValue === "string" ||
              typeof nestedValue === "boolean",
          )
          .map(([nestedKey, nestedValue]) => ({
            label: `${formatLabel(key)} ${formatLabel(nestedKey)}`,
            value: nestedValue as RecordValue,
          }));
      }

      return [];
    })
    .slice(0, 8);
}

function getColumns(module: TeacherModuleKey, items: Record<string, unknown>[]) {
  const availableKeys = new Set(items.flatMap((item) => Object.keys(item)));
  const preferred = PREFERRED_COLUMNS[module].filter((key) =>
    availableKeys.has(key),
  );

  if (preferred.length > 0) return preferred.slice(0, 6);

  return [...availableKeys]
    .filter((key) => !["id", "created_at", "updated_at"].includes(key))
    .slice(0, 6);
}

function getPrimaryText(item: Record<string, unknown>, module: TeacherModuleKey) {
  if (module === "courses") return item.curso_nombre ?? item.curso_label ?? item.curso;
  return (
    item.estudiante_nombre ??
    item.estudiante_label ??
    item.estudiante ??
    item.nombre ??
    item.label ??
    item.name ??
    item.title ??
    `Registro ${formatValue(item.id)}`
  );
}

function isWritableModule(
  module: TeacherModuleKey,
): module is Extract<
  TeacherModuleKey,
  "attendance" | "grades" | "participations" | "observations"
> {
  return [
    "attendance",
    "grades",
    "participations",
    "observations",
  ].includes(module);
}

const COURSE_ACTIONS: Array<{ label: string; module: TeacherModuleKey }> = [
  { label: "Asistencia", module: "attendance" },
  { label: "Calificaciones", module: "grades" },
  { label: "Participaciones", module: "participations" },
  { label: "Observaciones", module: "observations" },
  { label: "Seguimiento", module: "tracking" },
  { label: "Recomendaciones IA", module: "recommendations" },
  { label: "Reportes", module: "reports" },
];

function CourseList({
  items,
  onOpenCourse,
}: {
  items: Record<string, unknown>[];
  onOpenCourse?: (courseId: number, module?: TeacherModuleKey) => void;
}) {
  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {items.map((item, index) => {
        const course = item as TeacherCourse;
        return (
          <article
            className="rounded-lg border border-gray-200 bg-white p-5 shadow-theme-xs"
            key={String(course.id ?? index)}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase text-brand-600">
                  {course.grado_nombre} - Seccion {course.seccion_nombre}
                </p>
                <h3 className="mt-2 text-lg font-bold text-gray-900">
                  {course.curso_nombre}
                </h3>
              </div>
              <span className="rounded-lg bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700">
                {course.estado_label}
              </span>
            </div>
            <p className="mt-3 min-h-10 text-sm leading-5 text-gray-600">
              {course.curso_descripcion || "Sin descripcion registrada."}
            </p>
            <dl className="mt-5 grid grid-cols-2 gap-3 border-t border-gray-100 pt-4 text-sm">
              <div>
                <dt className="text-gray-500">Anio academico</dt>
                <dd className="mt-1 font-semibold text-gray-900">{course.anio_academico}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Estudiantes</dt>
                <dd className="mt-1 font-semibold text-gray-900">{course.estudiantes_matriculados}</dd>
              </div>
            </dl>
            {onOpenCourse && (
              <div className="mt-5 border-t border-gray-100 pt-4">
                <button
                  className="w-full rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600"
                  onClick={() => onOpenCourse(course.id)}
                  type="button"
                >
                  Abrir curso
                </button>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {COURSE_ACTIONS.map((action) => (
                    <button
                      className="min-h-10 rounded-lg border border-gray-200 px-2 py-2 text-xs font-semibold text-gray-700 hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700"
                      key={action.module}
                      onClick={() => onOpenCourse(course.id, action.module)}
                      type="button"
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </article>
        );
      })}
    </section>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <section className="rounded-2xl border border-dashed border-gray-200 bg-white px-6 py-10 text-center text-sm text-gray-500 shadow-theme-xs">
      {message}
    </section>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <section className="rounded-2xl border border-red-100 bg-red-50 px-6 py-8 text-sm font-medium text-red-700 shadow-theme-xs">
      {message}
    </section>
  );
}

export function TeacherModulePage({
  embedded = false,
  module,
  onOpenCourse,
  selectedCourseId,
  token,
}: TeacherModulePageProps) {
  const [data, setData] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showCreate, setShowCreate] = useState(false);
  const [courseStudentIds, setCourseStudentIds] = useState<Set<number>>(new Set());
  const config = MODULE_CONFIG[module];

  useEffect(() => {
    if (module === "recommendations") {
      setIsLoading(false);
      setError(null);
      return;
    }

    let ignore = false;

    setIsLoading(true);
    setError(null);

    getTeacherModuleData(token, module)
      .then((response) => {
        if (ignore) return;
        setData(response.data);
      })
      .catch((requestError: unknown) => {
        if (ignore) return;
        setData(null);
        setError(
          requestError instanceof Error
            ? requestError.message
            : "No se pudo cargar la informacion solicitada.",
        );
      })
      .finally(() => {
        if (!ignore) setIsLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [module, refreshKey, token]);

  useEffect(() => {
    if (!selectedCourseId) {
      setCourseStudentIds(new Set());
      return;
    }

    let ignore = false;
    getTeacherCourseStudents(selectedCourseId)
      .then((students) => {
        if (!ignore) setCourseStudentIds(new Set(students.map((student) => student.id)));
      })
      .catch(() => {
        if (!ignore) setCourseStudentIds(new Set());
      });

    return () => {
      ignore = true;
    };
  }, [selectedCourseId]);

  const items = useMemo(() => {
    const extractedItems = extractItems(data);
    if (!selectedCourseId) return extractedItems;

    return extractedItems.filter((item) => {
      const assignmentId = Number(
        item.asignacion_curso_id ?? item.asignacion_curso ?? item.id,
      );

      if (module === "reports") return assignmentId === selectedCourseId;
      if (item.asignacion_curso_id || item.asignacion_curso) {
        return assignmentId === selectedCourseId;
      }

      const enrollmentId = Number(item.matricula_id ?? item.matricula);
      return enrollmentId > 0 && courseStudentIds.has(enrollmentId);
    });
  }, [courseStudentIds, data, module, selectedCourseId]);
  const metrics = useMemo(() => collectMetrics(data), [data]);
  const columns = useMemo(() => getColumns(module, items), [items, module]);
  const pagination = useClientPagination(items, module === "courses" ? 6 : 10);

  if (module === "recommendations") {
    return (
      <TeacherRecommendationsPage
        embedded={embedded}
        selectedCourseId={selectedCourseId}
      />
    );
  }

  if (module === "tracking") {
    return <FollowUpPage courseId={selectedCourseId} embedded={embedded} role="teacher" />;
  }

  return (
    <div className="space-y-6">
      {!embedded && <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-theme-xs">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-brand-600">Rol Docente</p>
            <h2 className="mt-2 text-2xl font-bold text-gray-900">
              {config.title}
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-600">
              {config.description}
            </p>
          </div>

          <div className="flex gap-2">
            {module === "reports" && <ExportPdfButton filters={{ asignacion_curso: selectedCourseId, tipo: "resumen" }} />}
            <button
              aria-label="Actualizar"
              className="h-11 rounded-lg border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              disabled={isLoading}
              onClick={() => setRefreshKey((value) => value + 1)}
              type="button"
            >
              Actualizar
            </button>
            {isWritableModule(module) && (
              <button
                className="flex h-11 items-center gap-2 rounded-lg bg-brand-500 px-4 text-sm font-semibold text-white hover:bg-brand-600"
                onClick={() => setShowCreate(true)}
                type="button"
              >
                <img alt="" className="h-4 w-4 brightness-0 invert" src="/admin-icons/plus.svg" />
                Nuevo registro
              </button>
            )}
          </div>
        </div>
      </section>}

      {isLoading && (
        <section className="rounded-2xl border border-gray-200 bg-white px-6 py-10 text-center text-sm font-medium text-gray-500 shadow-theme-xs">
          Cargando informacion...
        </section>
      )}

      {!isLoading && error && <ErrorState message={error} />}

      {!isLoading && !error && metrics.length > 0 && (
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
                {formatValue(metric.value)}
              </strong>
            </article>
          ))}
        </section>
      )}

      {!isLoading && !error && items.length === 0 && (
        <EmptyState message={config.empty} />
      )}

      {!isLoading && !error && items.length > 0 && (
        module === "courses" ? <>
          <CourseList items={pagination.pageItems} onOpenCourse={onOpenCourse} />
          <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-theme-xs">
            <PaginationControls
              currentPage={pagination.currentPage}
              itemLabel="cursos"
              onPageChange={pagination.setCurrentPage}
              pageSize={pagination.pageSize}
              totalItems={pagination.totalItems}
              totalPages={pagination.totalPages}
            />
          </section>
        </> : <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-theme-xs">
          <div className="border-b border-gray-100 px-6 py-4">
            <h3 className="text-lg font-bold text-gray-900">
              {items.length} registros
            </h3>
          </div>

          <div className="hidden overflow-x-auto lg:block">
            <table className="min-w-full divide-y divide-gray-100 text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  {columns.map((column) => (
                    <th className="px-6 py-4 font-semibold" key={column}>
                      {formatLabel(column)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pagination.pageItems.map((item, index) => (
                  <tr className="align-top" key={String(item.id ?? index)}>
                    {columns.map((column) => (
                      <td className="max-w-sm px-6 py-4" key={column}>
                        <span className="line-clamp-3 text-gray-700">
                          {formatValue(item[column])}
                        </span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="divide-y divide-gray-100 lg:hidden">
            {pagination.pageItems.map((item, index) => (
              <article className="p-5" key={String(item.id ?? index)}>
                <h3 className="font-bold text-gray-900">
                  {formatValue(getPrimaryText(item, module))}
                </h3>
                <dl className="mt-3 space-y-2 text-sm">
                  {columns.slice(0, 5).map((column) => (
                    <div className="flex justify-between gap-4" key={column}>
                      <dt className="font-medium text-gray-500">
                        {formatLabel(column)}
                      </dt>
                      <dd className="text-right text-gray-800">
                        {formatValue(item[column])}
                      </dd>
                    </div>
                  ))}
                </dl>
              </article>
            ))}
          </div>
          <PaginationControls
            currentPage={pagination.currentPage}
            onPageChange={pagination.setCurrentPage}
            pageSize={pagination.pageSize}
            totalItems={pagination.totalItems}
            totalPages={pagination.totalPages}
          />
        </section>
      )}

      {showCreate && isWritableModule(module) && (
        <TeacherRecordModal
          courseAssignmentId={selectedCourseId}
          module={module}
          onClose={() => setShowCreate(false)}
          onSaved={() => {
            setShowCreate(false);
            setRefreshKey((value) => value + 1);
          }}
        />
      )}
    </div>
  );
}
