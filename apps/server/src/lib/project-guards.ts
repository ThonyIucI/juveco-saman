import { activities } from "@juveco/db/schema/activities";
import { projects } from "@juveco/db/schema/projects";
import { PROJECT_CLOSED_MESSAGE } from "@juveco/shared/projects";
import { eq } from "drizzle-orm";

import type { TDb } from "../routes/activities";

import { conflict } from "./errors";

type TActivityRow = typeof activities.$inferSelect;

/**
 * Un proyecto cerrado no recibe cosas nuevas (cartillas, pagos, premios ni gastos) en él ni en
 * sus actividades. Una actividad sin proyecto, como las anteriores a la seed, no se frena.
 */
export const assertActivityOpen = async (db: TDb, activity: TActivityRow) => {
  if (!activity.projectId) {
    return;
  }
  const project = await db
    .select({ closedAt: projects.closedAt })
    .from(projects)
    .where(eq(projects.id, activity.projectId))
    .get();
  if (project?.closedAt) {
    throw conflict(PROJECT_CLOSED_MESSAGE);
  }
};
