export function formatApiValue(value: unknown): string {
  if (Array.isArray(value)) {
    return value.map(formatApiValue).filter(Boolean).join("; ");
  }

  if (value && typeof value === "object") {
    return Object.entries(value)
      .map(([field, fieldValue]) => `${field}: ${formatApiValue(fieldValue)}`)
      .join(", ");
  }

  if (value === null || value === undefined) return "";

  return String(value);
}

export function formatApiObject(data: Record<string, unknown>) {
  return Object.entries(data)
    .map(([field, value]) => `${field}: ${formatApiValue(value)}`)
    .filter(Boolean)
    .join(" ");
}

export function formatBulkUploadResult(
  result: Record<string, unknown>,
  fileName: string,
) {
  const created = result.creados ?? result.creados_count;
  const errors = result.errores;
  const parts = [`Archivo procesado: ${fileName}`];

  if (created !== undefined) {
    parts.push(`Creados: ${formatApiValue(created)}`);
  }

  if (Array.isArray(errors) && errors.length > 0) {
    parts.push(`Errores: ${formatApiValue(errors)}`);
  } else if (errors) {
    parts.push(`Errores: ${formatApiValue(errors)}`);
  }

  return parts.join(". ");
}
