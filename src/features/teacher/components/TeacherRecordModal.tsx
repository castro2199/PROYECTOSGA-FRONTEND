import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import {
  generateTeacherRecommendation,
  getTeacherCourseCriteria,
  getTeacherCoursePeriods,
  getTeacherCourses,
  getTeacherCourseStudents,
  registerTeacherAttendance,
  registerTeacherGrades,
  registerTeacherObservation,
  registerTeacherParticipation,
} from "../services/teacherService";
import type {
  AttendancePayload,
  GradePayload,
  TeacherCourse,
  TeacherCriterion,
  TeacherModuleKey,
  TeacherPeriod,
  TeacherStudent,
} from "../services/teacherService";

type WritableModule = Extract<
  TeacherModuleKey,
  "attendance" | "grades" | "participations" | "observations" | "recommendations"
>;

type Props = {
  courseAssignmentId?: number;
  module: WritableModule;
  onClose: () => void;
  onSaved: () => void;
};

const TITLES: Record<WritableModule, string> = {
  attendance: "Registrar asistencia",
  grades: "Registrar calificaciones",
  participations: "Nueva participacion",
  observations: "Nueva observacion",
  recommendations: "Generar recomendacion IA",
};

function localDateTime() {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "No se pudo guardar el registro.";
}

function criterionLabel(criterion: TeacherCriterion) {
  return [
    criterion.nombre ?? criterion.criterio_nombre ?? `Criterio ${criterion.id}`,
    criterion.capacidad_nombre,
    criterion.competencia_nombre,
  ]
    .filter(Boolean)
    .join(" / ");
}

