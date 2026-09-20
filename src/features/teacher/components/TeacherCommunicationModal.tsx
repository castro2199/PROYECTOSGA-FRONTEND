import { useState } from "react";
import {
  previewTeacherCommunication,
  sendTeacherCommunication,
  type TeacherCommunicationPayload,
} from "../services/teacherService";

type Preview = Record<string, unknown>;

type Props = {
  contextLabel: string;
  payload: TeacherCommunicationPayload;
  onClose: () => void;
  onSent?: (result: Record<string, unknown>) => void;
};

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "No se pudo completar la comunicacion.";
}

function valueOf(preview: Preview, keys: string[]) {
  for (const key of keys) {
    const value = preview[key];
    if (typeof value === "string" && value.trim()) return value;
  }
  return "-";
}

function labels(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => {
    if (typeof item === "string") return item;
    if (item && typeof item === "object") {
      const record = item as Record<string, unknown>;
      return String(record.label ?? record.nombre ?? record.email ?? record.username ?? "Destinatario");
    }
    return String(item);
  });
}

export function TeacherCommunicationModal({ contextLabel, payload, onClose, onSent }: Props) {
  const [message, setMessage] = useState(payload.mensaje_adicional ?? "");
  const [preview, setPreview] = useState<Preview | null>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestPayload = { ...payload, mensaje_adicional: message.trim() };
  const showPreview = async () => {
    setIsPreviewing(true);
    setError(null);
    try {
      setPreview(await previewTeacherCommunication(requestPayload));
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setIsPreviewing(false);
    }
  };

  const send = async () => {
    setIsSending(true);
    setError(null);
    try {
      const result = await sendTeacherCommunication(requestPayload);
      onSent?.(result);
      onClose();
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setIsSending(false);
    }
  };

  const recipients = labels(preview?.destinatarios ?? preview?.recipients);
  const warnings = labels(preview?.advertencias ?? preview?.warnings);
  const omitted = labels(preview?.omitidos ?? preview?.omitted);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-gray-950/50 px-4 py-6">
      <section aria-modal="true" className="max-h-full w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-5 shadow-theme-xl sm:p-6" role="dialog">
        <header className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Comunicar</h2>
            <p className="mt-1 text-sm leading-6 text-gray-600">Se preparara una comunicacion sobre {contextLabel}. Revisa la vista previa antes de enviarla.</p>
          </div>
          <button aria-label="Cerrar" className="h-9 w-9 rounded-lg text-lg text-gray-500 hover:bg-gray-100" disabled={isSending} onClick={onClose} type="button">x</button>
        </header>

        {!preview ? (
          <>
            <label className="mt-5 block text-sm font-semibold text-gray-800" htmlFor="communication-message">Mensaje adicional opcional</label>
            <textarea className="mt-2 min-h-28 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-50" disabled={isPreviewing} id="communication-message" maxLength={500} onChange={(event) => setMessage(event.target.value)} value={message} />
            {error && <p className="mt-3 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            <footer className="mt-6 flex justify-end gap-3"><button className="h-10 rounded-lg border border-gray-200 px-4 text-sm font-semibold text-gray-700" disabled={isPreviewing} onClick={onClose} type="button">Cancelar</button><button className="h-10 rounded-lg bg-brand-500 px-4 text-sm font-semibold text-white disabled:opacity-50" disabled={isPreviewing} onClick={() => void showPreview()} type="button">{isPreviewing ? "Preparando..." : "Ver previsualizacion"}</button></footer>
          </>
        ) : (
          <>
            <dl className="mt-5 grid gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm sm:grid-cols-2">
              <div><dt className="font-semibold text-gray-500">Asunto</dt><dd className="mt-1 text-gray-900">{valueOf(preview, ["asunto", "subject"])}</dd></div>
              <div><dt className="font-semibold text-gray-500">Destinatarios</dt><dd className="mt-1 text-gray-900">{recipients.length || valueOf(preview, ["total_destinatarios", "cantidad_destinatarios"])}</dd></div>
            </dl>
            <section className="mt-4"><h3 className="text-sm font-bold text-gray-900">Contenido</h3><p className="mt-2 whitespace-pre-wrap rounded-lg border border-gray-200 p-4 text-sm leading-6 text-gray-700">{valueOf(preview, ["contenido", "mensaje", "body"])}</p></section>
            {recipients.length > 0 && <section className="mt-4"><h3 className="text-sm font-bold text-gray-900">Destinatarios</h3><p className="mt-1 text-sm text-gray-600">{recipients.join(", ")}</p></section>}
            {warnings.length > 0 && <section className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900"><strong>Advertencias:</strong> {warnings.join(". ")}</section>}
            {omitted.length > 0 && <section className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700"><strong>Omitidos:</strong> {omitted.join(", ")}</section>}
            {error && <p className="mt-3 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            <footer className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button className="h-10 rounded-lg border border-gray-200 px-4 text-sm font-semibold text-gray-700" disabled={isSending} onClick={() => setPreview(null)} type="button">Editar mensaje</button><button className="h-10 rounded-lg bg-brand-500 px-4 text-sm font-semibold text-white disabled:opacity-50" disabled={isSending} onClick={() => void send()} type="button">{isSending ? "Enviando..." : "Confirmar envio"}</button></footer>
          </>
        )}
      </section>
    </div>
  );
}
