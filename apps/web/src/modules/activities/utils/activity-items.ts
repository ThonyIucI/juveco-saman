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

/** Por serie, con los números en orden natural («2» antes que «10»). */
export const compareBySerial = (first: IActivityItemResource, second: IActivityItemResource): number =>
  first.serial.localeCompare(second.serial, "es", { numeric: true });

/** Busca por serie, comprador o barrio. `term` ya viene sin espacios en los bordes y en minúsculas. */
export const matchesActivityItemSearch = (item: IActivityItemResource, term: string): boolean =>
  item.serial.toLowerCase().includes(term) ||
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
