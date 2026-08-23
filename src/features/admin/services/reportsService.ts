import { authFetch } from "../../auth/services/authService";
import type {
  AcademicReport,
  EnrollmentsReport,
  IncidentsReport,
  NotificationsReport,
  ReportsBundle,
  SummaryReport,
} from "../types/reports.types";
import { formatApiObject } from "../utils/apiMessages";

const REPORTS_URL = "/api/reportes";

async function readError(response: Response) {
  const data = await response.json().catch(() => null);

  if (data && typeof data === "object") {
    const messages = formatApiObject(data as Record<string, unknown>);

    if (messages) return messages;
  }

  return "No se pudo completar la operacion.";
}

async function getReport<TReport>(token: string, path: string) {
  const response = await authFetch(`${REPORTS_URL}/${path}/`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(await readError(response));
  }

  return (await response.json()) as TReport;
}

export async function getReportsBundle(token: string): Promise<ReportsBundle> {
  const [summary, academic, enrollments, incidents, notifications] =
    await Promise.all([
      getReport<SummaryReport>(token, "resumen"),
      getReport<AcademicReport>(token, "academico"),
      getReport<EnrollmentsReport>(token, "matriculas"),
      getReport<IncidentsReport>(token, "incidencias"),
      getReport<NotificationsReport>(token, "notificaciones"),
    ]);

  return {
    academic,
    enrollments,
    incidents,
    notifications,
    summary,
  };
}
