import { useState } from "react";

interface IUsePaginationOptions {
  /** Tamaño de página inicial. */
  initialPageSize?: number;
}

/**
 * Copia del `usePagination` del saas: paginado en el cliente sobre una lista ya filtrada.
 * Si un filtro deja la página actual fuera de rango, devuelve la última válida en vez de
 * una vista vacía, y calcula el rango «Mostrando X–Y de Z». Va junto con `ListPagination`.
 *
 * @param items Lista ya filtrada a paginar.
 */
export const usePagination = <TItem>(
  items: TItem[],
  { initialPageSize = 10 }: IUsePaginationOptions = {},
) => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const currentPage = Math.min(page, totalPages);

  const pagedItems = items.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const rangeStart = items.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const rangeEnd = Math.min(currentPage * pageSize, items.length);

  /** Cambia el tamaño de página y vuelve a la primera, para no quedar fuera de rango. */
  const changePageSize = (size: number) => {
    setPageSize(size);
    setPage(1);
  };

  /** Vuelve a la primera página (al cambiar la búsqueda). */
  const resetPage = () => setPage(1);

  return {
    currentPage,
    pageSize,
    totalPages,
    pagedItems,
    rangeStart,
    rangeEnd,
    totalItems: items.length,
    setPage,
    changePageSize,
    resetPage,
  };
};
