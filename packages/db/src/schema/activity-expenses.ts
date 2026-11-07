import { index, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

import { timestamps } from "./columns";
import { activities } from "./activities";

/**
 * Gastos de una actividad (impresión de cartillas, alquileres…). Lo gastado en premios
 * comprados no va acá: está en el costo del premio.
 */
export const activityExpenses = sqliteTable(
  "activity_expenses",
  {
    id: text("id").primaryKey(),
    activityId: text("activity_id")
      .notNull()
      .references(() => activities.id),
    concept: text("concept").notNull(),
    /* Soles con dos decimales. */
    amount: real("amount").notNull(),
    note: text("note"),
    ...timestamps(),
  },
  (table) => [index("activity_expenses_activityId_idx").on(table.activityId)],
);
