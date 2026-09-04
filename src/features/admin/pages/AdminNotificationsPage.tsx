import { useMemo, useState } from "react";
import { PaginationControls } from "../../../shared/components/PaginationControls";
import { useClientPagination } from "../../../shared/hooks/useClientPagination";
import { NotificationModal } from "../components/NotificationModal";
import { useAdminNotifications } from "../hooks/useAdminNotifications";
import { useEnrollments } from "../hooks/useEnrollments";
import { useGuardianStudentLinks } from "../hooks/useGuardianStudentLinks";
import { useGuardians } from "../hooks/useGuardians";
import { useIncidents } from "../hooks/useIncidents";
import { useInstitutionalEmails } from "../hooks/useInstitutionalEmails";
import type { NotificationDeliveryStatus } from "../types/notification.types";
import type { InstitutionalEmailStatus } from "../types/institutionalEmail.types";

type Props = { token: string };

const statusLabels: Record<NotificationDeliveryStatus, string> = {
  ENVIADA: "Enviada",
  FALLIDA: "Fallida",
  LEIDA: "Leida",
  PENDIENTE: "Pendiente",
};

const statusStyles: Record<NotificationDeliveryStatus, string> = {
  ENVIADA: "bg-green-50 text-green-700",
  FALLIDA: "bg-red-50 text-red-700",
  LEIDA: "bg-brand-50 text-brand-700",
  PENDIENTE: "bg-amber-50 text-amber-700",
};

const emailStatusLabels: Record<InstitutionalEmailStatus, string> = {
  ENVIADO: "Enviado",
  FALLIDO: "Fallido",
  PENDIENTE: "Pendiente",
};

const emailStatusStyles: Record<InstitutionalEmailStatus, string> = {
  ENVIADO: "bg-green-50 text-green-700",
  FALLIDO: "bg-red-50 text-red-700",
  PENDIENTE: "bg-amber-50 text-amber-700",
};

function formatDate(value: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString("es-PE", { dateStyle: "medium", timeStyle: "short" });
}

function Metric({ label, value }: { label: string; value: number }) {
  return <article className="rounded-lg border border-gray-200 bg-white p-4 shadow-theme-xs"><p className="text-xs font-semibold uppercase text-gray-500">{label}</p><strong className="mt-2 block text-2xl text-gray-900">{value}</strong></article>;
}

