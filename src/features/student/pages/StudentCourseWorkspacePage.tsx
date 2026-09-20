import { useEffect, useState } from "react";
import {
  getStudentModuleData,
  type StudentCourse,
  type StudentModuleKey,
} from "../services/studentService";
import { StudentModulePage } from "./StudentModulePage";
import { JustificationsPanel } from "../../justifications/components/JustificationsPanel";

export type StudentCourseSection =
  | "overview"
  | "justifications"
  | Exclude<StudentModuleKey, "courses">;

type Props = {
  courseId: number;
  coursesPath: string;
  initialSection: StudentCourseSection;
  onNavigate: (path: string) => void;
};

const SECTIONS: Array<{ key: StudentCourseSection; label: string; shortLabel: string }> = [
  { key: "overview", label: "Resumen", shortLabel: "RS" },
  { key: "attendance", label: "Mi asistencia", shortLabel: "AS" },
  { key: "justifications", label: "Justificaciones", shortLabel: "JU" },
  { key: "grades", label: "Mis calificaciones", shortLabel: "CA" },
  { key: "participation", label: "Mi participacion", shortLabel: "PA" },
  { key: "tracking", label: "Mi seguimiento", shortLabel: "SE" },
];

const PATHS: Record<StudentCourseSection, string> = {
  attendance: "asistencia",
  justifications: "justificaciones",
  grades: "calificaciones",
  overview: "resumen",
  participation: "participacion",
  tracking: "seguimiento",
};

export function StudentCourseWorkspacePage({
  courseId,
  coursesPath,
  initialSection,
  onNavigate,
}: Props) {
  const [course, setCourse] = useState<StudentCourse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    setIsLoading(true);
    setError(null);
    getStudentModuleData<StudentCourse[]>("courses")
      .then((courses) => {
        if (ignore) return;
        const selected = courses.find((item) => item.id === courseId) ?? null;
        setCourse(selected);
        if (!selected) setError("El curso no existe o ya no esta asignado al estudiante.");
      })
      .catch((requestError: unknown) => {
        if (!ignore) setError(requestError instanceof Error ? requestError.message : "No se pudo abrir el curso.");
      })
      .finally(() => {
        if (!ignore) setIsLoading(false);
      });
    return () => { ignore = true; };
  }, [courseId]);

  const openSection = (section: StudentCourseSection) => {
    onNavigate(`/estudiante/mis-cursos/${courseId}/${PATHS[section]}`);
  };

  if (isLoading) return <section className="rounded-lg border border-gray-200 bg-white px-6 py-12 text-center text-sm text-gray-500">Cargando curso...</section>;

  if (error || !course) return <section className="rounded-lg border border-red-100 bg-red-50 px-6 py-10 text-center"><h2 className="text-lg font-bold text-red-700">No se pudo abrir el curso</h2><p className="mt-2 text-sm text-red-700">{error}</p><button className="mt-5 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-red-700" onClick={() => onNavigate(coursesPath)} type="button">Volver a mis cursos</button></section>;

  return <div className="space-y-5">
    <button className="text-sm font-semibold text-brand-600 hover:text-brand-700" onClick={() => onNavigate(coursesPath)} type="button">&lt; Mis cursos</button>
    <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-theme-xs sm:p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div><div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase text-brand-600"><span>{course.grado_nombre}</span><span aria-hidden="true">/</span><span>Seccion {course.seccion_nombre}</span><span aria-hidden="true">/</span><span>{course.anio_academico}</span></div><h2 className="mt-2 text-2xl font-bold text-gray-900">{course.curso_nombre}</h2><p className="mt-2 text-sm text-gray-600">Docente: <strong className="text-gray-800">{course.docente_nombre}</strong></p></div>
        <div className="rounded-lg bg-green-50 px-4 py-3"><p className="text-xs font-medium text-green-700">Curso activo</p><strong className="mt-1 block text-sm text-green-800">{course.anio_academico}</strong></div>
      </div>
      <div className="mt-6 overflow-x-auto border-t border-gray-100 pt-4"><div className="flex min-w-max gap-2" role="tablist">{SECTIONS.map((section) => <button aria-selected={initialSection === section.key} className={`h-10 rounded-lg px-3 text-sm font-semibold transition ${initialSection === section.key ? "bg-brand-500 text-white" : "bg-gray-50 text-gray-600 hover:bg-brand-50 hover:text-brand-700"}`} key={section.key} onClick={() => openSection(section.key)} role="tab" type="button">{section.label}</button>)}</div></div>
    </section>

    {initialSection === "overview" && <section><h3 className="mb-3 text-base font-bold text-gray-900">Informacion del curso</h3><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{SECTIONS.filter((section) => section.key !== "overview").map((section) => <button className="flex min-h-20 items-center gap-3 rounded-lg border border-gray-200 bg-white p-4 text-left shadow-theme-xs transition hover:border-brand-200 hover:bg-brand-50" key={section.key} onClick={() => openSection(section.key)} type="button"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-xs font-bold text-brand-700">{section.shortLabel}</span><span className="text-sm font-semibold text-gray-800">{section.label}</span></button>)}</div></section>}

    {initialSection === "justifications" && (
      <JustificationsPanel assignmentId={courseId} role="student" />
    )}
    {initialSection !== "overview" && initialSection !== "justifications" && <StudentModulePage embedded module={initialSection} selectedCourseId={courseId} selectedCourseName={course.curso_nombre} />}
  </div>;
}
