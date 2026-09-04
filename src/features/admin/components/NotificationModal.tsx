import { useMemo, useState } from "react";
import type { Guardian } from "../types/guardian.types";
import type { GuardianStudentLink } from "../types/guardianStudentLink.types";
import type { Incident } from "../types/incident.types";
import type { Enrollment } from "../types/enrollment.types";
import type { AdminNotificationPayload } from "../types/notification.types";
import type {
  InstitutionalEmailPayload,
  InstitutionalEmailPreview,
} from "../types/institutionalEmail.types";

type Props = {
  enrollments: Enrollment[];
  error: string | null;
  guardians: Guardian[];
  isSaving: boolean;
  incidents: Incident[];
  links: GuardianStudentLink[];
  onClose: () => void;
  onPreview: (payload: InstitutionalEmailPayload) => Promise<InstitutionalEmailPreview>;
  onSubmit: (payload: { email: InstitutionalEmailPayload; notification: AdminNotificationPayload }) => Promise<void>;
};

type FormState = {
  apoderado: string;
  incidencia: string;
  mensaje: string;
  titulo: string;
};

const initialForm: FormState = {
  apoderado: "",
  incidencia: "",
  mensaje: "",
  titulo: "",
};

function incidentLabel(incident: Incident) {
  return `${incident.estudiante_codigo} - ${incident.estudiante_label}: ${incident.tipo}`;
}

