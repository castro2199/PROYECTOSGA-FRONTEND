import { useCallback, useEffect, useState } from "react";
import {
  getInstitutionalEmails,
  previewInstitutionalEmail,
  sendInstitutionalEmail,
} from "../services/institutionalEmailsService";
import type {
  InstitutionalEmail,
  InstitutionalEmailPayload,
  InstitutionalEmailPreview,
} from "../types/institutionalEmail.types";

export function useInstitutionalEmails(token: string) {
  const [emails, setEmails] = useState<InstitutionalEmail[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const reload = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setEmails(await getInstitutionalEmails(token));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "No se pudo cargar el historial de correos.");
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const preview = useCallback(async (payload: InstitutionalEmailPayload): Promise<InstitutionalEmailPreview> => {
    return previewInstitutionalEmail(token, payload);
  }, [token]);

  const send = useCallback(async (payload: InstitutionalEmailPayload) => {
    setIsSaving(true);
    setError(null);
    try {
      const email = await sendInstitutionalEmail(token, payload);
      setEmails((current) => [email, ...current.filter((item) => item.id !== email.id)]);
      return email;
    } catch (sendError) {
      const message = sendError instanceof Error ? sendError.message : "No se pudo enviar el correo institucional.";
      setError(message);
      throw new Error(message);
    } finally {
      setIsSaving(false);
    }
  }, [token]);

  return { emails, error, isLoading, isSaving, preview, reload, send };
}
