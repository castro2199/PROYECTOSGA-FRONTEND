import { useCallback, useEffect, useState } from "react";
import { getAuditRecords } from "../services/auditService";
import type { AuditFilters, AuditRecord } from "../types/audit.types";

export function useAudit(token: string, filters: AuditFilters) {
  const [count, setCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [next, setNext] = useState<string | null>(null);
  const [previous, setPrevious] = useState<string | null>(null);
  const [records, setRecords] = useState<AuditRecord[]>([]);

  const loadAudit = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await getAuditRecords(token, filters);
      setCount(data.count);
      setNext(data.next);
      setPrevious(data.previous);
      setRecords(data.results ?? []);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "No se pudo cargar la auditoria.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [filters, token]);

  useEffect(() => {
    void loadAudit();
  }, [loadAudit]);

  return {
    count,
    error,
    isLoading,
    next,
    previous,
    records,
    reload: loadAudit,
  };
}
