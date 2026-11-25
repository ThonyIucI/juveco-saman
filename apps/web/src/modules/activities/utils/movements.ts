import {
  EXPENSE_CONCEPT_LENGTH_MESSAGE,
  EXPENSE_CONCEPT_MAX_LENGTH,
  EXPENSE_CONCEPT_REQUIRED_MESSAGE,
} from "@juveco/shared/activity-expenses";
import {
  INCOME_CONCEPT_LENGTH_MESSAGE,
  INCOME_CONCEPT_MAX_LENGTH,
  INCOME_CONCEPT_REQUIRED_MESSAGE,
} from "@juveco/shared/activity-incomes";

/**
 * Un movimiento de la actividad: un ingreso (inscripciones, una venta del día) o un gasto
 * (impresión, alquiler). Tienen la misma forma, así comparten formulario, lista y hooks.
 */
export type TMovementKind = "income" | "expense";

interface IMovementLabels {
  /** «Ingresos», título de la lista. */
  title: string;
  /** «ingreso», para los mensajes. */
  singular: string;
  /** «Ingreso», al inicio de un toast. */
  singularCapitalized: string;
  empty: string;
  newTitle: string;
  editTitle: string;
  conceptMaxLength: number;
  conceptRequiredMessage: string;
  conceptLengthMessage: string;
  /** El tramo de la ruta en la API: `/activities/:id/incomes`. */
  path: string;
}

export const movementLabels: Record<TMovementKind, IMovementLabels> = {
  income: {
    title: "Ingresos",
    singular: "ingreso",
    singularCapitalized: "Ingreso",
    empty: "Todavía no hay ingresos.",
    newTitle: "Nuevo ingreso",
    editTitle: "Editar ingreso",
    conceptMaxLength: INCOME_CONCEPT_MAX_LENGTH,
    conceptRequiredMessage: INCOME_CONCEPT_REQUIRED_MESSAGE,
    conceptLengthMessage: INCOME_CONCEPT_LENGTH_MESSAGE,
    path: "incomes",
  },
  expense: {
    title: "Gastos",
    singular: "gasto",
    singularCapitalized: "Gasto",
    empty: "Todavía no hay gastos.",
    newTitle: "Nuevo gasto",
    editTitle: "Editar gasto",
    conceptMaxLength: EXPENSE_CONCEPT_MAX_LENGTH,
    conceptRequiredMessage: EXPENSE_CONCEPT_REQUIRED_MESSAGE,
    conceptLengthMessage: EXPENSE_CONCEPT_LENGTH_MESSAGE,
    path: "expenses",
  },
};
