import { sql } from "drizzle-orm";
import { index, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

import type { EFamilyRelationship } from "@juveco/shared/families";

import { timestamps } from "./columns";
import { dwellings } from "./dwellings";
import { users } from "./users";

/**
 * Familias de una vivienda: puede haber varias. El jefe es el integrante con parentesco `HEAD`;
 * no hay columna aparte. El contacto alternativo (a quién pertenece un número) solo se guarda
 * cuando el jefe no tiene teléfono.
 */
export const families = sqliteTable(
  "families",
  {
    id: text("id").primaryKey(),
    dwellingId: text("dwelling_id")
      .notNull()
      .references(() => dwellings.id),
    /* A quién pertenece el número; máx. 120 en la validación. */
    contactName: text("contact_name"),
    /* Prefijo del país sin «+» («51»). Va con `contact_phone`. */
    contactCountryPrefix: text("contact_country_prefix"),
    /* Número nacional, solo dígitos. */
    contactPhone: text("contact_phone"),
    /* Máx. 500 en la validación. */
    note: text("note"),
    ...timestamps(),
  },
  (table) => [index("families_dwellingId_idx").on(table.dwellingId)],
);

/**
 * La pertenencia de una persona a una familia, separada de su identidad: sacarla de la familia
 * no le borra sus datos. El índice único sobre `user_id` impide que esté en dos familias, y el
 * parcial deja un solo jefe por familia.
 */
export const familyMembers = sqliteTable(
  "family_members",
  {
    id: text("id").primaryKey(),
    familyId: text("family_id")
      .notNull()
      .references(() => families.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    relationship: text("relationship").$type<EFamilyRelationship>().notNull(),
    ...timestamps(),
  },
  (table) => [
    uniqueIndex("family_members_userId_uidx").on(table.userId),
    index("family_members_familyId_idx").on(table.familyId),
    uniqueIndex("family_members_familyId_head_uidx")
      .on(table.familyId)
      .where(sql`${table.relationship} = 'HEAD'`),
  ],
);
