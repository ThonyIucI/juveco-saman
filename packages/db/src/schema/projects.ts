import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

import type { TProjectType } from "@juveco/shared/projects";

import { timestamps } from "./columns";

/**
 * Eventos y proyectos que agrupan las actividades. La Chocolatada 2026 la crea una migración
 * de seed. `closed_at` vacío = abierto.
 */
export const projects = sqliteTable("projects", {
  id: text("id").primaryKey(),
  type: text("type").$type<TProjectType>().notNull(),
  name: text("name").notNull(),
  description: text("description"),
  /* «2026-11-21», sin hora. */
  startDate: text("start_date").notNull(),
  endDate: text("end_date"),
  /* Soles con dos decimales. */
  goalAmount: real("goal_amount"),
  beneficiaryCount: integer("beneficiary_count"),
  closedAt: integer("closed_at", { mode: "timestamp_ms" }),
  ...timestamps(),
});
