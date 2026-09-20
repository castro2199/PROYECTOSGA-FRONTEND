import { authFetch } from "../../auth/services/authService";

export class DashboardRequestError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "DashboardRequestError";
    this.status = status;
  }
}

function errorMessage(data: unknown, fallback: string) {
  if (!data || typeof data !== "object") return fallback;

  const record = data as Record<string, unknown>;
  for (const key of ["detail", "message", "error"]) {
    if (typeof record[key] === "string" && record[key].trim()) return record[key];
  }

  for (const value of Object.values(record)) {
    if (Array.isArray(value) && typeof value[0] === "string") return value[0];
    if (typeof value === "string" && value.trim()) return value;
  }

  return fallback;
}

export async function getDashboard(
  filters: Record<string, string>,
  signal?: AbortSignal,
): Promise<unknown> {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value.trim()) params.set(key, value);
  });

  const query = params.toString();
  const response = await authFetch(`/api/dashboard/${query ? `?${query}` : ""}`, {
    signal,
  });
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new DashboardRequestError(
      errorMessage(data, "No se pudo actualizar el dashboard."),
      response.status,
    );
  }

  return data;
}
