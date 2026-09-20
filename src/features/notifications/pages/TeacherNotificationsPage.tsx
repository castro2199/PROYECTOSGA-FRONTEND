import { useEffect, useState } from "react";
import { NotificationCenterPage } from "./NotificationCenterPage";
import { getTeacherRecipients, getTeacherSentNotifications, sendTeacherNotification } from "../services/notificationService";
import type { NotificationRecipient, SgaNotification } from "../types/notification.types";

type Props = { onNavigate: (path: string) => void };
type Tab = "received" | "create" | "sent";

const PRIORITIES = ["BAJA", "MEDIA", "ALTA", "URGENTE"];
const TYPES = ["ACADEMICA", "ASISTENCIA", "INCIDENCIA", "GENERAL"];

function SentList({ items, isLoading }: { items: SgaNotification[]; isLoading: boolean }) {
  if (isLoading) return <section className="border border-gray-200 bg-white px-5 py-10 text-center text-sm text-gray-500">Cargando notificaciones enviadas...</section>;
  if (!items.length) return <section className="border border-dashed border-gray-300 bg-white px-5 py-10 text-center text-sm text-gray-500">No hay notificaciones enviadas.</section>;
  return <section className="overflow-hidden border border-gray-200 bg-white shadow-theme-xs"><div className="overflow-x-auto"><table className="w-full min-w-[780px] text-left text-sm"><thead className="bg-gray-50 text-xs uppercase text-gray-500"><tr><th className="px-5 py-3">Destinatario</th><th className="px-5 py-3">Asunto</th><th className="px-5 py-3">Correos enviados</th><th className="px-5 py-3">Correos fallidos</th><th className="px-5 py-3">Estado</th></tr></thead><tbody className="divide-y divide-gray-100">{items.map((item) => <tr key={item.id}><td className="px-5 py-4"><p className="font-semibold text-gray-900">{item.destinatario_label}</p><p className="text-xs text-gray-500">{item.destinatario_rol}</p></td><td className="px-5 py-4"><p className="font-semibold text-gray-900">{item.titulo}</p><p className="mt-1 line-clamp-2 text-gray-600">{item.mensaje}</p></td><td className="px-5 py-4 text-gray-700">{String((item as unknown as Record<string, unknown>).correos_enviados ?? "-")}</td><td className="px-5 py-4 text-gray-700">{String((item as unknown as Record<string, unknown>).correos_fallidos ?? "-")}</td><td className="px-5 py-4 text-gray-700">{item.estado_envio}</td></tr>)}</tbody></table></div></section>;
}

