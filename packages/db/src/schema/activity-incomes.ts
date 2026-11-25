import { index, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

import { timestamps } from "./columns";
import { activities } from "./activities";

/**
 * Ingresos de una actividad que no son una venta con comprador (inscripciones del campeonato,
 * una venta del día…). Suman al balance de la actividad y, por ella, al de su proyecto.
 */
export const activityIncomes = sqliteTable(
  "activity_incomes",
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
  (table) => [index("activity_incomes_activityId_idx").on(table.activityId)],
);
