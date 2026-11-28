import { index, primaryKey, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

import type { EGender, EUserCondition } from "@juveco/shared/user-profiles";

import { timestamps } from "./columns";
import { users } from "./users";

/**
 * Datos del censo de una persona, en tabla aparte (empadronamiento): así el DNI y la fecha de
 * nacimiento no viajan con la lista de usuarios. Una fila por persona, solo si hay algún dato.
 * El DNI no se repite; en SQLite el índice único deja varios `NULL`.
 */
export const userProfiles = sqliteTable(
  "user_profiles",
  {
    userId: text("user_id")
      .primaryKey()
      .references(() => users.id, { onDelete: "cascade" }),
    /* 8 dígitos, como texto para no perder ceros. */
    documentNumber: text("document_number"),
    /* «AAAA-MM-DD». La edad sale de acá, no se guarda. */
    birthDate: text("birth_date"),
    gender: text("gender").$type<EGender>(),
    /* Detalle de las condiciones; máx. 500 en la validación. */
    conditionNote: text("condition_note"),
    ...timestamps(),
  },
  (table) => [uniqueIndex("user_profiles_documentNumber_uidx").on(table.documentNumber)],
);

/** Condiciones de prioridad: una fila por condición, para poder contarlas. */
export const userConditions = sqliteTable(
  "user_conditions",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    condition: text("condition").$type<EUserCondition>().notNull(),
    ...timestamps(),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.condition] }),
    index("user_conditions_condition_idx").on(table.condition),
  ],
);
