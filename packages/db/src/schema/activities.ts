import { index, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

import type { TActivityType } from "@juveco/shared/activities";

import { timestamps } from "./columns";
import { projects } from "./projects";

/**
 * Actividades de Juveco (bingos, por ahora). No hay pantalla para crearlas: la primera,
 * «Bingo II - 2026», la inserta una migración de seed.
 */
export const activities = sqliteTable(
  "activities",
  {
    id: text("id").primaryKey(),
    /*
      Nullable solo en la base: SQLite no deja agregar una columna NOT NULL a una tabla con
      filas. La seed asigna el Bingo II a la Chocolatada y la API lo exige al crear.
    */
    projectId: text("project_id").references(() => projects.id),
    name: text("name").notNull(),
    type: text("type").$type<TActivityType>().notNull(),
    /* «2026-11-21», sin hora. */
    eventDate: text("event_date").notNull(),
    /* Soles con dos decimales: lo que toma una cartilla nueva. */
    defaultPrice: real("default_price").notNull(),
    ...timestamps(),
  },
  (table) => [index("activities_projectId_idx").on(table.projectId)],
);
