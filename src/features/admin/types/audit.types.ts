export type AuditRecord = {
  id: number;
  user: number | null;
  user_username: string;
  user_full_name: string;
  accion: string;
  modulo: string;
  entidad: string;
  entidad_id: string | null;
  fecha: string;
};

export type PaginatedAuditResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: AuditRecord[];
};

export type AuditFilters = {
  ordering?: string;
  page?: number;
  search?: string;
};
