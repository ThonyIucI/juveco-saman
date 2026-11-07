import { index, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

import type { TPaymentMethod } from "@juveco/shared/activity-item-payments";

import { timestamps } from "./columns";
import { activityItems } from "./activity-items";
import { users } from "./users";

/**
 * Pagos de un ítem vendido (en un bingo, de una cartilla): Yape o efectivo, por partes. La
 * deuda no se guarda: es el precio del ítem menos la suma de sus pagos. La fecha del pago es
 * `created_at`.
 */
export const activityItemPayments = sqliteTable(
  "activity_item_payments",
  {
    id: text("id").primaryKey(),
    itemId: text("item_id")
      .notNull()
      .references(() => activityItems.id),
    /* Soles con dos decimales. */
    amount: real("amount").notNull(),
    method: text("method").$type<TPaymentMethod>().notNull(),
    /* El administrador que lo cobró. */
    collectorId: text("collector_id")
      .notNull()
      .references(() => users.id),
    ...timestamps(),
  },
  (table) => [index("activity_item_payments_itemId_idx").on(table.itemId)],
);
