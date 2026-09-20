import { BellRing, X } from "lucide-react";
import { useEffect } from "react";
import { useNotifications } from "../hooks/useNotifications";
import type { SgaNotification } from "../types/notification.types";

function priorityStyle(priority: string) {
  if (priority === "URGENTE") return "border-red-200 bg-red-50";
  if (priority === "ALTA") return "border-amber-200 bg-amber-50";
  return "border-brand-200 bg-white";
}

export function NotificationToasts({
  onOpen,
}: {
  onOpen: (notification: SgaNotification) => void;
}) {
  const { dismissToast, markRead, toasts } = useNotifications();

  useEffect(() => {
    const timeoutIds = toasts
      .filter((item) => !["ALTA", "URGENTE"].includes(item.prioridad))
      .map((item) => window.setTimeout(() => dismissToast(item.id), 7000));
    return () => timeoutIds.forEach(window.clearTimeout);
  }, [dismissToast, toasts]);

  return (
    <div
      aria-live="polite"
      className="fixed bottom-4 right-4 z-[70] flex w-[min(25rem,calc(100vw-2rem))] flex-col gap-3"
    >
      {toasts.map((item) => (
        <article
          className={`border p-4 shadow-lg ${priorityStyle(item.prioridad)}`}
          key={item.id}
        >
          <div className="flex gap-3">
            <BellRing className="mt-0.5 shrink-0 text-brand-700" size={18} />
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <p className="font-bold text-gray-900">{item.titulo}</p>
                <button
                  aria-label="Cerrar alerta"
                  className="text-gray-500 hover:text-gray-900"
                  onClick={() => dismissToast(item.id)}
                  type="button"
                >
                  <X size={17} />
                </button>
              </div>
              <p className="mt-1 line-clamp-2 text-sm text-gray-700">
                {item.mensaje}
              </p>
              <p className="mt-2 text-xs text-gray-500">
                {item.enviado_por_label || "SGA"} / {item.prioridad_label}
              </p>
              {Boolean(item.accion_url || item.datos) && (
                <button
                  className="mt-3 text-sm font-semibold text-brand-700 hover:text-brand-800"
                  onClick={() => {
                    void markRead(item.id);
                    onOpen(item);
                    dismissToast(item.id);
                  }}
                  type="button"
                >
                  Abrir
                </button>
              )}
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
