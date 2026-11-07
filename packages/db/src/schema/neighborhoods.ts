import { sqliteTable, text } from "drizzle-orm/sqlite-core";

import { timestamps } from "./columns";

/**
 * Barrios. La tabla existe para la llave foránea de `users`, pero el código no la consulta:
 * lee `NEIGHBORHOODS` de `@juveco/shared/neighborhoods`, con los mismos IDs. Las filas las
 * inserta la migración de seed; un barrio nuevo va en las constantes **y** en otra migración.
 */
export const neighborhoods = sqliteTable("neighborhoods", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
  ...timestamps(),
});
