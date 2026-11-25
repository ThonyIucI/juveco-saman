/**
 * Lo que ve cualquier visitante en la portada (acordado 2026-11-25). Del balance van los montos
 * **por concepto** (Thony, 2026-11-25), nunca cuánto dio cada persona, y la lista de quienes
 * apoyaron solo con el nombre. Nada de teléfonos ni notas.
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
}

/** De dónde viene un ingreso: decide el color de su tramo en la barra. */
export enum EPublicIncomeSource {
  SALES = "SALES",
  DONATIONS = "DONATIONS",
  OTHER = "OTHER",
}

export type TPublicIncomeSource = `${EPublicIncomeSource}`;

/** Un concepto con su total en soles, sumado en todo el proyecto. */
export interface IPublicAccountLine {
  label: string;
  amount: number;
}

export interface IPublicIncomeLine extends IPublicAccountLine {
  source: TPublicIncomeSource;
}

/**
 * Cuentas claras de un proyecto: lo que entró de verdad, lo que se usó y lo que queda. Los
 * donativos de personas van sumados en un solo renglón («Donaciones y apoyos»).
 */
export interface IPublicAccounts {
  /** Ventas cobradas más otros ingresos. */
  collected: number;
  /** Gastos más premios comprados. */
  spent: number;
  /** `collected - spent`. */
  remaining: number;
  incomes: IPublicIncomeLine[];
  expenses: IPublicAccountLine[];
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
  accounts: IPublicAccounts;
  /** Quienes apoyaron (hoy, los que donaron un premio), sin repetir y por nombre. */
  supporters: string[];
}

export interface IPublicHome {
  /** El evento o proyecto más reciente; `null` si todavía no hay ninguno. */
  project: IPublicProject | null;
}