export function TeacherRecordModal({
  courseAssignmentId,
  module,
  onClose,
  onSaved,
}: Props) {
  const [courses, setCourses] = useState<TeacherCourse[]>([]);
  const [students, setStudents] = useState<TeacherStudent[]>([]);
  const [periods, setPeriods] = useState<TeacherPeriod[]>([]);
  const [criteria, setCriteria] = useState<TeacherCriterion[]>([]);
  const [courseId, setCourseId] = useState(
    courseAssignmentId ? String(courseAssignmentId) : "",
  );
  const [studentId, setStudentId] = useState("");
  const [periodId, setPeriodId] = useState("");
  const [criterionId, setCriterionId] = useState("");
  const [date, setDate] = useState(localDateTime());
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [participationType, setParticipationType] = useState("ORAL");
  const [value, setValue] = useState("");
  const [attendance, setAttendance] = useState<Record<number, string>>({});
  const [attendanceNotes, setAttendanceNotes] = useState<Record<number, string>>({});
  const [grades, setGrades] = useState<Record<number, string>>({});
  const [gradeNotes, setGradeNotes] = useState<Record<number, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    getTeacherCourses()
      .then((items) => {
        const active = items.filter((item) => item.estado === 1);
        setCourses(active);
      })
      .catch((requestError) => setError(errorMessage(requestError)))
      .finally(() => setIsLoading(false));
  }, [courseAssignmentId]);

  useEffect(() => {
    setStudentId("");
    setPeriodId("");
    setCriterionId("");
    setStudents([]);
    setPeriods([]);
    setCriteria([]);
    setAttendance({});
    setAttendanceNotes({});
    setGrades({});
    setGradeNotes({});

    if (!courseId) {
      return;
    }

    let ignore = false;
    setIsLoading(true);
    setError(null);
    Promise.all([
      getTeacherCourseStudents(Number(courseId)),
      getTeacherCoursePeriods(Number(courseId)),
      getTeacherCourseCriteria(Number(courseId)),
    ])
      .then(([studentItems, periodItems, criterionItems]) => {
        if (ignore) return;
        setStudents(studentItems);
        setPeriods(periodItems);
        setCriteria(criterionItems);
        setStudentId(studentItems[0] ? String(studentItems[0].id) : "");
        setPeriodId(periodItems[0] ? String(periodItems[0].id) : "");
        setCriterionId(criterionItems[0] ? String(criterionItems[0].id) : "");
        setAttendance(
          Object.fromEntries(studentItems.map((student) => [student.id, "PRESENTE"])),
        );
        setGrades(Object.fromEntries(studentItems.map((student) => [student.id, ""])));
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

  const selectedCourse = courses.find((course) => String(course.id) === courseId);
  const needsStudent = ["participations", "observations", "recommendations"].includes(module);
  const hasRequiredData = useMemo(() => {
    if (!courseId || students.length === 0) return false;
    if (module === "grades" && (!periodId || !criterionId)) return false;
    if (module === "recommendations" && !periodId) return false;
    if (needsStudent && !studentId) return false;
    return true;
  }, [courseId, criterionId, module, needsStudent, periodId, studentId, students.length]);

  const validate = () => {
    if (!courseId) return "Selecciona un curso.";
    if (students.length === 0) return "El curso no tiene estudiantes matriculados.";
    if (module === "grades" && !periodId) return "Selecciona un periodo academico.";
    if (module === "grades" && !criterionId) return "El curso no tiene criterios de calificacion disponibles.";
    if (module === "recommendations" && !periodId) return "Selecciona un periodo academico.";
    if (needsStudent && !studentId) return "Selecciona un estudiante.";
    if (["attendance", "participations", "observations"].includes(module) && !date) {
      return "Selecciona una fecha valida.";
    }
    if (module === "grades" && students.some((student) => !grades[student.id])) {
      return "Asigna una calificacion a cada estudiante.";
    }
    if (
      module === "attendance" &&
      students.some(
        (student) =>
          attendance[student.id] === "JUSTIFICADA" &&
          !attendanceNotes[student.id]?.trim(),
      )
    ) {
      return "Ingresa la justificacion de cada asistencia justificada.";
    }
    if (module === "observations" && !category.trim()) return "Ingresa una categoria.";
    if (module === "observations" && !description.trim()) return "Ingresa la descripcion.";
    return null;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      if (module === "attendance") {
        await registerTeacherAttendance({
          asignacion_curso: Number(courseId),
          fecha: date.slice(0, 10),
          registros: students.map((student) => ({
            matricula: student.id,
            estado: attendance[student.id] as AttendancePayload["registros"][number]["estado"],
            justificacion: attendanceNotes[student.id]?.trim() || null,
          })),
        });
      } else if (module === "grades") {
        await registerTeacherGrades({
          asignacion_curso: Number(courseId),
          periodo_academico: Number(periodId),
          criterio_calificacion: Number(criterionId),
          registros: students.map((student) => ({
            matricula: student.id,
            valor: grades[student.id] as GradePayload["registros"][number]["valor"],
            observacion: gradeNotes[student.id]?.trim() || null,
          })),
        });
      } else if (module === "participations") {
        await registerTeacherParticipation({
          asignacion_curso: Number(courseId),
          matricula: Number(studentId),
          periodo_academico: periodId ? Number(periodId) : null,
          fecha: new Date(date).toISOString(),
          tipo: participationType,
          valor: value.trim() || null,
          observacion: description.trim() || null,
        });
      } else if (module === "observations") {
        await registerTeacherObservation({
          asignacion_curso: Number(courseId),
          matricula: Number(studentId),
          fecha: new Date(date).toISOString(),
          categoria: category.trim(),
          descripcion: description.trim(),
        });
      } else {
        await generateTeacherRecommendation({
          asignacion_curso: Number(courseId),
          matricula: Number(studentId),
          periodo_academico: Number(periodId),
        });
      }
      onSaved();
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setIsSaving(false);
    }
  };

  const inputClass = "h-11 w-full rounded-lg border border-gray-200 bg-white px-4 text-sm outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-50 disabled:bg-gray-50";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/50 px-4 py-6">
      <div className="max-h-full w-full max-w-4xl overflow-y-auto rounded-lg bg-white shadow-theme-xl">
        <div className="flex items-start justify-between border-b border-gray-100 px-6 py-5">
          <div>
            <p className="text-sm font-semibold text-brand-600">Rol Docente</p>
            <h2 className="mt-1 text-xl font-bold text-gray-900">{TITLES[module]}</h2>
          </div>
          <button aria-label="Cerrar" className="h-9 w-9 rounded-lg text-xl text-gray-500 hover:bg-gray-100" disabled={isSaving} onClick={onClose} type="button">x</button>
        </div>

        <form className="space-y-5 p-6" onSubmit={handleSubmit}>
          {!courseAssignmentId && (
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">Curso</label>
              <select className={inputClass} disabled={isLoading || isSaving} onChange={(event) => setCourseId(event.target.value)} value={courseId}>
                <option value="">Seleccionar curso</option>
                {courses.map((course) => <option key={course.id} value={course.id}>{course.curso_nombre} / {course.grado_nombre} {course.seccion_nombre} / {course.anio_academico}</option>)}
              </select>
            </div>
          )}

          {selectedCourse && (
            <div className="grid gap-3 rounded-lg bg-gray-50 p-4 text-sm text-gray-700 sm:grid-cols-3">
              <span><strong>Grado:</strong> {selectedCourse.grado_nombre}</span>
              <span><strong>Seccion:</strong> {selectedCourse.seccion_nombre}</span>
              <span><strong>Matriculados:</strong> {selectedCourse.estudiantes_matriculados}</span>
            </div>
          )}

          {needsStudent && (
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">Estudiante</label>
              <select className={inputClass} disabled={isLoading || isSaving} onChange={(event) => setStudentId(event.target.value)} value={studentId}>
                <option value="">Seleccionar estudiante</option>
                {students.map((student) => <option key={student.id} value={student.id}>{student.codigo_estudiante} - {student.estudiante_nombre}</option>)}
              </select>
            </div>
          )}

          {(module === "grades" || module === "participations" || module === "recommendations") && (
            <div className={module === "grades" ? "grid gap-4 sm:grid-cols-2" : ""}>
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">Periodo academico</label>
                <select className={inputClass} disabled={isLoading || isSaving} onChange={(event) => setPeriodId(event.target.value)} value={periodId}>
                  {module === "participations" && <option value="">Sin periodo especifico</option>}
                  {periods.map((period) => <option key={period.id} value={period.id}>{period.nombre} - {period.estado_label}</option>)}
                </select>
              </div>
              {module === "grades" && <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">Criterio de calificacion</label>
                <select className={inputClass} disabled={isLoading || isSaving} onChange={(event) => setCriterionId(event.target.value)} value={criterionId}>
                  <option value="">Seleccionar criterio</option>
                  {criteria.map((criterion) => <option key={criterion.id} value={criterion.id}>{criterionLabel(criterion)}</option>)}
                </select>
              </div>}
            </div>
          )}

          {["attendance", "participations", "observations"].includes(module) && (
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">Fecha</label>
              <input className={inputClass} disabled={isSaving} max={localDateTime()} onChange={(event) => setDate(event.target.value)} type={module === "attendance" ? "date" : "datetime-local"} value={module === "attendance" ? date.slice(0, 10) : date} />
            </div>
          )}

          {module === "attendance" && students.length > 0 && <div className="overflow-x-auto rounded-lg border border-gray-200"><table className="min-w-full text-left text-sm"><thead className="bg-gray-50"><tr><th className="px-4 py-3">Estudiante</th><th className="px-4 py-3">Estado</th><th className="px-4 py-3">Justificacion</th></tr></thead><tbody className="divide-y divide-gray-100">{students.map((student) => <tr key={student.id}><td className="px-4 py-3 font-medium">{student.estudiante_nombre}</td><td className="px-4 py-3"><select className={inputClass} onChange={(event) => setAttendance((current) => ({ ...current, [student.id]: event.target.value }))} value={attendance[student.id] ?? "PRESENTE"}><option value="PRESENTE">Presente</option><option value="TARDE">Tarde</option><option value="FALTA">Falta</option><option value="JUSTIFICADA">Justificada</option></select></td><td className="px-4 py-3"><input className={inputClass} disabled={attendance[student.id] !== "JUSTIFICADA"} maxLength={500} onChange={(event) => setAttendanceNotes((current) => ({ ...current, [student.id]: event.target.value }))} value={attendanceNotes[student.id] ?? ""} /></td></tr>)}</tbody></table></div>}

          {module === "grades" && students.length > 0 && <div className="overflow-x-auto rounded-lg border border-gray-200"><table className="min-w-full text-left text-sm"><thead className="bg-gray-50"><tr><th className="px-4 py-3">Estudiante</th><th className="px-4 py-3">Calificacion</th><th className="px-4 py-3">Observacion</th></tr></thead><tbody className="divide-y divide-gray-100">{students.map((student) => <tr key={student.id}><td className="px-4 py-3 font-medium">{student.estudiante_nombre}</td><td className="px-4 py-3"><select className={inputClass} onChange={(event) => setGrades((current) => ({ ...current, [student.id]: event.target.value }))} value={grades[student.id] ?? ""}><option value="">Seleccionar</option><option value="AD">AD - Logro destacado</option><option value="A">A - Logro esperado</option><option value="B">B - En proceso</option><option value="C">C - En inicio</option></select></td><td className="px-4 py-3"><input className={inputClass} maxLength={500} onChange={(event) => setGradeNotes((current) => ({ ...current, [student.id]: event.target.value }))} value={gradeNotes[student.id] ?? ""} /></td></tr>)}</tbody></table></div>}

          {module === "participations" && <div className="grid gap-4 sm:grid-cols-2"><div><label className="mb-2 block text-sm font-semibold text-gray-700">Tipo</label><select className={inputClass} onChange={(event) => setParticipationType(event.target.value)} value={participationType}><option value="ORAL">Oral</option><option value="ESCRITA">Escrita</option><option value="PRACTICA">Practica</option><option value="OTRO">Otro</option></select></div><div><label className="mb-2 block text-sm font-semibold text-gray-700">Valor</label><input className={inputClass} maxLength={20} onChange={(event) => setValue(event.target.value)} value={value} /></div></div>}

          {module === "observations" && <div><label className="mb-2 block text-sm font-semibold text-gray-700">Categoria</label><input className={inputClass} maxLength={100} onChange={(event) => setCategory(event.target.value)} value={category} /></div>}

          {(module === "observations" || module === "participations") && <div><label className="mb-2 block text-sm font-semibold text-gray-700">{module === "observations" ? "Descripcion" : "Observacion"}</label><textarea className="min-h-28 w-full rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-50" maxLength={module === "participations" ? 500 : undefined} onChange={(event) => setDescription(event.target.value)} value={description} /></div>}

          {!isLoading && courses.length === 0 && <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">No tienes cursos activos asignados.</div>}
          {!isLoading && courseId && students.length === 0 && <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">Este curso todavia no tiene estudiantes matriculados.</div>}
          {module === "grades" && !isLoading && courseId && criteria.length === 0 && <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">Este curso no tiene criterios de calificacion configurados.</div>}
          {error && <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

          <div className="flex justify-end gap-3 border-t border-gray-100 pt-5"><button className="rounded-lg border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-700" disabled={isSaving} onClick={onClose} type="button">Cancelar</button><button className="rounded-lg bg-brand-500 px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50" disabled={isLoading || isSaving || !hasRequiredData} type="submit">{isSaving ? (module === "recommendations" ? "Generando..." : "Guardando...") : TITLES[module]}</button></div>
        </form>
      </div>
    </div>
  );
}
