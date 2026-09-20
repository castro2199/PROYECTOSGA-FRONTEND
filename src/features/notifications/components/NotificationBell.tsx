import { Bell, BellRing, CheckCheck, Volume2, VolumeX } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNotifications } from "../hooks/useNotifications";
import type { SgaNotification } from "../types/notification.types";

function dateLabel(value: string | null) {
  if (!value) return "Sin fecha";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString("es-PE", { dateStyle: "short", timeStyle: "short" });
}

function priorityStyle(priority: string) {
  if (priority === "URGENTE") return "bg-red-100 text-red-800";
  if (priority === "ALTA") return "bg-amber-100 text-amber-900";
  return "bg-slate-100 text-slate-700";
}

function NotificationPreview({ item, onOpen }: { item: SgaNotification; onOpen: (item: SgaNotification) => void }) {
  return <button className={`w-full border-b border-gray-100 px-4 py-3 text-left hover:bg-gray-50 ${item.leida ? "bg-white" : "bg-brand-50/50"}`} onClick={() => onOpen(item)} type="button"><div className="flex items-start justify-between gap-2"><p className="min-w-0 truncate text-sm font-semibold text-gray-900">{item.titulo}</p><span className={`shrink-0 rounded-md px-2 py-1 text-[11px] font-bold ${priorityStyle(item.prioridad)}`}>{item.prioridad_label}</span></div><p className="mt-1 line-clamp-2 text-xs leading-5 text-gray-600">{item.mensaje}</p><p className="mt-2 text-xs text-gray-500">{item.enviado_por_label || "SGA"} · {dateLabel(item.fecha_envio ?? item.creado_en)}</p></button>;
}

export function NotificationBell({
  onOpenNotification,
  onViewAll,
}: {
  onOpenNotification?: (notification: SgaNotification) => void;
  onViewAll: () => void;
}) {
  const { markAllRead, markRead, notifications, requestBrowserNotifications, settings, setSoundEnabled, unreadCount } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const latest = notifications.slice(0, 5);

  useEffect(() => {
    const close = (event: MouseEvent) => { if (root.current && !root.current.contains(event.target as Node)) setIsOpen(false); };
    window.addEventListener("mousedown", close);
    return () => window.removeEventListener("mousedown", close);
  }, []);

  const openItem = async (item: SgaNotification) => {
    if (!item.leida) { try { await markRead(item.id); } catch { return; } }
    setIsOpen(false);
    if (item.accion_url || item.datos) {
      if (onOpenNotification) onOpenNotification(item);
      else onViewAll();
      return;
    }
    onViewAll();
  };

  return <div className="relative" ref={root}><button aria-expanded={isOpen} aria-label="Abrir notificaciones" className="relative flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50" onClick={() => setIsOpen((value) => !value)} title="Notificaciones" type="button">{unreadCount ? <BellRing aria-hidden="true" size={19} /> : <Bell aria-hidden="true" size={19} />}{unreadCount > 0 && <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-red-600 px-1 text-center text-xs font-bold leading-5 text-white" aria-label={`${unreadCount} no leídas`}>{unreadCount > 99 ? "99+" : unreadCount}</span>}</button>{isOpen && <section className="absolute right-0 z-50 mt-2 w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg"><div className="flex items-center justify-between gap-3 border-b border-gray-100 px-4 py-3"><div><h2 className="text-sm font-bold text-gray-900">Notificaciones</h2><p className="text-xs text-gray-500">{unreadCount} sin leer</p></div><div className="flex gap-1"><button aria-label={settings.soundEnabled ? "Desactivar sonido" : "Activar sonido"} className="flex h-8 w-8 items-center justify-center rounded-md text-gray-600 hover:bg-gray-100" onClick={() => setSoundEnabled(!settings.soundEnabled)} title={settings.soundEnabled ? "Desactivar sonido" : "Activar sonido"} type="button">{settings.soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}</button><button aria-label="Activar notificaciones del navegador" className="flex h-8 w-8 items-center justify-center rounded-md text-gray-600 hover:bg-gray-100" onClick={() => void requestBrowserNotifications()} title="Activar notificaciones del navegador" type="button"><BellRing size={16} /></button>{unreadCount > 0 && <button aria-label="Marcar todas como leídas" className="flex h-8 w-8 items-center justify-center rounded-md text-gray-600 hover:bg-gray-100 disabled:opacity-50" disabled={isSaving} onClick={() => { setIsSaving(true); void markAllRead().finally(() => setIsSaving(false)); }} title="Marcar todas como leídas" type="button"><CheckCheck size={16} /></button>}</div></div>{latest.length === 0 ? <p className="px-4 py-8 text-center text-sm text-gray-500">No tienes notificaciones.</p> : <div>{latest.map((item) => <NotificationPreview item={item} key={item.id} onOpen={openItem} />)}</div>}<button className="w-full px-4 py-3 text-center text-sm font-semibold text-brand-700 hover:bg-brand-50" onClick={() => { setIsOpen(false); onViewAll(); }} type="button">Ver todas</button></section>}</div>;
}
