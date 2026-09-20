import { Check, CheckCheck, WifiOff } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useClientPagination } from "../../../shared/hooks/useClientPagination";
import { PaginationControls } from "../../../shared/components/PaginationControls";
import { useNotifications } from "../hooks/useNotifications";
import { getInstitutionalNotifications } from "../services/notificationService";
import type { SgaNotification } from "../types/notification.types";

type Props = { institutional?: boolean; onNavigate: (path: string) => void };

function formatDate(value: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString("es-PE", { dateStyle: "medium", timeStyle: "short" });
}

function priorityStyle(priority: string) {
  if (priority === "URGENTE") return "bg-red-100 text-red-800";
  if (priority === "ALTA") return "bg-amber-100 text-amber-900";
  return "bg-slate-100 text-slate-700";
}

export function NotificationCenterPage({ institutional = false, onNavigate }: Props) {
  const common = useNotifications();
  const { refresh } = common;
  const [onlyUnread, setOnlyUnread] = useState(false);
  const [type, setType] = useState("");
  const [priority, setPriority] = useState("");
  const [institutionalItems, setInstitutionalItems] = useState<SgaNotification[]>([]);
  const [institutionalError, setInstitutionalError] = useState<string | null>(null);
  const [isInstitutionalLoading, setIsInstitutionalLoading] = useState(institutional);

  useEffect(() => {
    if (!institutional) { void refresh(100); return; }
    let cancelled = false;
    setIsInstitutionalLoading(true);
    void getInstitutionalNotifications().then((items) => { if (!cancelled) { setInstitutionalItems(items); setInstitutionalError(null); } }).catch((error: unknown) => { if (!cancelled) setInstitutionalError(error instanceof Error ? error.message : "No se pudo cargar la supervisión institucional."); }).finally(() => { if (!cancelled) setIsInstitutionalLoading(false); });
    return () => { cancelled = true; };
  }, [institutional, refresh]);

  const items = institutional ? institutionalItems : common.notifications;
  const types = useMemo(() => [...new Set(items.map((item) => item.tipo).filter(Boolean))], [items]);
  const priorities = useMemo(() => [...new Set(items.map((item) => item.prioridad).filter(Boolean))], [items]);
  const filtered = items.filter((item) => (!onlyUnread || !item.leida) && (!type || item.tipo === type) && (!priority || item.prioridad === priority));
  const pagination = useClientPagination(filtered, 12);
  const error = institutional ? institutionalError : common.error;
  const loading = institutional ? isInstitutionalLoading : common.isLoading;

  return <div className="space-y-5"><section className="flex flex-col gap-4 border-b border-gray-200 pb-5 lg:flex-row lg:items-end lg:justify-between"><div><p className="text-sm font-semibold text-brand-600">Notificaciones</p><h2 className="mt-2 text-2xl font-bold text-gray-900">{institutional ? "Supervisión institucional" : "Centro de notificaciones"}</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-gray-600">{institutional ? "Consulta de solo lectura de las comunicaciones registradas por el sistema." : "Revisa las comunicaciones recibidas y marca su lectura cuando corresponda."}</p></div>{!institutional && <button className="h-10 rounded-lg border border-brand-200 px-4 text-sm font-semibold text-brand-700 hover:bg-brand-50 disabled:opacity-50" disabled={common.unreadCount === 0} onClick={() => void common.markAllRead()} type="button"><CheckCheck className="mr-2 inline" size={16} />Marcar todas como leídas</button>}</section>{common.isOffline && !institutional && <section className="flex items-center gap-2 border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"><WifiOff size={17} /> Sin conexión. El polling se reanudará al recuperar la red.</section>}{error && <section className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</section>}<section className="grid gap-3 border border-gray-200 bg-white p-4 shadow-theme-xs md:grid-cols-3"><label className="flex items-center gap-2 text-sm font-semibold text-gray-700"><input checked={onlyUnread} disabled={institutional} onChange={(event) => setOnlyUnread(event.target.checked)} type="checkbox" /> Solo no leídas</label><select aria-label="Filtrar por tipo" className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm" onChange={(event) => setType(event.target.value)} value={type}><option value="">Todos los tipos</option>{types.map((item) => <option key={item} value={item}>{item}</option>)}</select><select aria-label="Filtrar por prioridad" className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm" onChange={(event) => setPriority(event.target.value)} value={priority}><option value="">Todas las prioridades</option>{priorities.map((item) => <option key={item} value={item}>{item}</option>)}</select></section><section className="overflow-hidden border border-gray-200 bg-white shadow-theme-xs"><div className="overflow-x-auto"><table className="w-full min-w-[880px] text-left text-sm"><thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500"><tr><th className="px-5 py-3">Notificación</th><th className="px-5 py-3">Remitente</th><th className="px-5 py-3">Tipo</th><th className="px-5 py-3">Prioridad</th><th className="px-5 py-3">Fecha</th>{!institutional && <th className="px-5 py-3 text-right">Acción</th>}</tr></thead><tbody className="divide-y divide-gray-100">{loading ? <tr><td className="px-5 py-10 text-center text-gray-500" colSpan={institutional ? 5 : 6}>Cargando notificaciones...</td></tr> : filtered.length === 0 ? <tr><td className="px-5 py-10 text-center text-gray-500" colSpan={institutional ? 5 : 6}>No hay notificaciones para los filtros seleccionados.</td></tr> : pagination.pageItems.map((item) => <tr className={!item.leida && !institutional ? "bg-brand-50/40" : ""} key={item.id}><td className="max-w-md px-5 py-4"><p className="font-semibold text-gray-900">{item.titulo}</p><p className="mt-1 line-clamp-2 text-gray-600">{item.mensaje}</p>{item.detalle_error && institutional && <p className="mt-2 text-xs text-red-700">{item.detalle_error}</p>}</td><td className="px-5 py-4 text-gray-700">{item.enviado_por_label || "SGA"}</td><td className="px-5 py-4 text-gray-700">{item.tipo_label}</td><td className="px-5 py-4"><span className={`rounded-md px-2 py-1 text-xs font-bold ${priorityStyle(item.prioridad)}`}>{item.prioridad_label}</span></td><td className="px-5 py-4 text-gray-600">{formatDate(item.fecha_envio ?? item.creado_en)}</td>{!institutional && <td className="px-5 py-4 text-right"><div className="flex justify-end gap-2">{!item.leida && <button aria-label="Marcar como leída" className="rounded-lg border border-gray-200 p-2 text-gray-600 hover:bg-gray-50" onClick={() => void common.markRead(item.id)} title="Marcar como leída" type="button"><Check size={16} /></button>}{item.accion_url && <button className="rounded-lg border border-brand-200 px-3 py-2 text-xs font-semibold text-brand-700 hover:bg-brand-50" onClick={() => { void common.markRead(item.id); onNavigate(item.accion_url as string); }} type="button">Abrir</button>}</div></td>}</tr>)}</tbody></table></div><PaginationControls currentPage={pagination.currentPage} isLoading={loading} itemLabel="notificaciones" onPageChange={pagination.setCurrentPage} pageSize={pagination.pageSize} totalItems={pagination.totalItems} totalPages={pagination.totalPages} /></section></div>;
}
