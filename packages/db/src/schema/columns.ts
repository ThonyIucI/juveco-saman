import { sql } from "drizzle-orm";
import { integer } from "drizzle-orm/sqlite-core";

const nowMs = sql`(cast(unixepoch('subsecond') * 1000 as integer))`;

/** `created_at` y `updated_at` en milisegundos, iguales en todas las tablas. */
export const timestamps = () => ({
  createdAt: integer("created_at", { mode: "timestamp_ms" }).default(nowMs).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .default(nowMs)
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});
