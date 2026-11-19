import { sql } from "drizzle-orm";
import { index, real, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

import type { TPaymentMethod } from "@juveco/shared/activity-item-payments";

import { timestamps } from "./columns";
import { activities } from "./activities";
import { users } from "./users";

/**
 * Equipos de un campeonato (acordado 2026-11-19). La inscripción se copia del precio de la
 * actividad al crearlo. El delegado va aparte de los jugadores: puede jugar o no.
 */
export const activityTeams = sqliteTable(
  "activity_teams",
  {
    id: text("id").primaryKey(),
    activityId: text("activity_id")
      .notNull()
      .references(() => activities.id),
    name: text("name").notNull(),
    delegateId: text("delegate_id")
      .notNull()
      .references(() => users.id),
    /* Soles con dos decimales: la inscripción. */
    price: real("price").notNull(),
    note: text("note"),
    ...timestamps(),
  },
  (table) => [
    index("activity_teams_activityId_idx").on(table.activityId),
    /* Sin importar mayúsculas: «Real Samán» y «real samán» son el mismo equipo. */
    uniqueIndex("activity_teams_activityId_name_uidx").on(table.activityId, sql`lower(${table.name})`),
  ],
);

/**
 * Los jugadores de cada equipo, en el orden en que se agregaron. Que un jugador no esté en dos
 * equipos del mismo campeonato lo controla la API, no la base (ver `playerInOtherTeamMessage`).
 */
export const activityTeamPlayers = sqliteTable(
  "activity_team_players",
  {
    id: text("id").primaryKey(),
    teamId: text("team_id")
      .notNull()
      .references(() => activityTeams.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    ...timestamps(),
  },
  (table) => [
    uniqueIndex("activity_team_players_teamId_userId_uidx").on(table.teamId, table.userId),
    index("activity_team_players_userId_idx").on(table.userId),
  ],
);

/**
 * Pagos de la inscripción de un equipo: Yape o efectivo, por partes, igual que los de una
 * cartilla. La fecha del pago es `created_at`.
 */
export const activityTeamPayments = sqliteTable(
  "activity_team_payments",
  {
    id: text("id").primaryKey(),
    teamId: text("team_id")
      .notNull()
      .references(() => activityTeams.id),
    /* Soles con dos decimales. */
    amount: real("amount").notNull(),
    method: text("method").$type<TPaymentMethod>().notNull(),
    /* El administrador que lo cobró. */
    collectorId: text("collector_id")
      .notNull()
      .references(() => users.id),
    ...timestamps(),
  },
  (table) => [index("activity_team_payments_teamId_idx").on(table.teamId)],
);
