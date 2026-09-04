import { useEffect, useMemo, useState } from "react";
import { PaginationControls } from "../../../shared/components/PaginationControls";
import { useClientPagination } from "../../../shared/hooks/useClientPagination";
import {
  getTeacherCourseCriteria,
  getTeacherCoursePeriods,
  getTeacherCourseStudents,
  getTeacherGradeRecords,
  registerTeacherGrades,
} from "../services/teacherService";
import type {
  GradePayload,
  TeacherCourse,
  TeacherCriterion,
  TeacherGradeRecord,
  TeacherPeriod,
  TeacherStudent,
} from "../services/teacherService";

type GradeValue = GradePayload["registros"][number]["valor"];

type Props = {
  course: TeacherCourse;
};

function criterionLabel(criterion: TeacherCriterion) {
  return [
    criterion.nombre ?? criterion.criterio_nombre ?? `Criterio ${criterion.id}`,
    criterion.capacidad_nombre,
    criterion.competencia_nombre,
  ]
    .filter(Boolean)
    .join(" / ");
}

function message(error: unknown) {
  return error instanceof Error ? error.message : "No se pudieron guardar las calificaciones.";
}

export function TeacherGradesPage({ course }: Props) {
  const [students, setStudents] = useState<TeacherStudent[]>([]);
  const [periods, setPeriods] = useState<TeacherPeriod[]>([]);
  const [criteria, setCriteria] = useState<TeacherCriterion[]>([]);
  const [records, setRecords] = useState<TeacherGradeRecord[]>([]);
  const [periodId, setPeriodId] = useState("");
  const [criterionId, setCriterionId] = useState("");
  const [grades, setGrades] = useState<Record<number, GradeValue | "">>({});
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [isDirty, setIsDirty] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    setIsLoading(true);
    Promise.all([
      getTeacherCourseStudents(course.id),
      getTeacherCoursePeriods(course.id),
      getTeacherCourseCriteria(course.id),
      getTeacherGradeRecords(),
    ])
      .then(([studentItems, periodItems, criterionItems, gradeItems]) => {
        if (ignore) return;
        setStudents(studentItems);
        setPeriods(periodItems);
        setCriteria(criterionItems);
        setRecords(gradeItems.filter((item) => item.asignacion_curso_id === course.id));
        setPeriodId(periodItems[0] ? String(periodItems[0].id) : "");
        setCriterionId(criterionItems[0] ? String(criterionItems[0].id) : "");
      })
      .catch((requestError) => setError(message(requestError)))
      .finally(() => {
        if (!ignore) setIsLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [course.id]);

  const selectedRecords = useMemo(
    () =>
      records.filter(
        (record) =>
          record.periodo_academico_id === Number(periodId) &&
          record.criterio_calificacion_id === Number(criterionId),
      ),
    [criterionId, periodId, records],
  );

  useEffect(() => {
    const byEnrollment = new Map(
      selectedRecords.map((record) => [record.matricula_id, record]),
    );
    setGrades(
      Object.fromEntries(
        students.map((student) => [
          student.id,
          byEnrollment.get(student.id)?.valor ?? "",
        ]),
      ),
    );
    setNotes(
      Object.fromEntries(
        students.map((student) => [
          student.id,
          byEnrollment.get(student.id)?.observacion ?? "",
        ]),
      ),
    );
    setIsDirty(false);
    setSuccess(null);
  }, [selectedRecords, students]);

  const saveGrades = async () => {
    if (!periodId) {
      setError("Selecciona un periodo academico.");
      return;
    }
    if (!criterionId) {
      setError("Selecciona un criterio de calificacion.");
      return;
    }
    if (students.some((student) => !grades[student.id])) {
      setError("Asigna una calificacion a todos los estudiantes.");
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      await registerTeacherGrades({
        asignacion_curso: course.id,
        periodo_academico: Number(periodId),
        criterio_calificacion: Number(criterionId),
        registros: students.map((student) => ({
          matricula: student.id,
          valor: grades[student.id] as GradeValue,
          observacion: notes[student.id]?.trim() || null,
        })),
      });
      const latest = await getTeacherGradeRecords();
      setRecords(latest.filter((item) => item.asignacion_curso_id === course.id));
      setIsDirty(false);
      setSuccess("Calificaciones guardadas correctamente.");
    } catch (requestError) {
      setError(message(requestError));
    } finally {
      setIsSaving(false);
    }
  };

  const inputClass = "h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-50 disabled:bg-gray-50";
  const pagination = useClientPagination(students);

  return (
    <div className="space-y-4">
      <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-theme-xs">
        <div className="grid gap-4 lg:grid-cols-[1fr_1.5fr_auto] lg:items-end">
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">Periodo academico</label>
            <select className={inputClass} disabled={isLoading || isSaving} onChange={(event) => { setPeriodId(event.target.value); setError(null); }} value={periodId}>
              <option value="">Seleccionar periodo</option>
              {periods.map((period) => <option key={period.id} value={period.id}>{period.nombre} - {period.estado_label}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">Criterio de calificacion</label>
            <select className={inputClass} disabled={isLoading || isSaving} onChange={(event) => { setCriterionId(event.target.value); setError(null); }} value={criterionId}>
              <option value="">Seleccionar criterio</option>
              {criteria.map((criterion) => <option key={criterion.id} value={criterion.id}>{criterionLabel(criterion)}</option>)}
            </select>
          </div>
          <button className="h-11 rounded-lg bg-brand-500 px-5 text-sm font-semibold text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50" disabled={isLoading || isSaving || students.length === 0 || !isDirty} onClick={saveGrades} type="button">{isSaving ? "Guardando..." : "Guardar calificaciones"}</button>
        </div>
      </section>

      {error && <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {success && <div className="rounded-lg border border-green-100 bg-green-50 px-4 py-3 text-sm text-green-700">{success}</div>}

      {!isLoading && criteria.length === 0 && <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">Este curso no tiene criterios de calificacion configurados.</div>}

      {isLoading ? (
        <section className="rounded-lg border border-gray-200 bg-white px-6 py-10 text-center text-sm text-gray-500">Cargando calificaciones...</section>
      ) : students.length === 0 ? (
        <section className="rounded-lg border border-dashed border-gray-200 bg-white px-6 py-10 text-center text-sm text-gray-500">No hay estudiantes matriculados en este curso.</section>
      ) : (
        <section className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-theme-xs">
          <div className="border-b border-gray-100 px-5 py-4"><h3 className="font-bold text-gray-900">Registro por criterio</h3><p className="mt-1 text-xs text-gray-500">AD: logro destacado, A: logro esperado, B: en proceso, C: en inicio.</p></div>
          <div className="overflow-x-auto">
            <table className="min-w-[760px] table-fixed text-left text-sm">
              <thead className="bg-gray-50"><tr><th className="w-72 px-5 py-3 font-semibold text-gray-600">Estudiante</th><th className="w-52 px-5 py-3 font-semibold text-gray-600">Calificacion</th><th className="px-5 py-3 font-semibold text-gray-600">Observacion</th></tr></thead>
              <tbody className="divide-y divide-gray-100">{pagination.pageItems.map((student) => <tr key={student.id}><td className="px-5 py-4"><p className="font-semibold text-gray-900">{student.estudiante_nombre}</p><p className="mt-1 text-xs text-gray-500">{student.codigo_estudiante}</p></td><td className="px-5 py-4"><select aria-label={`Calificacion de ${student.estudiante_nombre}`} className={inputClass} disabled={!criterionId || !periodId || isSaving} onChange={(event) => { setGrades((current) => ({ ...current, [student.id]: event.target.value as GradeValue | "" })); setIsDirty(true); setSuccess(null); }} value={grades[student.id] ?? ""}><option value="">Seleccionar</option><option value="AD">AD - Logro destacado</option><option value="A">A - Logro esperado</option><option value="B">B - En proceso</option><option value="C">C - En inicio</option></select></td><td className="px-5 py-4"><input aria-label={`Observacion de ${student.estudiante_nombre}`} className={inputClass} disabled={!criterionId || !periodId || isSaving} maxLength={500} onChange={(event) => { setNotes((current) => ({ ...current, [student.id]: event.target.value })); setIsDirty(true); setSuccess(null); }} placeholder="Observacion opcional" value={notes[student.id] ?? ""} /></td></tr>)}</tbody>
            </table>
          </div>
          <PaginationControls currentPage={pagination.currentPage} isLoading={isSaving} itemLabel="estudiantes" onPageChange={pagination.setCurrentPage} pageSize={pagination.pageSize} totalItems={pagination.totalItems} totalPages={pagination.totalPages} />
        </section>
      )}
    </div>
  );
}