export function AdminNotificationsPage({ token }: Props) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [status, setStatus] = useState<NotificationDeliveryStatus | "">("");
  const [search, setSearch] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const notifications = useAdminNotifications(token);
  const emails = useInstitutionalEmails(token);
  const incidents = useIncidents(token);
  const guardians = useGuardians(token);
  const links = useGuardianStudentLinks(token);
  const enrollments = useEnrollments(token);
  const filtered = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("es");
    return notifications.notifications.filter((item) => {
      if (status && item.estado_envio !== status) return false;
      if (!query) return true;
      return `${item.titulo} ${item.mensaje} ${item.apoderado_label} ${item.estudiante_label} ${item.incidencia_label}`.toLocaleLowerCase("es").includes(query);
    });
  }, [notifications.notifications, search, status]);
  const pagination = useClientPagination(filtered);
  const emailPagination = useClientPagination(emails.emails);
  const isCatalogLoading = incidents.isLoading || guardians.isLoading || links.isLoading || enrollments.isLoading;
  const isBusy = notifications.isLoading || notifications.isSaving || emails.isSaving || isCatalogLoading;
  const catalogError = incidents.error ?? guardians.error ?? links.error ?? enrollments.error;

  const submit = async (payload: { email: Parameters<typeof emails.send>[0]; notification: Parameters<typeof notifications.send>[0] }) => {
    setActionError(null);
    try {
      await notifications.send(payload.notification);
      await emails.send(payload.email);
      setIsModalOpen(false);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "No se pudo enviar la notificacion.");
    }
  };

  const resend = async (id: number) => {
    setActionError(null);
    try {
      await notifications.resend(id);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "No se pudo reenviar la notificacion.");
    }
  };

  const totalSent = notifications.notifications.filter((item) => item.estado_envio === "ENVIADA" || item.estado_envio === "LEIDA").length;
  const failed = notifications.notifications.filter((item) => item.estado_envio === "FALLIDA").length;
  const unread = notifications.notifications.filter((item) => !item.fecha_lectura).length;

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-theme-xs lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold text-brand-600">Seguimiento</p>
          <h2 className="mt-2 text-2xl font-bold text-gray-900">Notificaciones administrativas</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-600">Comunica incidencias a los apoderados. El backend registra el historial y realiza la entrega por SendGrid.</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <button className="h-11 rounded-lg border border-gray-200 px-4 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50" disabled={isBusy} onClick={() => { void notifications.reload(); void emails.reload(); }} type="button">{notifications.isLoading || emails.isLoading ? "Actualizando..." : "Actualizar"}</button>
          <button className="h-11 rounded-lg bg-brand-500 px-4 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-50" disabled={isBusy || incidents.incidents.length === 0} onClick={() => { setActionError(null); setIsModalOpen(true); }} type="button">Nueva notificacion</button>
        </div>
      </section>

      {(notifications.error || emails.error || catalogError || actionError) && <section className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{actionError || notifications.error || emails.error || catalogError}</section>}
      {!isCatalogLoading && incidents.incidents.length === 0 && <section className="rounded-lg border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-800">Registra una incidencia y vincula un apoderado al estudiante antes de enviar una notificacion.</section>}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Total" value={notifications.notifications.length} />
        <Metric label="Enviadas" value={totalSent} />
        <Metric label="Fallidas" value={failed} />
        <Metric label="Sin lectura" value={unread} />
      </section>

      <section className="grid gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-theme-xs lg:grid-cols-[1fr_180px]">
        <input className="h-11 rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-brand-500" onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por asunto, destinatario o estudiante" value={search} />
        <select className="h-11 rounded-lg border border-gray-200 bg-white px-3 text-sm" onChange={(event) => setStatus(event.target.value as NotificationDeliveryStatus | "")} value={status}>
          <option value="">Todos los estados</option>
          {Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      </section>

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-theme-xs">
        <div className="border-b border-gray-100 px-6 py-4"><h3 className="text-lg font-bold text-gray-900">Historial de envios</h3></div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1120px] text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500"><tr><th className="px-6 py-4">Fecha</th><th className="px-6 py-4">Destinatario</th><th className="px-6 py-4">Estudiante</th><th className="px-6 py-4">Asunto</th><th className="px-6 py-4">Estado</th><th className="px-6 py-4">Lectura</th><th className="px-6 py-4 text-right">Accion</th></tr></thead>
            <tbody className="divide-y divide-gray-100">
              {notifications.isLoading ? <tr><td className="px-6 py-10 text-center text-gray-500" colSpan={7}>Cargando notificaciones...</td></tr> : filtered.length === 0 ? <tr><td className="px-6 py-10 text-center text-gray-500" colSpan={7}>No hay notificaciones para los filtros seleccionados.</td></tr> : pagination.pageItems.map((item) => <tr className="align-top hover:bg-gray-50" key={item.id}><td className="px-6 py-4 text-gray-600">{formatDate(item.fecha_envio)}</td><td className="px-6 py-4"><p className="font-semibold text-gray-900">{item.apoderado_label}</p><p className="mt-1 text-xs text-gray-500">{item.apoderado_email}</p></td><td className="px-6 py-4"><p className="font-semibold text-gray-900">{item.estudiante_label}</p><p className="mt-1 text-xs text-gray-500">{item.estudiante_codigo}</p></td><td className="max-w-sm px-6 py-4"><p className="font-semibold text-gray-900">{item.titulo}</p><p className="mt-1 line-clamp-2 text-gray-600">{item.mensaje}</p></td><td className="px-6 py-4"><span className={`inline-flex rounded-lg px-3 py-1 text-xs font-semibold ${statusStyles[item.estado_envio]}`}>{statusLabels[item.estado_envio]}</span></td><td className="px-6 py-4 text-gray-600">{item.fecha_lectura ? formatDate(item.fecha_lectura) : "Sin lectura"}</td><td className="px-6 py-4 text-right">{item.estado_envio === "FALLIDA" && <button className="rounded-lg border border-brand-200 px-3 py-2 text-xs font-semibold text-brand-700 hover:bg-brand-50 disabled:opacity-50" disabled={notifications.isSaving} onClick={() => void resend(item.id)} type="button">Reenviar</button>}</td></tr>)}
            </tbody>
          </table>
        </div>
        <PaginationControls currentPage={pagination.currentPage} isLoading={notifications.isLoading} itemLabel="notificaciones" onPageChange={pagination.setCurrentPage} pageSize={pagination.pageSize} totalItems={pagination.totalItems} totalPages={pagination.totalPages} />
      </section>

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-theme-xs">
        <div className="border-b border-gray-100 px-6 py-4"><h3 className="text-lg font-bold text-gray-900">Entrega de correos institucionales</h3><p className="mt-1 text-sm text-gray-600">Estado confirmado por el servicio de correo del backend.</p></div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500"><tr><th className="px-6 py-4">Fecha</th><th className="px-6 py-4">Destinatario</th><th className="px-6 py-4">Asunto</th><th className="px-6 py-4">Estado</th><th className="px-6 py-4">Detalle</th></tr></thead>
            <tbody className="divide-y divide-gray-100">
              {emails.isLoading ? <tr><td className="px-6 py-10 text-center text-gray-500" colSpan={5}>Cargando correos...</td></tr> : emails.emails.length === 0 ? <tr><td className="px-6 py-10 text-center text-gray-500" colSpan={5}>Todavia no hay correos institucionales registrados.</td></tr> : emailPagination.pageItems.map((item) => <tr className="align-top hover:bg-gray-50" key={item.id}><td className="px-6 py-4 text-gray-600">{formatDate(item.fecha_envio || item.fecha_creacion)}</td><td className="px-6 py-4"><p className="font-semibold text-gray-900">{item.destinatario_nombre}</p><p className="mt-1 text-xs text-gray-500">{item.destinatario_email}</p></td><td className="max-w-sm px-6 py-4"><p className="font-semibold text-gray-900">{item.asunto}</p><p className="mt-1 line-clamp-2 text-gray-600">{item.mensaje}</p></td><td className="px-6 py-4"><span className={`inline-flex rounded-lg px-3 py-1 text-xs font-semibold ${emailStatusStyles[item.estado]}`}>{emailStatusLabels[item.estado]}</span></td><td className="max-w-xs px-6 py-4 text-xs leading-5 text-red-700">{item.detalle_error || "-"}</td></tr>)}
            </tbody>
          </table>
        </div>
        <PaginationControls currentPage={emailPagination.currentPage} isLoading={emails.isLoading} itemLabel="correos" onPageChange={emailPagination.setCurrentPage} pageSize={emailPagination.pageSize} totalItems={emailPagination.totalItems} totalPages={emailPagination.totalPages} />
      </section>

      {isModalOpen && <NotificationModal enrollments={enrollments.enrollments} error={actionError || notifications.error || emails.error} guardians={guardians.guardians} incidents={incidents.incidents} isSaving={notifications.isSaving || emails.isSaving} links={links.links} onClose={() => { if (!notifications.isSaving && !emails.isSaving) setIsModalOpen(false); }} onPreview={emails.preview} onSubmit={submit} />}
    </div>
  );
}
