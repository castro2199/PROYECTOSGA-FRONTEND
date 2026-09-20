import { useEffect, useState } from "react";
import {
  extractGuardianCourses,
  extractGuardianStudents,
  getGuardianModuleData,
  type GuardianCourse,
  type GuardianModuleKey,
  type GuardianStudent,
} from "../services/guardianService";
import { GuardianModulePage } from "./GuardianModulePage";
import { JustificationsPanel } from "../../justifications/components/JustificationsPanel";

export type GuardianCourseSection =
  | "overview"
  | "justifications"
  | Extract<GuardianModuleKey, "attendance" | "grades" | "tracking">;

type Props = {
  courseId: number;
  initialSection: GuardianCourseSection;
  onNavigate: (path: string) => void;
  studentId: number;
};

const SECTIONS: Array<{
  key: GuardianCourseSection;
  label: string;
  shortLabel: string;
}> = [
  { key: "overview", label: "Resumen", shortLabel: "RS" },
  { key: "attendance", label: "Asistencia", shortLabel: "AS" },
  { key: "justifications", label: "Justificaciones", shortLabel: "JU" },
  { key: "grades", label: "Calificaciones", shortLabel: "CA" },
  { key: "tracking", label: "Seguimiento", shortLabel: "SE" },
];

const PATHS: Record<GuardianCourseSection, string> = {
  attendance: "asistencia",
  grades: "calificaciones",
  justifications: "justificaciones",
  overview: "resumen",
  tracking: "seguimiento",
};

export function GuardianCourseWorkspacePage({
  courseId,
  initialSection,
  onNavigate,
  studentId,
}: Props) {
  const [course, setCourse] = useState<GuardianCourse | null>(null);
  const [student, setStudent] = useState<GuardianStudent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const studentPath = `/apoderado/mis-estudiantes/${studentId}/resumen`;

  useEffect(() => {
    let ignore = false;
    setIsLoading(true);
    setError(null);

    Promise.all([
      getGuardianModuleData<unknown>("students"),
      getGuardianModuleData<unknown>("attendance", studentId),
      getGuardianModuleData<unknown>("grades", studentId),
    ])
      .then(([studentResponse, attendanceResponse, gradeResponse]) => {
        if (ignore) return;
        const selectedStudent =
          extractGuardianStudents(studentResponse).find(
            (item) => Number(item.estudiante_id) === studentId,
          ) ?? null;

        if (!selectedStudent) {
          setError("El estudiante ya no esta vinculado a tu cuenta.");
          return;
        }

        const selectedCourse =
          extractGuardianCourses(
            studentId,
            attendanceResponse,
            gradeResponse,
            selectedStudent.matriculas_activas_detalle,
          ).find((item) => item.id === courseId) ?? null;

        setStudent(selectedStudent);
        setCourse(selectedCourse);
        if (!selectedCourse) {
          setError("El curso no existe o no pertenece a este estudiante.");
        }
      })
      .catch((requestError: unknown) => {
        if (!ignore) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : "No se pudo abrir el curso.",
          );
        }
      })
      .finally(() => {
        if (!ignore) setIsLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [courseId, studentId]);

  const openSection = (section: GuardianCourseSection) => {
    onNavigate(
      `/apoderado/mis-estudiantes/${studentId}/cursos/${courseId}/${PATHS[section]}`,
    );
  };

  if (isLoading) {
    return (
      <section className="rounded-lg border border-gray-200 bg-white px-6 py-12 text-center text-sm text-gray-500">
        Cargando curso...
      </section>
    );
  }

  if (error || !course || !student) {
    return (
      <section className="rounded-lg border border-red-100 bg-red-50 px-6 py-10 text-center">
        <h2 className="text-lg font-bold text-red-700">
          No se pudo abrir el curso
        </h2>
        <p className="mt-2 text-sm text-red-700">{error}</p>
        <button
          className="mt-5 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-red-700"
          onClick={() => onNavigate(studentPath)}
          type="button"
        >
          Volver al estudiante
        </button>
      </section>
    );
  }

  return (
    <div className="space-y-5">
      <button
        className="text-sm font-semibold text-brand-600 hover:text-brand-700"
        onClick={() => onNavigate(studentPath)}
        type="button"
      >
        &lt; Cursos de {student.estudiante_nombre}
      </button>

      <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-theme-xs sm:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase text-brand-600">
              {student.codigo_estudiante}
            </p>
            <h2 className="mt-2 text-2xl font-bold text-gray-900">
              {course.curso_nombre}
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Estudiante: <strong>{student.estudiante_nombre}</strong>
            </p>
          </div>
          <span className="rounded-lg bg-green-50 px-3 py-2 text-xs font-semibold text-green-700">
            Solo consulta
          </span>
        </div>

        <div className="mt-6 overflow-x-auto border-t border-gray-100 pt-4">
          <div className="flex min-w-max gap-2" role="tablist">
            {SECTIONS.map((section) => (
              <button
                aria-selected={initialSection === section.key}
                className={`h-10 rounded-lg px-3 text-sm font-semibold ${
                  initialSection === section.key
                    ? "bg-brand-500 text-white"
                    : "bg-gray-50 text-gray-600 hover:bg-brand-50 hover:text-brand-700"
                }`}
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
          <h3 className="mb-3 text-base font-bold text-gray-900">
            Informacion del curso
          </h3>
          <div className="grid gap-3 sm:grid-cols-3">
            {SECTIONS.filter((section) => section.key !== "overview").map(
              (section) => (
                <button
                  className="flex min-h-20 items-center gap-3 rounded-lg border border-gray-200 bg-white p-4 text-left shadow-theme-xs hover:border-brand-200 hover:bg-brand-50"
                  key={section.key}
                  onClick={() => openSection(section.key)}
                  type="button"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-xs font-bold text-brand-700">
                    {section.shortLabel}
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-gray-800">
                      {section.label}
                    </span>
                    {section.key === "attendance" && (
                      <span className="mt-1 block text-xs text-gray-500">
                        {course.asistencias} registros
                      </span>
                    )}
                    {section.key === "grades" && (
                      <span className="mt-1 block text-xs text-gray-500">
                        {course.calificaciones} registros
                      </span>
                    )}
                  </span>
                </button>
              ),
            )}
          </div>
        </section>
      )}

      {initialSection === "justifications" && (
        <JustificationsPanel
          assignmentId={courseId}
          role="guardian"
          studentId={studentId}
        />
      )}

      {initialSection !== "overview" && initialSection !== "justifications" && (
        <GuardianModulePage
          embedded
          module={initialSection}
          selectedCourseId={courseId}
          selectedCourseName={course.curso_nombre}
          selectedStudentId={studentId}
        />
      )}
    </div>
  );
}
