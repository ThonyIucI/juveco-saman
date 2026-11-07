/** Marcador de elipsis (`…`) dentro del rango de páginas a mostrar. */
export const PAGINATION_ELLIPSIS = "ellipsis" as const;

export type TPaginationSlot = number | typeof PAGINATION_ELLIPSIS;

/** Páginas visibles a cada lado de la actual antes de colapsar con elipsis. */
const SIBLING_COUNT = 1;
/** Primera, última, actual + 2 vecinos + 2 elipsis = umbral para no truncar. */
const MAX_SLOTS_WITHOUT_ELLIPSIS = SIBLING_COUNT * 2 + 5;

/**
 * Copia de `getPaginationRange` del saas. Arma la secuencia de páginas a mostrar,
 * colapsando los tramos largos con elipsis (`1 … 4 5 6 … 20`). Siempre conserva la primera,
 * la última y los vecinos de la actual. Si caben todas, las devuelve completas.
 *
 * @param currentPage Página activa (desde 1).
 * @param totalPages Total de páginas.
 */
export const getPaginationRange = (currentPage: number, totalPages: number): TPaginationSlot[] => {
  if (totalPages <= MAX_SLOTS_WITHOUT_ELLIPSIS) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const leftSibling = Math.max(currentPage - SIBLING_COUNT, 1);
  const rightSibling = Math.min(currentPage + SIBLING_COUNT, totalPages);

  const showLeftEllipsis = leftSibling > 2;
  const showRightEllipsis = rightSibling < totalPages - 1;

  const range: TPaginationSlot[] = [1];

  if (showLeftEllipsis) {
    range.push(PAGINATION_ELLIPSIS);
  } else {
    for (let page = 2; page < leftSibling; page += 1) range.push(page);
  }

  for (let page = leftSibling; page <= rightSibling; page += 1) {
    if (page !== 1 && page !== totalPages) range.push(page);
  }

  if (showRightEllipsis) {
    range.push(PAGINATION_ELLIPSIS);
  } else {
    for (let page = rightSibling + 1; page < totalPages; page += 1) range.push(page);
  }

  range.push(totalPages);

  return range;
};