function CreateNotification() {
  const [filters, setFilters] = useState({ rol: "", buscar: "", incidencia_id: "" });
  const [recipients, setRecipients] = useState<NotificationRecipient[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [form, setForm] = useState({ tipo: "GENERAL", prioridad: "MEDIA", titulo: "", mensaje: "", incidencia_id: "", accion_url: "" });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    setIsLoading(true);
    void getTeacherRecipients(filters, controller.signal).then(setRecipients).catch((requestError: unknown) => { if (!controller.signal.aborted) setError(requestError instanceof Error ? requestError.message : "No se pudieron buscar destinatarios."); }).finally(() => { if (!controller.signal.aborted) setIsLoading(false); });
    return () => controller.abort();
  }, [filters]);

  const toggleRecipient = (id: number) => setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : current.length < 20 ? [...current, id] : current);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null); setSuccess(null);
    if (!selected.length) { setError("Selecciona al menos un destinatario."); return; }
    if (selected.length > 20) { setError("Puedes enviar a un máximo de 20 destinatarios."); return; }
    setIsSending(true);
    try {
      const result = await sendTeacherNotification({ ...form, incidencia_id: form.incidencia_id || null, accion_url: form.accion_url || null, destinatarios: selected });
      const sent = result.correos_enviados ?? 0;
      const failed = result.correos_fallidos ?? 0;
      setSuccess(`Notificación creada. Correos enviados: ${sent}. Correos fallidos: ${failed}.`);
      setSelected([]); setForm((current) => ({ ...current, titulo: "", mensaje: "", accion_url: "" }));
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : "No se pudo enviar la notificación."); }
    finally { setIsSending(false); }
  };

  return <form className="space-y-5" onSubmit={(event) => void submit(event)}><section className="grid gap-4 border border-gray-200 bg-white p-5 shadow-theme-xs md:grid-cols-3"><input className="h-10 rounded-lg border border-gray-200 px-3 text-sm" onChange={(event) => setFilters((current) => ({ ...current, buscar: event.target.value }))} placeholder="Buscar destinatarios" value={filters.buscar} /><input className="h-10 rounded-lg border border-gray-200 px-3 text-sm" onChange={(event) => setFilters((current) => ({ ...current, rol: event.target.value }))} placeholder="Filtrar por rol" value={filters.rol} /><input className="h-10 rounded-lg border border-gray-200 px-3 text-sm" inputMode="numeric" onChange={(event) => setFilters((current) => ({ ...current, incidencia_id: event.target.value }))} placeholder="Incidencia ID (opcional)" value={filters.incidencia_id} /></section><section className="grid gap-4 border border-gray-200 bg-white p-5 shadow-theme-xs md:grid-cols-2"><label className="text-sm font-semibold text-gray-700">Tipo<select className="mt-2 h-10 w-full rounded-lg border border-gray-200 bg-white px-3 font-normal" onChange={(event) => setForm((current) => ({ ...current, tipo: event.target.value }))} value={form.tipo}>{TYPES.map((item) => <option key={item}>{item}</option>)}</select></label><label className="text-sm font-semibold text-gray-700">Prioridad<select className="mt-2 h-10 w-full rounded-lg border border-gray-200 bg-white px-3 font-normal" onChange={(event) => setForm((current) => ({ ...current, prioridad: event.target.value }))} value={form.prioridad}>{PRIORITIES.map((item) => <option key={item}>{item}</option>)}</select></label><label className="text-sm font-semibold text-gray-700 md:col-span-2">Título<input className="mt-2 h-10 w-full rounded-lg border border-gray-200 px-3 font-normal" maxLength={200} onChange={(event) => setForm((current) => ({ ...current, titulo: event.target.value }))} required value={form.titulo} /></label><label className="text-sm font-semibold text-gray-700 md:col-span-2">Mensaje<textarea className="mt-2 min-h-32 w-full rounded-lg border border-gray-200 px-3 py-2 font-normal" onChange={(event) => setForm((current) => ({ ...current, mensaje: event.target.value }))} required value={form.mensaje} /></label><label className="text-sm font-semibold text-gray-700">Incidencia<input className="mt-2 h-10 w-full rounded-lg border border-gray-200 px-3 font-normal" inputMode="numeric" onChange={(event) => setForm((current) => ({ ...current, incidencia_id: event.target.value }))} value={form.incidencia_id} /></label><label className="text-sm font-semibold text-gray-700">Ruta interna<input className="mt-2 h-10 w-full rounded-lg border border-gray-200 px-3 font-normal" placeholder="/docente/mis-cursos" onChange={(event) => setForm((current) => ({ ...current, accion_url: event.target.value }))} value={form.accion_url} /></label></section>{error && <p className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>}{success && <p className="border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{success}</p>}<section className="overflow-hidden border border-gray-200 bg-white shadow-theme-xs"><div className="flex items-center justify-between border-b border-gray-100 px-5 py-4"><div><h3 className="font-bold text-gray-900">Destinatarios</h3><p className="text-sm text-gray-500">{selected.length}/20 seleccionados</p></div></div><div className="max-h-80 overflow-y-auto divide-y divide-gray-100">{isLoading ? <p className="px-5 py-8 text-sm text-gray-500">Buscando destinatarios...</p> : recipients.length === 0 ? <p className="px-5 py-8 text-sm text-gray-500">No hay destinatarios para los filtros indicados.</p> : recipients.map((recipient) => <label className="flex cursor-pointer items-center gap-3 px-5 py-3 hover:bg-gray-50" key={recipient.id}><input checked={selected.includes(recipient.id)} disabled={!selected.includes(recipient.id) && selected.length >= 20} onChange={() => toggleRecipient(recipient.id)} type="checkbox" /><span><span className="block text-sm font-semibold text-gray-900">{recipient.label}</span><span className="text-xs text-gray-500">{recipient.rol}</span></span></label>)}</div></section><button className="h-11 rounded-lg bg-brand-500 px-5 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-50" disabled={isSending || !selected.length} type="submit">{isSending ? "Enviando..." : "Enviar notificación"}</button></form>;
}

export function TeacherNotificationsPage({ onNavigate }: Props) {
  const [tab, setTab] = useState<Tab>("received");
  const [sent, setSent] = useState<SgaNotification[]>([]);
  const [isSentLoading, setIsSentLoading] = useState(false);
  useEffect(() => { if (tab !== "sent") return; setIsSentLoading(true); void getTeacherSentNotifications().then(setSent).finally(() => setIsSentLoading(false)); }, [tab]);
  const tabs: Array<[Tab, string]> = [["received", "Recibidas"], ["create", "Crear"], ["sent", "Enviadas"]];
  return <div className="space-y-5"><section className="border-b border-gray-200"><div className="flex overflow-x-auto">{tabs.map(([key, label]) => <button className={`shrink-0 border-b-2 px-4 py-3 text-sm font-semibold ${tab === key ? "border-brand-500 text-brand-700" : "border-transparent text-gray-500 hover:text-gray-800"}`} key={key} onClick={() => setTab(key)} type="button">{label}</button>)}</div></section>{tab === "received" && <NotificationCenterPage onNavigate={onNavigate} />}{tab === "create" && <CreateNotification />}{tab === "sent" && <SentList isLoading={isSentLoading} items={sent} />}</div>;
}
