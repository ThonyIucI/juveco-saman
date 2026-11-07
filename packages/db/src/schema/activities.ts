import { real, sqliteTable, text } from "drizzle-orm/sqlite-core";

import type { TActivityType } from "@juveco/shared/activities";

import { timestamps } from "./columns";

/**
 * Actividades de Juveco (bingos, por ahora). No hay pantalla para crearlas: la primera,
 * «Bingo II - 2026», la inserta una migración de seed.
 */
export const activities = sqliteTable("activities", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").$type<TActivityType>().notNull(),
  /* «2026-11-21», sin hora. */
  eventDate: text("event_date").notNull(),
  /* Soles con dos decimales: lo que toma una cartilla nueva. */
  defaultPrice: real("default_price").notNull(),
  ...timestamps(),
});
