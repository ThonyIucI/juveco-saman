/**
 * Premios de una actividad (acordado 2026-11-07). Un premio es **donado** (por una persona;
 * si dona un negocio, va en la nota) o **comprado** (con su costo, que se resta de lo
 * recaudado en el balance). Los ganadores se ven después.
 */
import type { IActivityItemPerson } from "./activity-items";

export const EPrizeOrigin = {
  DONATED: "DONATED",
  PURCHASED: "PURCHASED",
} as const;

export type TPrizeOrigin = (typeof EPrizeOrigin)[keyof typeof EPrizeOrigin];

export const PRIZE_ORIGINS = Object.values(EPrizeOrigin) as [TPrizeOrigin, ...TPrizeOrigin[]];

export const prizeOriginLabels: Record<TPrizeOrigin, string> = {
  [EPrizeOrigin.DONATED]: "Donado",
  [EPrizeOrigin.PURCHASED]: "Comprado",
};

export const PRIZE_NAME_MAX_LENGTH = 80;

export const PRIZE_NAME_REQUIRED_MESSAGE = "Escribe el nombre del premio.";
export const PRIZE_NAME_LENGTH_MESSAGE = "El nombre va hasta 80 caracteres.";
export const PRIZE_ORIGIN_REQUIRED_MESSAGE = "Elige si fue donado o comprado.";
export const PRIZE_DONOR_REQUIRED_MESSAGE = "Elige quién lo donó.";
export const PRIZE_COST_REQUIRED_MESSAGE = "Escribe cuánto costó.";

/** Un premio tal como lo devuelve la API. */
export interface IActivityPrizeResource {
  id: string;
  activityId: string;
  name: string;
  origin: TPrizeOrigin;
  /** Solo si es donado. */
  donor: IActivityItemPerson | null;
  /** Solo si es comprado; en soles con dos decimales. */
  cost: number | null;
  note: string | null;
  createdAt: string;
}

/** Lo que se escribe al crear o editar un premio. Donado lleva `donorId`; comprado, `cost`. */
export interface IActivityPrizeInput {
  name: string;
  origin: TPrizeOrigin;
  donorId: string | null;
  cost: number | null;
  note: string | null;
}
