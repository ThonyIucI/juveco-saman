import { index, integer, real, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

import type { EDwellingStatus, EWallMaterial } from "@juveco/shared/dwellings";

import { timestamps } from "./columns";
import { neighborhoods } from "./neighborhoods";

/**
 * Viviendas del empadronamiento: la casa física, con datos actuales y sin historial. El código
 * visible («SR-0001») no se guarda: sale del prefijo del barrio (constante) y `local_sequence`,
 * el correlativo por barrio. El medidor es un dato aparte y puede repetirse.
 * En SQLite `text` no aplica largo: los máximos viven en la validación.
 */
export const dwellings = sqliteTable(
  "dwellings",
  {
    id: text("id").primaryKey(),
    neighborhoodId: text("neighborhood_id")
      .notNull()
      .references(() => neighborhoods.id),
    /* Máx. 20 en la validación. Nulable y repetible. */
    meterNumber: text("meter_number"),
    /* Correlativo dentro del barrio, desde 1. */
    localSequence: integer("local_sequence").notNull(),
    latitude: real("latitude"),
    longitude: real("longitude"),
    /* Máx. 500 en la validación. */
    mapsUrl: text("maps_url"),
    status: text("status").$type<EDwellingStatus>().default("NONE" as EDwellingStatus).notNull(),
    wallMaterial: text("wall_material").$type<EWallMaterial>(),
    /* Carpeta de Google Drive; máx. 500. */
    photosUrl: text("photos_url"),
    /* Máx. 500. */
    observation: text("observation"),
    /* Máx. 500. */
    note: text("note"),
    ...timestamps(),
  },
  (table) => [
    uniqueIndex("dwellings_neighborhoodId_localSequence_uidx").on(table.neighborhoodId, table.localSequence),
    index("dwellings_meterNumber_idx").on(table.meterNumber),
    index("dwellings_status_idx").on(table.status),
  ],
);
