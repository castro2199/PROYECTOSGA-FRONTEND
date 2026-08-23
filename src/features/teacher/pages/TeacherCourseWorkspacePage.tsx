import { useEffect, useState } from "react";
import {
  getTeacherCourses,
  getTeacherCourseStudents,
} from "../services/teacherService";
import type {
  TeacherCourse,
  TeacherModuleKey,
  TeacherStudent,
} from "../services/teacherService";
import { TeacherAttendancePage } from "./TeacherAttendancePage";
import { TeacherGradesPage } from "./TeacherGradesPage";
import { TeacherModulePage } from "./TeacherModulePage";

export type TeacherCourseSection =
  | "overview"
  | "students"
  | Exclude<TeacherModuleKey, "courses">;

type Props = {
  courseId: number;
  coursesPath: string;
  initialSection: TeacherCourseSection;
  onNavigate: (path: string) => void;
  token: string;
};

const SECTIONS: Array<{
  key: TeacherCourseSection;
  label: string;
  shortLabel: string;
}> = [
  { key: "overview", label: "Resumen del curso", shortLabel: "RS" },
  { key: "students", label: "Estudiantes", shortLabel: "ES" },
  { key: "attendance", label: "Asistencia", shortLabel: "AS" },
  { key: "grades", label: "Calificaciones", shortLabel: "CA" },
  { key: "participations", label: "Participaciones", shortLabel: "PA" },
  { key: "observations", label: "Observaciones", shortLabel: "OB" },
  { key: "tracking", label: "Seguimiento", shortLabel: "SE" },
  { key: "recommendations", label: "Recomendaciones IA", shortLabel: "IA" },
  { key: "reports", label: "Reportes", shortLabel: "RE" },
];

const SECTION_PATHS: Record<TeacherCourseSection, string> = {
  attendance: "asistencia",
  grades: "calificaciones",
  observations: "observaciones",
  overview: "resumen",
  participations: "participaciones",
  recommendations: "recomendaciones-ia",
  reports: "reportes",
  students: "estudiantes",
  tracking: "seguimiento",
};

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "No se pudo cargar el curso.";
}

export function TeacherCourseWorkspacePage({
  courseId,
  coursesPath,
  initialSection,
  onNavigate,
  token,
}: Props) {
  const [course, setCourse] = useState<TeacherCourse | null>(null);
  const [students, setStudents] = useState<TeacherStudent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    setIsLoading(true);
    setError(null);

    Promise.all([getTeacherCourses(), getTeacherCourseStudents(courseId)])
      .then(([courses, studentItems]) => {
        if (ignore) return;
        const selectedCourse = courses.find((item) => item.id === courseId) ?? null;
        setCourse(selectedCourse);
        setStudents(studentItems);
        if (!selectedCourse) setError("El curso no existe o ya no esta asignado al docente.");
      })
      .catch((requestError) => {
        if (!ignore) setError(errorMessage(requestError));
      })
      .finally(() => {
        if (!ignore) setIsLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [courseId]);

  const openSection = (section: TeacherCourseSection) => {
    onNavigate(`/docente/mis-cursos/${courseId}/${SECTION_PATHS[section]}`);
  };

  if (isLoading) {
    return <section className="rounded-lg border border-gray-200 bg-white px-6 py-12 text-center text-sm font-medium text-gray-500">Cargando curso...</section>;
  }

  if (error || !course) {
    return (
      <section className="rounded-lg border border-red-100 bg-red-50 px-6 py-10 text-center">
        <h2 className="text-lg font-bold text-red-700">No se pudo abrir el curso</h2>
        <p className="mt-2 text-sm text-red-700">{error}</p>
        <button className="mt-5 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-red-700" onClick={() => onNavigate(coursesPath)} type="button">Volver a mis cursos</button>
      </section>
    );
  }

  return (
    <div className="space-y-5">
      <button className="text-sm font-semibold text-brand-600 hover:text-brand-700" onClick={() => onNavigate(coursesPath)} type="button">&lt; Mis cursos</button>

      <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-theme-xs sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase text-brand-600">
              <span>{course.grado_nombre}</span>
              <span aria-hidden="true">/</span>
              <span>Seccion {course.seccion_nombre}</span>
              <span aria-hidden="true">/</span>
              <span>{course.anio_academico}</span>
            </div>
            <h2 className="mt-2 text-2xl font-bold text-gray-900">{course.curso_nombre}</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-600">{course.curso_descripcion || "Curso asignado al docente."}</p>
          </div>
          <div className="flex gap-3">
            <div className="min-w-28 rounded-lg bg-gray-50 px-4 py-3">
              <p className="text-xs font-medium text-gray-500">Estudiantes</p>
              <strong className="mt-1 block text-2xl text-gray-900">{course.estudiantes_matriculados}</strong>
            </div>
            <div className="min-w-24 rounded-lg bg-green-50 px-4 py-3">
              <p className="text-xs font-medium text-green-700">Estado</p>
              <strong className="mt-2 block text-sm text-green-800">{course.estado_label}</strong>
            </div>
          </div>
        </div>

        <div className="mt-6 overflow-x-auto border-t border-gray-100 pt-4">
          <div className="flex min-w-max gap-2" role="tablist">
            {SECTIONS.map((section) => (
              <button
                aria-selected={initialSection === section.key}
                className={`h-10 rounded-lg px-3 text-sm font-semibold transition ${initialSection === section.key ? "bg-brand-500 text-white" : "bg-gray-50 text-gray-600 hover:bg-brand-50 hover:text-brand-700"}`}
                key={section.key}
                onClick={() => openSection(section.key)}
                role="tab"
                type="button"
              >
                {section.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {initialSection === "overview" && (
        <section>
          <h3 className="mb-3 text-base font-bold text-gray-900">Gestion del curso</h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {SECTIONS.filter((section) => section.key !== "overview").map((section) => (
              <button className="flex min-h-20 items-center gap-3 rounded-lg border border-gray-200 bg-white p-4 text-left shadow-theme-xs transition hover:border-brand-200 hover:bg-brand-50" key={section.key} onClick={() => openSection(section.key)} type="button">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-xs font-bold text-brand-700">{section.shortLabel}</span>
                <span className="text-sm font-semibold text-gray-800">{section.label}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {initialSection === "students" && (
        students.length === 0 ? (
          <section className="rounded-lg border border-dashed border-gray-200 bg-white px-6 py-10 text-center text-sm text-gray-500">No hay estudiantes matriculados en este curso.</section>
        ) : (
          <section className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-theme-xs">
            <div className="border-b border-gray-100 px-5 py-4"><h3 className="font-bold text-gray-900">{students.length} estudiantes</h3></div>
            <div className="divide-y divide-gray-100">{students.map((student) => <article className="grid gap-1 px-5 py-4 sm:grid-cols-[1fr_auto] sm:items-center" key={student.id}><div><p className="font-semibold text-gray-900">{student.estudiante_nombre}</p><p className="mt-1 text-sm text-gray-500">{student.codigo_estudiante}</p></div><p className="text-sm text-gray-500">Matricula: {new Date(`${student.fecha_matricula}T00:00:00`).toLocaleDateString("es-PE")}</p></article>)}</div>
          </section>
        )
      )}

      {initialSection === "attendance" && (
        <TeacherAttendancePage course={course} />
      )}

      {initialSection === "grades" && <TeacherGradesPage course={course} />}

      {initialSection !== "overview" &&
        initialSection !== "students" &&
        initialSection !== "attendance" &&
        initialSection !== "grades" && (
        <TeacherModulePage embedded module={initialSection} selectedCourseId={courseId} token={token} />
      )}
    </div>
  );
}
