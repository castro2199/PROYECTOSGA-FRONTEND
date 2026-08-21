type ConfirmStatusModalProps = {
  actionLabel: string;
  entityLabel: string;
  error: string | null;
  isSaving: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function ConfirmStatusModal({
  actionLabel,
  entityLabel,
  error,
  isSaving,
  onCancel,
  onConfirm,
}: ConfirmStatusModalProps) {
  const normalizedAction = actionLabel.toLowerCase();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-theme-xl">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-50">
          <img
            alt=""
            className="h-7 w-7"
            src={
              normalizedAction.includes("desactivar")
                ? "/admin-icons/trash.svg"
                : "/admin-icons/check-circle.svg"
            }
          />
        </div>

        <div className="mt-5 text-center">
          <h2 className="text-xl font-bold text-gray-900">
            Confirmar cambio de estado
          </h2>
          <p className="mt-3 text-sm leading-6 text-gray-600">
            ¿Deseas {normalizedAction}{" "}
            <span className="font-semibold text-gray-900">{entityLabel}</span>
            ? Esta acción actualizará el registro.
          </p>
        </div>

        {error && (
          <div className="mt-5 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <button
            className="rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
            disabled={isSaving}
            onClick={onCancel}
            type="button"
          >
            {isSaving ? "Espere..." : "Cancelar"}
          </button>
          <button
            className={`rounded-lg px-4 py-3 text-sm font-semibold text-white shadow-theme-sm transition disabled:cursor-not-allowed disabled:opacity-70 ${
              normalizedAction.includes("desactivar")
                ? "bg-red-600 hover:bg-red-700"
                : "bg-success-500 hover:bg-success-700"
            }`}
            disabled={isSaving}
            onClick={onConfirm}
            type="button"
          >
            {isSaving ? "Procesando..." : `Sí, ${normalizedAction}`}
          </button>
        </div>
      </div>
    </div>
  );
}
