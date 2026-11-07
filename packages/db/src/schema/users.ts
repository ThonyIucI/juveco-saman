import { sql } from "drizzle-orm";
import { index, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

import type { TUserRole } from "@juveco/shared/roles";

import { timestamps } from "./columns";
import { neighborhoods } from "./neighborhoods";

/**
 * Personas de Juveco (acordado 2026-11-07): todos son usuarios con los mismos datos. Los que
 * entran a la app (ADMIN, SUPERADMIN) además tienen su login en `auth_users`. El nombre se
 * puede repetir; el número y el usuario de WhatsApp no.
 */
export const users = sqliteTable(
  "users",
  {
    id: text("id").primaryKey(),
    firstName: text("first_name").notNull(),
    lastName: text("last_name"),
    neighborhoodId: text("neighborhood_id").references(() => neighborhoods.id),
    /* Prefijo del país sin «+» («51»). Va con `phone`. */
    countryPrefix: text("country_prefix"),
    /* Número nacional, solo dígitos. */
    phone: text("phone"),
    /* Como lo escribieron, sin «@». Se compara sin mayúsculas en el índice. */
    whatsappUsername: text("whatsapp_username"),
    note: text("note"),
    role: text("role").$type<TUserRole>().default("USER").notNull(),
    ...timestamps(),
  },
  (table) => [
    /* En SQLite un índice único deja varios `NULL`: los que no tienen número no chocan. */
    uniqueIndex("users_phone_uidx").on(table.countryPrefix, table.phone),
    /* Sin importar mayúsculas («Ana.pe» = «ana.pe»): el usuario solo lleva ASCII. */
    uniqueIndex("users_whatsappUsername_uidx").on(sql`lower(${table.whatsappUsername})`),
    index("users_neighborhoodId_idx").on(table.neighborhoodId),
  ],
);
