import { index, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

import type { TPrizeOrigin } from "@juveco/shared/activity-prizes";

import { timestamps } from "./columns";
import { activities } from "./activities";
import { users } from "./users";

/**
 * Premios de una actividad. Donado lleva `donor_id` (una persona; un negocio va en la nota);
 * comprado lleva `cost`, que se resta de lo recaudado en el balance.
 */
export const activityPrizes = sqliteTable(
  "activity_prizes",
  {
    id: text("id").primaryKey(),
    activityId: text("activity_id")
      .notNull()
      .references(() => activities.id),
    name: text("name").notNull(),
    origin: text("origin").$type<TPrizeOrigin>().notNull(),
    donorId: text("donor_id").references(() => users.id),
    /* Soles con dos decimales; solo si es comprado. */
    cost: real("cost"),
    note: text("note"),
    ...timestamps(),
  },
  (table) => [
    index("activity_prizes_activityId_idx").on(table.activityId),
    index("activity_prizes_donorId_idx").on(table.donorId),
  ],
);
