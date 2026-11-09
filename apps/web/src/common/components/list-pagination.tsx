import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@juveco/ui/components/pagination";
import { Skeleton } from "@juveco/ui/components/skeleton";
import { cn } from "@juveco/ui/lib/utils";

import PageSizeSelect from "@/common/components/page-size-select";
import { useMediaQuery } from "@/common/hooks/use-media-query";
import { getPaginationRange, PAGINATION_ELLIPSIS } from "@/common/utils/pagination-range";

const DESKTOP_QUERY = "(min-width: 640px)";

interface IListPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  /** Si se pasan los tres, muestra el selector de filas por página a la izquierda. */
  pageSize?: number;
  pageSizeOptions?: number[];
  onPageSizeChange?: (size: number) => void;
  className?: string;
}

/**
 * Copia del `ListPagination` del saas. Pie del listado: dentro de la card de la tabla en
 * escritorio, en su propia barra en celular. Se oculta si no hay nada que mostrar.
 */
export default function ListPagination({
  currentPage,
  totalPages,
  onPageChange,
  pageSize,
  pageSizeOptions,
  onPageSizeChange,
  className,
}: IListPaginationProps) {
  const isDesktop = useMediaQuery(DESKTOP_QUERY);
  const showPageSize = pageSize !== undefined && !!pageSizeOptions && !!onPageSizeChange;
  const showPages = totalPages > 1;

  if (!showPageSize && !showPages) {
    return null;
  }

  const goToPage = (page: number) => {
    if (page < 1 || page > totalPages) {
      return;
    }
    onPageChange(page);
  };

  return (
    <div
      className={cn(
        "flex flex-col-reverse items-center gap-3 sm:flex-row",
        showPageSize && showPages
          ? "sm:justify-between"
          : showPages
            ? "sm:justify-end"
            : "sm:justify-start",
        className,
      )}
    >
      {showPageSize && (
        <PageSizeSelect value={pageSize} options={pageSizeOptions} onChange={onPageSizeChange} />
      )}

      {showPages && (
        /*
          En celular ocupa todo el ancho: «‹» y «›» en los extremos y las páginas repartidas, para
          que no quede apretado al centro con aire a los costados (Thony, 2026-11-09).
        */
        <Pagination className="mx-0 w-full self-stretch sm:w-auto sm:self-auto sm:justify-end">
          <PaginationContent className="w-full justify-between sm:w-auto sm:justify-start">
            <PaginationItem>
              <PaginationPrevious
                onClick={() => goToPage(currentPage - 1)}
                aria-disabled={currentPage === 1}
                className={cn("cursor-pointer", currentPage === 1 && "pointer-events-none opacity-40")}
              />
            </PaginationItem>
            {getPaginationRange(currentPage, totalPages, isDesktop ? 1 : 0).map((slot, index) =>
              slot === PAGINATION_ELLIPSIS ? (
                <PaginationItem key={`ellipsis-${index}`}>
                  <PaginationEllipsis />
                </PaginationItem>
              ) : (
                <PaginationItem key={slot}>
                  <PaginationLink
                    isActive={currentPage === slot}
                    onClick={() => goToPage(slot)}
                    /* En celular 32 px y sin vecinas: «‹ 1 … 6 … 10 ›» entra sin desbordarse. */
                    className="size-8 cursor-pointer sm:size-9"
                  >
                    {slot}
                  </PaginationLink>
                </PaginationItem>
              ),
            )}
            <PaginationItem>
              <PaginationNext
                onClick={() => goToPage(currentPage + 1)}
                aria-disabled={currentPage === totalPages}
                className={cn(
                  "cursor-pointer",
                  currentPage === totalPages && "pointer-events-none opacity-40",
                )}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}

interface IResultsCounterProps {
  from: number;
  to: number;
  total: number;
  isLoading?: boolean;
  className?: string;
}

/** Copia del `ResultsCounter` del saas: «Mostrando X–Y de Z». */
export function ResultsCounter({ from, to, total, isLoading, className }: IResultsCounterProps) {
  if (isLoading) {
    return <Skeleton className={cn("h-4 w-40 rounded-md", className)} />;
  }
  if (total === 0) {
    return null;
  }
  return (
    <p className={cn("text-sm text-muted-foreground", className)}>
      Mostrando {from}–{to} de {total}
    </p>
  );
}
