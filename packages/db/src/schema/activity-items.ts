import { index, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

import { timestamps } from "./columns";
import { activities } from "./activities";
import { users } from "./users";

/**
 * Lo vendido en una actividad (en un bingo, las cartillas). La serie **no** es única: una
 * repetida se deja guardar y la pantalla avisa. El precio se copia de la actividad al
 * venderlo y se puede cambiar por ítem.
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
    ...timestamps(),
  },
  (table) => [
    index("activity_items_activityId_idx").on(table.activityId),
    index("activity_items_buyerId_idx").on(table.buyerId),
  ],
);
