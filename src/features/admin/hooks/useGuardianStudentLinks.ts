import { useCallback, useEffect, useState } from "react";
import {
  createGuardianStudentLink,
  getGuardianStudentLinks,
} from "../services/guardianStudentLinksService";
import type {
  GuardianStudentLink,
  GuardianStudentLinkPayload,
} from "../types/guardianStudentLink.types";

export function useGuardianStudentLinks(token: string) {
  const [links, setLinks] = useState<GuardianStudentLink[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const loadLinks = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await getGuardianStudentLinks(token);
      setLinks(data);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "No se pudo cargar los vinculos de apoderados.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void loadLinks();
  }, [loadLinks]);

  const addLink = async (payload: GuardianStudentLinkPayload) => {
    setIsSaving(true);
    setError(null);

    try {
      const created = await createGuardianStudentLink(token, payload);
      await loadLinks();
      return created;
    } catch (saveError) {
      const message =
        saveError instanceof Error
          ? saveError.message
          : "No se pudo asignar el estudiante.";
      setError(message);
      throw new Error(message);
    } finally {
      setIsSaving(false);
    }
  };

  return {
    addLink,
    error,
    isLoading,
    isSaving,
    links,
    reload: loadLinks,
  };
}
