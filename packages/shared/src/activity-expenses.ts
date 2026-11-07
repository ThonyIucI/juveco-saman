/**
 * Gastos de una actividad (acordado 2026-11-07): impresión de cartillas, alquileres y demás.
 * Lo gastado en premios comprados **no** va acá: sale del costo del premio, así cada sol se
 * anota una sola vez.
 */
export const EXPENSE_CONCEPT_MAX_LENGTH = 80;

export const EXPENSE_CONCEPT_REQUIRED_MESSAGE = "Escribe el concepto del gasto.";
export const EXPENSE_CONCEPT_LENGTH_MESSAGE = "El concepto va hasta 80 caracteres.";

/** Un gasto tal como lo devuelve la API. */
export interface IActivityExpenseResource {
  id: string;
  activityId: string;
  concept: string;
  /** En soles con dos decimales. */
  amount: number;
  note: string | null;
  createdAt: string;
}

/** Lo que se escribe al crear o editar un gasto. */
export interface IActivityExpenseInput {
  concept: string;
  amount: number;
  note: string | null;
}

/** El balance de la actividad: lo que entra menos premios comprados y gastos. */
export interface IActivityBalance {
  /** Lo ya cobrado. */
  collected: number;
  /** Lo que se cobraría si todos pagan. */
  expected: number;
  purchasedPrizes: number;
  expenses: number;
  /** `collected - purchasedPrizes - expenses`. */
  currentProfit: number;
  /** `expected - purchasedPrizes - expenses`. */
  expectedProfit: number;
  donatedPrizeCount: number;
}
