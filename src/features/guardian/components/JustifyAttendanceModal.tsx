import { useState, type FormEvent } from "react";
import {
  JustificationRequestError,
  submitJustification,
  type AttendanceJustification,
  type JustificationUploadStage,
} from "../services/justificationService";

type AttendanceContext = {
  id: number;
  cursoNombre: string;
  estadoLabel: string;
  estudianteNombre: string;
  fecha: string;
};

type Props = {
  attendance: AttendanceContext;
  onClose: () => void;
  onSaved: (justification: AttendanceJustification) => Promise<void> | void;
};

const MAX_FILE_SIZE = 8 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["application/pdf", "image/jpeg", "image/png"]);

function formatDate(value: string) {
  const date = new Date(`${value.slice(0, 10)}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString("es-PE", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });
}

function stageLabel(stage: JustificationUploadStage | null, progress: number | null) {
  if (stage === "requesting") return "Solicitando carga segura...";
  if (stage === "confirming") return "Confirmando el sustento...";
  if (stage === "uploading") {
    return progress === null ? "Subiendo sustento..." : `Subiendo sustento: ${progress}%`;
  }
  return "";
}

function fieldMessages(error: unknown) {
  if (!(error instanceof JustificationRequestError)) return {};
  if (!error.details || typeof error.details !== "object" || Array.isArray(error.details)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(error.details as Record<string, unknown>).flatMap(([key, value]) => {
      if (typeof value === "string") return [[key, value]];
      if (Array.isArray(value) && typeof value[0] === "string") {
        return [[key, value[0]]];
      }
      return [];
    }),
  ) as Record<string, string>;
}

export function JustifyAttendanceModal({ attendance, onClose, onSaved }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [motivo, setMotivo] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [stage, setStage] = useState<JustificationUploadStage | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorsByField, setErrorsByField] = useState<Record<string, string>>({});
  const [isComplete, setIsComplete] = useState(false);

  const chooseFile = (nextFile: File | null) => {
    setError(null);
    setErrorsByField({});

    if (!nextFile) {
      setFile(null);
      return;
    }

    if (!ALLOWED_TYPES.has(nextFile.type)) {
      setFile(null);
      setError("Selecciona un archivo PDF, JPG/JPEG o PNG.");
      return;
    }

    if (nextFile.size > MAX_FILE_SIZE) {
      setFile(null);
      setError("El archivo no puede superar 8 MiB.");
      return;
    }

    setFile(nextFile);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedReason = motivo.trim();

    if (trimmedReason.length < 10 || trimmedReason.length > 2000) {
      setErrorsByField({
        motivo: "El motivo debe tener entre 10 y 2000 caracteres.",
      });
      return;
    }

    if (!file) {
      setErrorsByField({ archivo: "Adjunta un archivo de sustento." });
      return;
    }

    setIsSaving(true);
    setError(null);
    setErrorsByField({});
    setProgress(null);

    try {
      const justification = await submitJustification(attendance.id, file, trimmedReason, {
        onProgress: setProgress,
        onStage: setStage,
      });
      await onSaved(justification);
      setIsComplete(true);
      setStage(null);
    } catch (requestError) {
      setErrorsByField(fieldMessages(requestError));
      setError(
        requestError instanceof Error
          ? requestError.message
          : "No se pudo enviar la justificacion.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-[70] flex items-center justify-center bg-gray-950/50 p-4"
      role="dialog"
    >
      <section className="max-h-full w-full max-w-lg overflow-y-auto rounded-lg bg-white p-6 shadow-theme-xl">
        {isComplete ? (
          <div className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-xl font-bold text-green-700">
              OK
            </div>
            <h2 className="mt-4 text-xl font-bold text-gray-900">
              Justificacion enviada para revision
            </h2>
            <p className="mt-2 text-sm leading-6 text-gray-600">
              El docente revisara el sustento. La asistencia se actualizara cuando
              apruebe la justificacion.
            </p>
            <button
              className="mt-6 h-10 rounded-lg bg-brand-500 px-5 text-sm font-semibold text-white hover:bg-brand-600"
              onClick={onClose}
              type="button"
            >
              Listo
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-brand-600">Asistencia</p>
                <h2 className="mt-1 text-xl font-bold text-gray-900">
                  Justificar falta
                </h2>
              </div>
              <button
                aria-label="Cerrar"
                className="flex h-9 w-9 items-center justify-center rounded-lg text-lg text-gray-500 hover:bg-gray-100 disabled:opacity-50"
                disabled={isSaving}
                onClick={onClose}
                type="button"
              >
                x
              </button>
            </div>

            <dl className="mt-5 grid gap-3 rounded-lg bg-gray-50 p-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-gray-500">Estudiante</dt>
                <dd className="mt-1 font-semibold text-gray-900">
                  {attendance.estudianteNombre}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">Curso</dt>
                <dd className="mt-1 font-semibold text-gray-900">
                  {attendance.cursoNombre}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">Fecha</dt>
                <dd className="mt-1 font-semibold text-gray-900">
                  {formatDate(attendance.fecha)}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">Estado</dt>
                <dd className="mt-1 font-semibold text-gray-900">
                  {attendance.estadoLabel}
                </dd>
              </div>
            </dl>

            <label className="mt-5 block text-sm font-semibold text-gray-700">
              Motivo
              <textarea
                className="mt-2 min-h-28 w-full rounded-lg border border-gray-200 px-3 py-3 text-sm outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-50"
                disabled={isSaving}
                maxLength={2000}
                minLength={10}
                onChange={(event) => {
                  setMotivo(event.target.value);
                  setErrorsByField((current) => ({ ...current, motivo: "" }));
                }}
                required
                value={motivo}
              />
              <span className="mt-1 block text-xs font-normal text-gray-500">
                {motivo.length}/2000 caracteres
              </span>
            </label>
            {errorsByField.motivo && (
              <p className="mt-1 text-sm text-red-700">{errorsByField.motivo}</p>
            )}

            <label className="mt-4 block text-sm font-semibold text-gray-700">
              Sustento
              <input
                accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                className="mt-2 block w-full text-sm font-normal text-gray-700"
                disabled={isSaving}
                onChange={(event) => chooseFile(event.target.files?.[0] ?? null)}
                required
                type="file"
              />
              <span className="mt-1 block text-xs font-normal text-gray-500">
                PDF, JPG o PNG. Maximo 8 MiB.
              </span>
            </label>
            {file && (
              <p className="mt-2 text-xs text-gray-600">
                {file.name} / {(file.size / 1024 / 1024).toFixed(2)} MiB
              </p>
            )}
            {errorsByField.archivo && (
              <p className="mt-1 text-sm text-red-700">{errorsByField.archivo}</p>
            )}

            {isSaving && (
              <div className="mt-4 rounded-lg border border-brand-100 bg-brand-50 p-3 text-sm text-brand-800">
                <div className="flex items-center justify-between gap-3">
                  <span>{stageLabel(stage, progress)}</span>
                  {progress !== null && <strong>{progress}%</strong>}
                </div>
                {stage === "uploading" && progress !== null && (
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-brand-100">
                    <div
                      className="h-full rounded-full bg-brand-500 transition-[width]"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                )}
              </div>
            )}

            {error && (
              <p className="mt-4 rounded-lg border border-red-100 bg-red-50 p-3 text-sm text-red-700">
                {error}
              </p>
            )}

            <footer className="mt-6 flex justify-end gap-3 border-t border-gray-100 pt-5">
              <button
                className="h-10 rounded-lg border border-gray-200 px-4 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                disabled={isSaving}
                onClick={onClose}
                type="button"
              >
                Cancelar
              </button>
              <button
                className="h-10 rounded-lg bg-brand-500 px-4 text-sm font-semibold text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isSaving}
                type="submit"
              >
                {isSaving ? "Enviando..." : "Enviar justificacion"}
              </button>
            </footer>
          </form>
        )}
      </section>
    </div>
  );
}
