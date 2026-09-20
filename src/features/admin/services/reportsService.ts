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

  if (response.status === 404) {
    return "La exportacion PDF no esta disponible en el servidor configurado.";
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

function fileNameFromDisposition(value: string | null) {
  const match = value?.match(/filename\*?=(?:UTF-8''|"?)([^";]+)/i);
  return match?.[1] ? decodeURIComponent(match[1]) : "reporte-sga.pdf";
}

export async function downloadReportPdf(filters: Record<string, string | number | boolean | undefined>) {
  const query = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== "") query.set(key, String(value));
  });
  const response = await authFetch(`/api/reportes/exportar-pdf/?${query.toString()}`);
  if (!response.ok) throw new Error(await readError(response));
  const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
  const disposition = response.headers.get("content-disposition") ?? "";
  const isPdf = contentType.includes("pdf") ||
    (contentType.includes("octet-stream") && /filename=.*\.pdf/i.test(disposition));
  if (!isPdf) throw new Error("El servidor no genero un archivo PDF valido.");
  const blob = await response.blob();
  if (blob.size === 0) throw new Error("El archivo PDF generado esta vacio.");
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileNameFromDisposition(disposition);
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
