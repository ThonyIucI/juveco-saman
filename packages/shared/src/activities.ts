/**
 * Actividades de Juveco (acordado 2026-11-07): bingos y, desde el 2026-11-19, campeonatos.
 * Cada una tiene su fecha y su precio por defecto (en un bingo, la cartilla; en un campeonato,
 * la inscripción de cada equipo). Las crea una migración: no hay pantalla para crearlas.
 */

export enum EActivityType {
  BINGO = "BINGO",
  CHAMPIONSHIP = "CHAMPIONSHIP",
}

export type TActivityType = `${EActivityType}`;

export const activityTypeLabels: Record<TActivityType, string> = {
  [EActivityType.BINGO]: "Bingo",
  [EActivityType.CHAMPIONSHIP]: "Campeonato",
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
  /* En un campeonato lo que se cobra son las inscripciones de los equipos, no ventas sueltas. */
  [EActivityType.CHAMPIONSHIP]: { singular: "venta", plural: "ventas" },
};

/** Una actividad tal como la devuelve la API. */
export interface IActivityResource {
  id: string;
  /** Evento o proyecto al que pertenece. */
  projectId: string | null;
  name: string;
  type: TActivityType;
  /** «2026-11-21», sin hora (ver `dates.ts`). */
  eventDate: string;
  /** En soles con dos decimales (ver `money.ts`). Lo que toma una cartilla nueva. */
  defaultPrice: number;
}
