type PaginationControlsProps = {
  currentPage: number;
  isLoading?: boolean;
  itemLabel?: string;
  onPageChange: (page: number) => void;
  pageSize: number;
  totalItems: number;
  totalPages: number;
};

export function PaginationControls({
  currentPage,
  isLoading = false,
  itemLabel = "registros",
  onPageChange,
  pageSize,
  totalItems,
  totalPages,
}: PaginationControlsProps) {
  if (totalItems === 0) return null;

  const firstItem = (currentPage - 1) * pageSize + 1;
  const lastItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="flex flex-col gap-3 border-t border-gray-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-gray-500">
        Mostrando {firstItem}-{lastItem} de {totalItems} {itemLabel}
      </p>
      <div className="flex items-center gap-3">
        <p className="text-sm text-gray-500">Pagina {currentPage} de {totalPages}</p>
        <div className="flex gap-2">
          <button
            aria-label="Pagina anterior"
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isLoading || currentPage <= 1}
            onClick={() => onPageChange(currentPage - 1)}
            type="button"
          >
            Anterior
          </button>
          <button
            aria-label="Pagina siguiente"
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isLoading || currentPage >= totalPages}
            onClick={() => onPageChange(currentPage + 1)}
            type="button"
          >
            Siguiente
          </button>
        </div>
      </div>
    </div>
  );
}
