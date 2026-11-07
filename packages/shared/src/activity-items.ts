/**
 * Lo que se vende en una actividad (acordado 2026-11-07): en un bingo, las cartillas; en otra
 * actividad, lo que corresponda (cómo se llama sale de `activityItemLabels`). Cada uno lleva
 * su serie, quién lo compró, el administrador que lo vendió y su precio. Una serie repetida en
 * la misma actividad se deja guardar, pero se avisa.
 */
import type { INeighborhood } from "./neighborhoods";

export const ACTIVITY_ITEM_SERIAL_MAX_LENGTH = 20;

export const ACTIVITY_ITEM_SERIAL_REQUIRED_MESSAGE = "Escribe la serie.";
export const ACTIVITY_ITEM_SERIAL_LENGTH_MESSAGE = "La serie va hasta 20 caracteres.";
export const ACTIVITY_ITEM_BUYER_REQUIRED_MESSAGE = "Elige quién lo compró.";

/** Una persona del ítem, con lo justo para la card. */
export interface IActivityItemPerson {
  id: string;
  firstName: string;
  lastName: string | null;
}

export interface IActivityItemBuyer extends IActivityItemPerson {
  neighborhood: INeighborhood | null;
}

/** Un ítem vendido tal como lo devuelve la API. */
export interface IActivityItemResource {
  id: string;
  activityId: string;
  serial: string;
  /** En soles con dos decimales (ver `money.ts`). */
  price: number;
  /** La suma de sus pagos; lo que falta cobrar es `price - paidAmount`. */
  paidAmount: number;
  buyer: IActivityItemBuyer;
  /** El administrador que lo vendió: el que lo registró. */
  seller: IActivityItemPerson;
  note: string | null;
  createdAt: string;
}

/** Lo que se escribe al vender o editar un ítem. */
export interface IActivityItemInput {
  serial: string;
  buyerId: string;
  /** Sin precio, toma el precio por defecto de la actividad. */
  price?: number;
  note: string | null;
}

/** Para comparar series: «a-0125 » y «A-0125» son la misma. */
export const normalizeItemSerial = (serial: string): string => serial.trim().toUpperCase();
