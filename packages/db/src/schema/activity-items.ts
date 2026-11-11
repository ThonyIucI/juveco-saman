import { type AnySQLiteColumn, index, integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

import { timestamps } from "./columns";
import { activities } from "./activities";
import { users } from "./users";

/**
 * Lo vendido en una actividad (en un bingo, las cartillas). La serie **no** es única: una
 * repetida se deja guardar y la pantalla avisa. El precio se copia de la actividad al
 * venderlo y se puede cambiar por ítem.
 *
 * Cambio de cartilla (Thony, 2026-11-11): si un comprador pierde la suya, se anula
 * (`voided_at`) y se le da otra que la reemplaza (`replaces_id` apunta a la anulada) y se
 * lleva sus pagos. Una anulada no cuenta para ningún total, pero se sigue viendo y buscando:
 * el día del bingo alguien podría cantar con la perdida.
 */
export const activityItems = sqliteTable(
  "activity_items",
  {
    id: text("id").primaryKey(),
    activityId: text("activity_id")
      .notNull()
      .references(() => activities.id),
    serial: text("serial").notNull(),
    buyerId: text("buyer_id")
      .notNull()
      .references(() => users.id),
    /* El administrador que lo registró. */
    sellerId: text("seller_id")
      .notNull()
      .references(() => users.id),
    /* Soles con dos decimales. */
    price: real("price").notNull(),
    note: text("note"),
    /* Cuándo se anuló por un cambio de cartilla; `null` si sigue vigente. */
    voidedAt: integer("voided_at", { mode: "timestamp_ms" }),
    /* La cartilla anulada que esta reemplaza, si salió de un cambio. */
    replacesId: text("replaces_id").references((): AnySQLiteColumn => activityItems.id),
    ...timestamps(),
  },
  (table) => [
    index("activity_items_activityId_idx").on(table.activityId),
    index("activity_items_buyerId_idx").on(table.buyerId),
  ],
);
