import { useEffect, useState } from "react";
import {
  extractGuardianCourses,
  extractGuardianStudents,
  getGuardianModuleData,
  type GuardianCourse,
  type GuardianStudent,
} from "../services/guardianService";

type Props = {
  onNavigate: (path: string) => void;
  studentId: number;
  studentsPath: string;
};

export function GuardianStudentWorkspacePage({
  onNavigate,
  studentId,
  studentsPath,
}: Props) {
  const [student, setStudent] = useState<GuardianStudent | null>(null);
  const [courses, setCourses] = useState<GuardianCourse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        const students = extractGuardianStudents(studentResponse);
        const selected =
          students.find((item) => Number(item.estudiante_id) === studentId) ??
          null;
        setStudent(selected);
        if (!selected) {
          setCourses([]);
          setError("El estudiante no existe o ya no esta vinculado a tu cuenta.");
          return;
        }
        setCourses(
          extractGuardianCourses(
            studentId,
            attendanceResponse,
            gradeResponse,
            selected.matriculas_activas_detalle,
          ),
        );
      })
      .catch((requestError: unknown) => {
        if (!ignore) setError(requestError instanceof Error ? requestError.message : "No se pudo abrir el estudiante.");
      })
      .finally(() => {
        if (!ignore) setIsLoading(false);
      });
    return () => { ignore = true; };
  }, [studentId]);

  const openCourse = (courseId: number) => {
    onNavigate(
      `/apoderado/mis-estudiantes/${studentId}/cursos/${courseId}/resumen`,
    );
  };

  if (isLoading) return <section className="rounded-lg border border-gray-200 bg-white px-6 py-12 text-center text-sm text-gray-500">Cargando estudiante...</section>;
  if (error || !student) return <section className="rounded-lg border border-red-100 bg-red-50 px-6 py-10 text-center"><h2 className="text-lg font-bold text-red-700">No se pudo abrir el estudiante</h2><p className="mt-2 text-sm text-red-700">{error}</p><button className="mt-5 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-red-700" onClick={() => onNavigate(studentsPath)} type="button">Volver a mis estudiantes</button></section>;

  return <div className="space-y-5">
    <button className="text-sm font-semibold text-brand-600 hover:text-brand-700" onClick={() => onNavigate(studentsPath)} type="button">&lt; Mis estudiantes</button>
    <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-theme-xs sm:p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between"><div><p className="text-xs font-semibold uppercase text-brand-600">{student.codigo_estudiante}</p><h2 className="mt-2 text-2xl font-bold text-gray-900">{student.estudiante_nombre}</h2><p className="mt-2 text-sm text-gray-600">Parentesco: <strong className="text-gray-800">{student.parentesco_label}</strong></p></div><div className="flex gap-3"><div className="rounded-lg bg-gray-50 px-4 py-3"><p className="text-xs text-gray-500">Matriculas activas</p><strong className="mt-1 block text-lg text-gray-900">{student.matriculas_activas || "-"}</strong></div>{student.es_principal && <div className="rounded-lg bg-green-50 px-4 py-3"><p className="text-xs text-green-700">Vinculo</p><strong className="mt-1 block text-sm text-green-800">Principal</strong></div>}</div></div>
    </section>
    <section><div className="mb-3"><h3 className="text-base font-bold text-gray-900">Cursos del estudiante</h3><p className="mt-1 text-sm text-gray-500">Selecciona un curso para consultar su informacion academica.</p></div>{courses.length === 0 ? <div className="rounded-lg border border-dashed border-gray-200 bg-white px-6 py-10 text-center text-sm text-gray-500">Todavia no hay cursos con informacion academica disponible.</div> : <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{courses.map((course) => <article className="rounded-lg border border-gray-200 bg-white p-5 shadow-theme-xs" key={course.id}><div><p className="text-xs font-semibold uppercase text-brand-600">Curso asignado</p><h4 className="mt-2 text-lg font-bold text-gray-900">{course.curso_nombre}</h4></div><div className="mt-5 border-t border-gray-100 pt-4"><button className="w-full rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600" onClick={() => openCourse(course.id)} type="button">Abrir curso</button></div></article>)}</div>}</section>
  </div>;
}