export function NotificationModal({
  enrollments,
  error,
  guardians,
  incidents,
  isSaving,
  links,
  onClose,
  onPreview,
  onSubmit,
}: Props) {
  const [form, setForm] = useState<FormState>(initialForm);
  const [localError, setLocalError] = useState<string | null>(null);
  const [preview, setPreview] = useState<InstitutionalEmailPreview | null>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const selectedIncident = incidents.find(
    (incident) => incident.id === Number(form.incidencia),
  );
  const selectedEnrollment = enrollments.find(
    (enrollment) => enrollment.id === selectedIncident?.matricula,
  );
  const linkedGuardianIds = useMemo(() => {
    if (!selectedEnrollment) return new Set<number>();
    return new Set(
      links
        .filter((link) => link.estudiante === selectedEnrollment.estudiante)
        .map((link) => link.apoderado),
    );
  }, [links, selectedEnrollment]);
  const availableGuardians = guardians.filter(
    (guardian) => guardian.activo && linkedGuardianIds.has(guardian.id),
  );
  const selectedGuardian = guardians.find(
    (guardian) => guardian.id === Number(form.apoderado),
  );

  const update = <T extends keyof FormState>(key: T, value: FormState[T]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setLocalError(null);
    setPreview(null);
  };

  const selectIncident = (incidenceId: string) => {
    const incident = incidents.find((item) => item.id === Number(incidenceId));
    const enrollment = enrollments.find((item) => item.id === incident?.matricula);
    const guardianIds = new Set(
      links
        .filter((link) => link.estudiante === enrollment?.estudiante)
        .map((link) => link.apoderado),
    );
    const primary = links.find(
      (link) => link.estudiante === enrollment?.estudiante && link.es_principal,
    );
    const defaultGuardian = primary?.apoderado ?? [...guardianIds][0] ?? "";

    setForm((current) => ({
      ...current,
      apoderado: String(defaultGuardian),
      incidencia: incidenceId,
      titulo: current.titulo || (incident ? `Aviso sobre ${incident.tipo.toLowerCase()}` : ""),
    }));
    setLocalError(null);
    setPreview(null);
  };

  const getEmailPayload = (): InstitutionalEmailPayload | null => {
    if (!selectedGuardian || !selectedGuardian.email_display || !form.titulo.trim() || !form.mensaje.trim()) {
      setLocalError("Selecciona un apoderado con correo y completa el asunto y el mensaje.");
      return null;
    }
    return {
      accion_ruta: "/apoderado/mis-estudiantes",
      accion_texto: "Ver seguimiento",
      usuario_id: selectedGuardian.user_id,
      asunto: form.titulo.trim(),
      mensaje: form.mensaje.trim(),
    };
  };

  const requestPreview = async () => {
    const payload = getEmailPayload();
    if (!payload) return;
    setIsPreviewing(true);
    setLocalError(null);
    try {
      setPreview(await onPreview(payload));
    } catch (previewError) {
      setLocalError(previewError instanceof Error ? previewError.message : "No se pudo generar la vista previa.");
    } finally {
      setIsPreviewing(false);
    }
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.incidencia || !form.apoderado) {
      setLocalError("Selecciona una incidencia y un apoderado vinculado.");
      return;
    }
    if (!form.titulo.trim() || !form.mensaje.trim()) {
      setLocalError("Completa el asunto y el mensaje de la notificacion.");
      return;
    }
    const email = getEmailPayload();
    if (!email) return;
    await onSubmit({
      email,
      notification: {
        apoderado: Number(form.apoderado),
        incidencia: Number(form.incidencia),
        mensaje: form.mensaje.trim(),
        titulo: form.titulo.trim(),
      },
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/50 px-4 py-6">
      <div className="max-h-full w-full max-w-3xl overflow-y-auto rounded-lg bg-white shadow-theme-xl">
        <header className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-5 sm:px-6">
          <div>
            <p className="text-sm font-semibold text-brand-600">Comunicacion institucional</p>
            <h2 className="mt-1 text-xl font-bold text-gray-900">Nueva notificacion</h2>
          </div>

          <button aria-label="Cerrar" className="h-9 w-9 rounded-lg text-xl text-gray-500 hover:bg-gray-100 disabled:opacity-50" disabled={isSaving} onClick={onClose} type="button">x</button>
        </header>

        <form className="space-y-5 p-5 sm:p-6" onSubmit={(event) => void submit(event)}>
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700" htmlFor="notification-incident">Incidencia</label>
            <select className="h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none focus:border-brand-500" id="notification-incident" disabled={isSaving} onChange={(event) => selectIncident(event.target.value)} value={form.incidencia}>
              <option value="">Seleccionar incidencia</option>
              {incidents.filter((incident) => incident.estado !== "CERRADA").map((incident) => <option key={incident.id} value={incident.id}>{incidentLabel(incident)}</option>)}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700" htmlFor="notification-guardian">Apoderado destinatario</label>
            <select className="h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none focus:border-brand-500 disabled:bg-gray-50" id="notification-guardian" disabled={isSaving || !selectedIncident} onChange={(event) => update("apoderado", event.target.value)} value={form.apoderado}>
              <option value="">Seleccionar apoderado</option>
              {availableGuardians.map((guardian) => <option key={guardian.id} value={guardian.id}>{guardian.full_name} ({guardian.email_display || "sin correo"})</option>)}
            </select>
            {selectedIncident && availableGuardians.length === 0 && <p className="mt-2 text-sm text-amber-700">No hay apoderados activos vinculados a este estudiante. Crea el vinculo antes de enviar.</p>}
            {selectedGuardian && !selectedGuardian.email_display && <p className="mt-2 text-sm text-red-700">El apoderado seleccionado no tiene correo registrado.</p>}
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700" htmlFor="notification-title">Asunto</label>
            <input className="h-11 w-full rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-brand-500" id="notification-title" disabled={isSaving} maxLength={200} onChange={(event) => update("titulo", event.target.value)} value={form.titulo} />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700" htmlFor="notification-message">Mensaje</label>
            <textarea className="min-h-40 w-full rounded-lg border border-gray-200 px-3 py-3 text-sm leading-6 outline-none focus:border-brand-500" id="notification-message" disabled={isSaving} maxLength={5000} onChange={(event) => update("mensaje", event.target.value)} placeholder="Redacta una comunicacion clara para el apoderado." value={form.mensaje} />
          </div>

          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div><p className="text-sm font-semibold text-gray-900">Vista previa del correo</p><p className="mt-1 text-sm text-gray-600">La plantilla se adapta automaticamente al rol del destinatario.</p></div>
              <button className="h-10 rounded-lg border border-brand-200 bg-white px-4 text-sm font-semibold text-brand-700 hover:bg-brand-50 disabled:opacity-50" disabled={isSaving || isPreviewing || !selectedGuardian?.email_display} onClick={() => void requestPreview()} type="button">{isPreviewing ? "Generando..." : "Vista previa"}</button>
            </div>
            {preview && <pre className="mt-4 max-h-56 overflow-auto whitespace-pre-wrap border-t border-gray-200 pt-4 text-sm leading-6 text-gray-700">{preview.texto}</pre>}
          </div>

          {(localError || error) && <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{localError || error}</div>}

          <footer className="flex flex-col-reverse gap-3 border-t border-gray-100 pt-5 sm:flex-row sm:justify-end">
            <button className="h-11 rounded-lg border border-gray-200 px-4 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50" disabled={isSaving} onClick={onClose} type="button">Cancelar</button>
            <button className="h-11 rounded-lg bg-brand-500 px-4 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-50" disabled={isSaving || isPreviewing || !selectedGuardian?.email_display} type="submit">{isSaving ? "Enviando..." : "Enviar notificacion"}</button>
          </footer>
        </form>
      </div>
    </div>
  );
}
