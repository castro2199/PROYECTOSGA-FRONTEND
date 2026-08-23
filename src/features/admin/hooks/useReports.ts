import { useCallback, useEffect, useState } from "react";
import { getReportsBundle } from "../services/reportsService";
import type { ReportsBundle } from "../types/reports.types";

export function useReports(token: string) {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [reports, setReports] = useState<ReportsBundle | null>(null);

  const loadReports = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await getReportsBundle(token);
      setReports(data);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "No se pudieron cargar los reportes.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void loadReports();
  }, [loadReports]);

  return {
    error,
    isLoading,
    reload: loadReports,
    reports,
  };
}
