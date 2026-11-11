import { type IActivityItemResource, normalizeItemSerial } from "@juveco/shared/activity-items";
import { fullName } from "@juveco/shared/people";
import { roundSoles } from "@juveco/shared/money";

/** Cuántos ítems hay con cada serie (normalizada): más de uno es una serie repetida. */
export const countSerials = (items: IActivityItemResource[]): Map<string, number> => {
  const counts = new Map<string, number>();
  for (const item of items) {
    const serial = normalizeItemSerial(item.serial);
    counts.set(serial, (counts.get(serial) ?? 0) + 1);
  }
  return counts;
};

/** Otro ítem con la misma serie, sin contar el que se está editando. */
export const findSameSerial = (
  items: IActivityItemResource[],
  serial: string,
  exceptId?: string,
): IActivityItemResource | undefined => {
  const normalized = normalizeItemSerial(serial);
  return normalized
    ? items.find((item) => item.id !== exceptId && normalizeItemSerial(item.serial) === normalized)
    : undefined;
};

/**
 * Por serie, con los números en orden natural («2» antes que «10»). Es el orden de la lista
 * (Thony, 2026-11-08): una card no se mueve al registrar un pago, y las series repetidas
 * («0100» y «100») quedan una al lado de la otra.
 */
export const compareBySerial = (first: IActivityItemResource, second: IActivityItemResource): number =>
  normalizeItemSerial(first.serial).localeCompare(normalizeItemSerial(second.serial), "es", { numeric: true });

/**
 * Busca por serie, comprador o barrio. `term` ya viene sin espacios en los bordes y en
 * minúsculas. La serie se compara sin ceros a la izquierda: «0100» encuentra «100» y al revés.
 */
export const matchesActivityItemSearch = (item: IActivityItemResource, term: string): boolean =>
  item.serial.toLowerCase().includes(term) ||
  normalizeItemSerial(item.serial).includes(normalizeItemSerial(term)) ||
  fullName(item.buyer).toLowerCase().includes(term) ||
  (item.buyer.neighborhood?.name.toLowerCase().includes(term) ?? false);

/** Cómo va el cobro de un ítem: pagado, a medias o sin pagar. */
export type TCollectionStatus = "PAID" | "PARTIAL" | "UNPAID";

export interface IItemCollection {
  /** Lo que falta cobrar, nunca negativo. */
  pending: number;
  status: TCollectionStatus;
}

/** Lo que falta cobrar y su estado: 0 si pagó todo, el precio entero si no pagó nada. */
export const collectionOf = (item: IActivityItemResource): IItemCollection => {
  const paid = item.paidAmount;
  const pending = Math.max(roundSoles(item.price - paid), 0);
  const status: TCollectionStatus = pending === 0 ? "PAID" : paid > 0 ? "PARTIAL" : "UNPAID";
  return { pending, status };
};

/**
 * Los tabs del listado, en lugar del filtro «Estado de pago» (Thony, 2026-11-11): pagadas
 * son las cobradas al 100 %; por pagar, todas las que deben algo (a medias o sin pagar);
 * anuladas, las que se cambiaron porque se perdieron (el tab solo aparece si hay alguna).
 */
export type TPaymentTab = "PAID" | "PENDING" | "VOIDED";

export const paymentTabLabels: Record<TPaymentTab, string> = {
  PAID: "Pagadas",
  PENDING: "Por pagar",
  VOIDED: "Anuladas",
};

export const paymentTabOf = (item: IActivityItemResource): TPaymentTab =>
  item.voidedAt ? "VOIDED" : collectionOf(item).status === "PAID" ? "PAID" : "PENDING";

/**
 * Por cada ítem de un cambio de cartilla, la serie del otro: la anulada apunta a la que la
 * reemplazó y la nueva a la que anuló. Los que no salieron de un cambio no están.
 */
export const changedSerials = (items: IActivityItemResource[]): Map<string, string> => {
  const serialById = new Map(items.map((item) => [item.id, item.serial]));
  const related = new Map<string, string>();
  for (const item of items) {
    const replacedSerial = item.replacesId ? serialById.get(item.replacesId) : undefined;
    if (item.replacesId && replacedSerial) {
      related.set(item.id, replacedSerial);
      related.set(item.replacesId, item.serial);
    }
  }
  return related;
};

/** Filtros del listado (acordado 2026-11-07). Vacío (`""`) es «todos». */
export interface IActivityItemFilters {
  sellerId: string;
  neighborhoodId: string;
}

export const EMPTY_ITEM_FILTERS: IActivityItemFilters = { sellerId: "", neighborhoodId: "" };

/** Cuántos filtros hay puestos, para el globo del botón de filtros. */
export const countActiveFilters = (filters: IActivityItemFilters): number =>
  Object.values(filters).filter((value) => value !== "").length;

export const matchesItemFilters = (item: IActivityItemResource, filters: IActivityItemFilters): boolean =>
  (!filters.sellerId || item.seller.id === filters.sellerId) &&
  (!filters.neighborhoodId || item.buyer.neighborhood?.id === filters.neighborhoodId);

/** Los que vendieron algo en la actividad, sin repetir y por nombre. */
export const sellersOf = (items: IActivityItemResource[]): IActivityItemResource["seller"][] => {
  const byId = new Map<string, IActivityItemResource["seller"]>();
  for (const item of items) {
    byId.set(item.seller.id, item.seller);
  }
  return [...byId.values()].sort((a, b) => fullName(a).localeCompare(fullName(b)));
};
