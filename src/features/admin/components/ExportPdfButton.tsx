import { Download, LoaderCircle } from "lucide-react";
import { useState } from "react";
import { downloadReportPdf } from "../services/reportsService";

type Props = { filters: Record<string, string | number | boolean | undefined>; label?: string };

export function ExportPdfButton({ filters, label = "Exportar PDF" }: Props) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const download = async () => {
    setIsDownloading(true); setError(null);
    try { await downloadReportPdf(filters); } catch (reason) { setError(reason instanceof Error ? reason.message : "No se pudo generar el PDF."); } finally { setIsDownloading(false); }
  };
  return <div className="inline-flex flex-col items-end gap-2"><button aria-label={label} className="inline-flex h-10 items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60" disabled={isDownloading} onClick={() => void download()} title={label} type="button">{isDownloading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}{isDownloading ? "Generando PDF" : label}</button>{error && <p className="max-w-xs text-right text-xs text-red-700">{error}</p>}</div>;
}
