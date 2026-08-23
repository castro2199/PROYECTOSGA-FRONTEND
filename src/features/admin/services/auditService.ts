import { authFetch } from "../../auth/services/authService";
import type {
  AuditFilters,
  PaginatedAuditResponse,
} from "../types/audit.types";
import { formatApiObject } from "../utils/apiMessages";

const AUDIT_URL = "/api/auditoria/";

async function readError(response: Response) {
  const data = await response.json().catch(() => null);

  if (data && typeof data === "object") {
    const messages = formatApiObject(data as Record<string, unknown>);

    if (messages) return messages;
  }

  return "No se pudo completar la operacion.";
}

export async function getAuditRecords(
  token: string,
  filters: AuditFilters = {},
): Promise<PaginatedAuditResponse> {
  const params = new URLSearchParams();

  if (filters.search?.trim()) {
    params.set("search", filters.search.trim());
  }

  if (filters.ordering) {
    params.set("ordering", filters.ordering);
  }

  if (filters.page && filters.page > 1) {
    params.set("page", String(filters.page));
  }

  const url = params.size ? `${AUDIT_URL}?${params.toString()}` : AUDIT_URL;

  const response = await authFetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(await readError(response));
  }

  return (await response.json()) as PaginatedAuditResponse;
}
