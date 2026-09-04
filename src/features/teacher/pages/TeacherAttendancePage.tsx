import { useEffect, useMemo, useState } from "react";
import { PaginationControls } from "../../../shared/components/PaginationControls";
import { useClientPagination } from "../../../shared/hooks/useClientPagination";
import {
  getTeacherAttendanceRecords,
  getTeacherCourseStudents,
  registerTeacherAttendance,
} from "../services/teacherService";
import type {
  AttendancePayload,
  TeacherCourse,
  TeacherStudent,
} from "../services/teacherService";

type AttendanceStatus = AttendancePayload["registros"][number]["estado"];

type Props = {
  course: TeacherCourse;
};

const STATUS_OPTIONS: Array<{ label: string; value: AttendanceStatus }> = [
  { label: "P - Presente", value: "PRESENTE" },
  { label: "T - Tarde", value: "TARDE" },
  { label: "F - Falta", value: "FALTA" },
  { label: "J - Justificada", value: "JUSTIFICADA" },
];

function dateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function mondayOf(date: Date) {
  const result = new Date(date);
  const day = result.getDay();
  result.setDate(result.getDate() - (day === 0 ? 6 : day - 1));
  result.setHours(0, 0, 0, 0);
  return result;
}

function moveDays(date: Date, days: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function visibleDay(date: Date) {
  const day = date.getDay();
  if (day === 6) return moveDays(date, -1);
  if (day === 0) return moveDays(date, -2);
  return date;
}

function cellKey(enrollmentId: number, date: string) {
  return `${enrollmentId}:${date}`;
}

function message(error: unknown) {
  return error instanceof Error ? error.message : "No se pudo guardar la asistencia.";
}

export function TeacherAttendancePage({ course }: Props) {
  const [weekStart, setWeekStart] = useState(() => mondayOf(new Date()));
  const [students, setStudents] = useState<TeacherStudent[]>([]);
  const [statuses, setStatuses] = useState<Record<string, AttendanceStatus | "">>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [dirtyDates, setDirtyDates] = useState<Set<string>>(new Set());
  const [selectedDate, setSelectedDate] = useState(() =>
    dateKey(visibleDay(new Date())),
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const weekDays = useMemo(
    () => Array.from({ length: 5 }, (_, index) => moveDays(weekStart, index)),
    [weekStart],
  );

  useEffect(() => {
    let ignore = false;
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    Promise.all([
      getTeacherCourseStudents(course.id),
      getTeacherAttendanceRecords(),
    ])
      .then(([studentItems, attendanceItems]) => {
        if (ignore) return;
        const courseRecords = attendanceItems.filter(
          (item) => item.asignacion_curso_id === course.id,
        );
        setStudents(studentItems);
        setStatuses(
          Object.fromEntries(
            courseRecords.map((item) => [
              cellKey(item.matricula_id, item.fecha),
              item.estado,
            ]),
          ),
        );
        setNotes(
          Object.fromEntries(
            courseRecords.map((item) => [
              cellKey(item.matricula_id, item.fecha),
              item.justificacion ?? "",
            ]),
          ),
        );
        setDirtyDates(new Set());
      })
      .catch((requestError) => setError(message(requestError)))
      .finally(() => {
        if (!ignore) setIsLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [course.id]);

  const updateStatus = (
    enrollmentId: number,
    date: string,
    status: AttendanceStatus | "",
  ) => {
    setStatuses((current) => ({ ...current, [cellKey(enrollmentId, date)]: status }));
    setDirtyDates((current) => new Set(current).add(date));
    setError(null);
    setSuccess(null);
  };

  const markAllPresent = () => {
    setStatuses((current) => ({
      ...current,
      ...Object.fromEntries(
        students.map((student) => [cellKey(student.id, selectedDate), "PRESENTE"]),
      ),
    }));
    setDirtyDates((current) => new Set(current).add(selectedDate));
    setSuccess(null);
  };

  const changeWeek = (days: number) => {
    setWeekStart((current) => {
      const next = moveDays(current, days);
      setSelectedDate(dateKey(next));
      return next;
    });
  };

  const saveWeek = async () => {
    if (dirtyDates.size === 0) {
      setError("No hay cambios de asistencia por guardar.");
      return;
    }

    const incompleteDate = [...dirtyDates].find((date) =>
      students.some((student) => !statuses[cellKey(student.id, date)]),
    );
    if (incompleteDate) {
      setError(`Completa la asistencia de todos los estudiantes para el ${new Date(`${incompleteDate}T00:00:00`).toLocaleDateString("es-PE")}.`);
      return;
    }

    const unjustified = [...dirtyDates].some((date) =>
      students.some((student) => {
        const key = cellKey(student.id, date);
        return statuses[key] === "JUSTIFICADA" && !notes[key]?.trim();
      }),
    );
    if (unjustified) {
      setError("Ingresa el motivo de cada falta justificada.");
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      await Promise.all(
        [...dirtyDates].map((date) =>
          registerTeacherAttendance({
            asignacion_curso: course.id,
            fecha: date,
            registros: students.map((student) => {
              const key = cellKey(student.id, date);
              return {
                matricula: student.id,
                estado: statuses[key] as AttendanceStatus,
                justificacion: notes[key]?.trim() || null,
              };
            }),
          }),
        ),
      );
      setDirtyDates(new Set());
      setSuccess("Asistencia semanal guardada correctamente.");
    } catch (requestError) {
      setError(message(requestError));
    } finally {
      setIsSaving(false);
    }
  };

  const weekEnd = weekDays[4];
  const weekLabel = `${weekStart.toLocaleDateString("es-PE", { day: "2-digit", month: "short" })} - ${weekEnd.toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" })}`;
  const pagination = useClientPagination(students);

  return (
    <div className="space-y-4">
      <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-theme-xs">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Asistencia semanal</h3>
            <p className="mt-1 text-sm text-gray-500">{weekLabel}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button aria-label="Semana anterior" className="h-10 w-10 rounded-lg border border-gray-200 bg-white text-lg text-gray-700 hover:bg-gray-50" onClick={() => changeWeek(-7)} type="button">&lt;</button>
            <button className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-700 hover:bg-gray-50" onClick={() => { const today = new Date(); setWeekStart(mondayOf(today)); setSelectedDate(dateKey(visibleDay(today))); }} type="button">Semana actual</button>
            <button aria-label="Semana siguiente" className="h-10 w-10 rounded-lg border border-gray-200 bg-white text-lg text-gray-700 hover:bg-gray-50" onClick={() => changeWeek(7)} type="button">&gt;</button>
            <button className="h-10 rounded-lg border border-brand-200 bg-brand-50 px-3 text-sm font-semibold text-brand-700 hover:bg-brand-100 disabled:opacity-50" disabled={students.length === 0 || isSaving} onClick={markAllPresent} type="button">Todos presentes</button>
            <button className="h-10 rounded-lg bg-brand-500 px-4 text-sm font-semibold text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50" disabled={students.length === 0 || isSaving || dirtyDates.size === 0} onClick={saveWeek} type="button">{isSaving ? "Guardando..." : "Guardar semana"}</button>
          </div>
        </div>
      </section>

      {error && <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {success && <div className="rounded-lg border border-green-100 bg-green-50 px-4 py-3 text-sm text-green-700">{success}</div>}

      {isLoading ? (
        <section className="rounded-lg border border-gray-200 bg-white px-6 py-10 text-center text-sm text-gray-500">Cargando asistencia...</section>
      ) : students.length === 0 ? (
        <section className="rounded-lg border border-dashed border-gray-200 bg-white px-6 py-10 text-center text-sm text-gray-500">No hay estudiantes matriculados en este curso.</section>
      ) : (
        <section className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-theme-xs">
          <div className="overflow-x-auto">
            <table className="min-w-[1050px] table-fixed text-left text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="w-60 px-4 py-3 font-semibold text-gray-600">Estudiante</th>
                  {weekDays.map((day) => {
                    const key = dateKey(day);
                    return <th className="w-40 px-2 py-2" key={key}><button className={`w-full rounded-lg px-2 py-2 text-center font-semibold ${selectedDate === key ? "bg-brand-500 text-white" : "text-gray-600 hover:bg-brand-50"}`} onClick={() => setSelectedDate(key)} type="button"><span className="block text-xs uppercase">{day.toLocaleDateString("es-PE", { weekday: "short" })}</span><span className="mt-1 block">{day.toLocaleDateString("es-PE", { day: "2-digit", month: "2-digit" })}</span></button></th>;
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pagination.pageItems.map((student) => <tr key={student.id}><td className="px-4 py-3"><p className="font-semibold text-gray-900">{student.estudiante_nombre}</p><p className="mt-1 text-xs text-gray-500">{student.codigo_estudiante}</p></td>{weekDays.map((day) => { const date = dateKey(day); const key = cellKey(student.id, date); const status = statuses[key] ?? ""; return <td className="px-2 py-3 align-top" key={date}><div className="min-h-16"><select aria-label={`Asistencia de ${student.estudiante_nombre} el ${date}`} className="h-10 w-full rounded-lg border border-gray-200 bg-white px-2 text-xs font-semibold outline-none focus:border-brand-500" onChange={(event) => updateStatus(student.id, date, event.target.value as AttendanceStatus | "")} value={status}><option value="">Sin marcar</option>{STATUS_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>{status === "JUSTIFICADA" && <input aria-label={`Justificacion de ${student.estudiante_nombre}`} className="mt-2 h-9 w-full rounded-lg border border-gray-200 px-2 text-xs outline-none focus:border-brand-500" maxLength={500} onChange={(event) => { setNotes((current) => ({ ...current, [key]: event.target.value })); setDirtyDates((current) => new Set(current).add(date)); }} placeholder="Motivo" value={notes[key] ?? ""} />}</div></td>; })}</tr>)}
              </tbody>
            </table>
          </div>
          <PaginationControls currentPage={pagination.currentPage} isLoading={isSaving} itemLabel="estudiantes" onPageChange={pagination.setCurrentPage} pageSize={pagination.pageSize} totalItems={pagination.totalItems} totalPages={pagination.totalPages} />
        </section>
      )}
    </div>
  );
}
