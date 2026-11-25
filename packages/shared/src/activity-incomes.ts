/**
 * Ingresos de una actividad (acordado 2026-11-25): lo que entra y no es una venta con
 * comprador, como las inscripciones del campeonato o una venta del día. Suman al balance de la
 * actividad y, por ella, al de su proyecto. Tienen la misma forma que un gasto.
 */
import type { IActivityExpenseInput, IActivityExpenseResource } from "./activity-expenses";

export const INCOME_CONCEPT_MAX_LENGTH = 160;

export const INCOME_CONCEPT_REQUIRED_MESSAGE = "Escribe el concepto del ingreso.";
export const INCOME_CONCEPT_LENGTH_MESSAGE = "El concepto va hasta 160 caracteres.";

/** Un ingreso tal como lo devuelve la API. */
export type IActivityIncomeResource = IActivityExpenseResource;

/** Lo que se escribe al crear o editar un ingreso. */
export type IActivityIncomeInput = IActivityExpenseInput;
