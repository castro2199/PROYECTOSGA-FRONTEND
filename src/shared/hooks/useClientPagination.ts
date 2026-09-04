import { useEffect, useMemo, useState } from "react";

export type ClientPaginationResult<T> = {
  currentPage: number;
  pageItems: T[];
  pageSize: number;
  setCurrentPage: (page: number | ((current: number) => number)) => void;
  totalItems: number;
  totalPages: number;
};

export function useClientPagination<T>(
  items: T[],
  pageSize = 10,
): ClientPaginationResult<T> {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));

  useEffect(() => {
    setCurrentPage((page) => Math.min(Math.max(1, page), totalPages));
  }, [totalPages]);

  const pageItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [currentPage, items, pageSize]);

  return {
    currentPage,
    pageItems,
    pageSize,
    setCurrentPage,
    totalItems: items.length,
    totalPages,
  };
}
