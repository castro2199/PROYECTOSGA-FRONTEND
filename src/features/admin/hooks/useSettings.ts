import { useCallback, useEffect, useState } from "react";
import {
  getCurrentSettings,
  updateCurrentSettings,
} from "../services/settingsService";
import type {
  InstitutionalSettings,
  InstitutionalSettingsUpdatePayload,
} from "../types/settings.types";

export function useSettings(token: string) {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState<InstitutionalSettings | null>(null);

  const loadSettings = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await getCurrentSettings(token);
      setSettings(data);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "No se pudo cargar la configuracion.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  const saveSettings = async (payload: InstitutionalSettingsUpdatePayload) => {
    setIsSaving(true);
    setError(null);

    try {
      const updated = await updateCurrentSettings(token, payload);
      setSettings(updated);
      return updated;
    } catch (saveError) {
      const message =
        saveError instanceof Error
          ? saveError.message
          : "No se pudo actualizar la configuracion.";
      setError(message);
      throw new Error(message);
    } finally {
      setIsSaving(false);
    }
  };

  return {
    error,
    isLoading,
    isSaving,
    reload: loadSettings,
    saveSettings,
    settings,
  };
}
