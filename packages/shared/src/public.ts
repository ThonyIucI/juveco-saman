/**
 * Lo que ve cualquier visitante en la portada (acordado 2026-11-25). Del balance van solo los
 * conceptos, **sin montos**, y la lista de quienes apoyaron. Nada de teléfonos ni notas.
 */
import type { TActivityType } from "./activities";
import type { TProjectType } from "./projects";

/** Un premio con quién lo donó y, ya sorteado, quién lo ganó. */
export interface IPublicPrize {
  name: string;
  /** Vacío si fue comprado. */
  donorName: string | null;
  winner: { serial: string; name: string } | null;
}

export interface IPublicActivity {
  id: string;
  name: string;
  type: TActivityType;
  /** «2026-11-28». */
  eventDate: string;
  prizes: IPublicPrize[];
  /** De dónde entró la plata, sin montos: «Venta de cartillas», «Inscripciones»… */
  incomeConcepts: string[];
  /** En qué se gastó, sin montos. */
  expenseConcepts: string[];
}

export interface IPublicProject {
  id: string;
  type: TProjectType;
  name: string;
  description: string | null;
  startDate: string;
  endDate: string | null;
  beneficiaryCount: number | null;
  isClosed: boolean;
  activities: IPublicActivity[];
  /** Quienes apoyaron (hoy, los que donaron un premio), sin repetir y por nombre. */
  supporters: string[];
}

export interface IPublicHome {
  /** El evento o proyecto más reciente; `null` si todavía no hay ninguno. */
  project: IPublicProject | null;
}
