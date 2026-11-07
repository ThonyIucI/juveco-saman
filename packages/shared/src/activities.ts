/**
 * Actividades de Juveco (acordado 2026-11-07): por ahora solo bingos. Cada una tiene su fecha
 * y su precio por defecto; la primera, «Bingo II - 2026», la crea una migración.
 */

export enum EActivityType {
  BINGO = "BINGO",
}

export type TActivityType = `${EActivityType}`;

export const activityTypeLabels: Record<TActivityType, string> = {
  [EActivityType.BINGO]: "Bingo",
};

interface IActivityItemLabel {
  singular: string;
  plural: string;
}

/**
 * Cómo se llama lo que se vende en cada tipo de actividad. Los textos de la pantalla lo
 * usan en femenino («la primera cartilla»): si un tipo nuevo es masculino, revisarlos.
 */
export const activityItemLabels: Record<TActivityType, IActivityItemLabel> = {
  [EActivityType.BINGO]: { singular: "cartilla", plural: "cartillas" },
};

/** Una actividad tal como la devuelve la API. */
export interface IActivityResource {
  id: string;
  name: string;
  type: TActivityType;
  /** «2026-11-21», sin hora (ver `dates.ts`). */
  eventDate: string;
  /** En soles con dos decimales (ver `money.ts`). Lo que toma una cartilla nueva. */
  defaultPrice: number;
}
