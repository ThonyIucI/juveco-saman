import { createDb } from "@juveco/db";
import { activityIncomes } from "@juveco/db/schema/activity-incomes";
import {
  INCOME_CONCEPT_LENGTH_MESSAGE,
  INCOME_CONCEPT_MAX_LENGTH,
  INCOME_CONCEPT_REQUIRED_MESSAGE,
} from "@juveco/shared/activity-incomes";
import { and, asc, eq } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";

import type { TAppEnv } from "../lib/app-env";
import { notFound } from "../lib/errors";
import { newId } from "../lib/ids";
import { noteSchema } from "../lib/person-input";
import { assertActivityOpen } from "../lib/project-guards";
import { ok } from "../lib/response";
import { validateJson } from "../lib/validator";
import { requireAuth } from "../middleware/require-role";

import { type TDb, findActivity, priceSchema } from "./activities";
import { requiredText, toMovementResource } from "./activity-finances";

export const ACTIVITY_INCOME_ROUTES = {
  INCOMES: "/activities/:id/incomes",
  INCOME: "/activities/:id/incomes/:incomeId",
} as const;

const INCOME_NOT_FOUND = "No encontramos ese ingreso.";

const incomeSchema = z.object({
  concept: requiredText(INCOME_CONCEPT_MAX_LENGTH, INCOME_CONCEPT_REQUIRED_MESSAGE, INCOME_CONCEPT_LENGTH_MESSAGE),
  amount: priceSchema,
  note: noteSchema.optional(),
});

const findIncome = async (db: TDb, activityId: string, incomeId: string) => {
  const row = await db
    .select()
    .from(activityIncomes)
    .where(and(eq(activityIncomes.id, incomeId), eq(activityIncomes.activityId, activityId)))
    .get();
  if (!row) {
    throw notFound(INCOME_NOT_FOUND);
  }
  return row;
};

/**
 * Ingresos de una actividad (acordado 2026-11-25): lo que entra sin ser una venta con
 * comprador, como las inscripciones del campeonato. Mismas reglas que los gastos: cualquier
 * administrador los agrega, edita y elimina mientras el proyecto esté abierto.
 */
export const activityIncomeRoutes = new Hono<TAppEnv>()
  .get(ACTIVITY_INCOME_ROUTES.INCOMES, requireAuth, async (context) => {
    const db = createDb();
    const activity = await findActivity(db, context.req.param("id"));
    const rows = await db
      .select()
      .from(activityIncomes)
      .where(eq(activityIncomes.activityId, activity.id))
      .orderBy(asc(activityIncomes.createdAt));
    return ok(context, rows.map(toMovementResource));
  })

  .post(ACTIVITY_INCOME_ROUTES.INCOMES, requireAuth, validateJson(incomeSchema), async (context) => {
    const body = context.req.valid("json");
    const db = createDb();
    const activity = await findActivity(db, context.req.param("id"));
    await assertActivityOpen(db, activity);

    const id = newId();
    await db.insert(activityIncomes).values({
      id,
      activityId: activity.id,
      concept: body.concept,
      amount: body.amount,
      note: body.note ?? null,
    });

    return ok(context, toMovementResource(await findIncome(db, activity.id, id)), 201);
  })

  .patch(ACTIVITY_INCOME_ROUTES.INCOME, requireAuth, validateJson(incomeSchema), async (context) => {
    const body = context.req.valid("json");
    const activityId = context.req.param("id");
    const incomeId = context.req.param("incomeId");
    const db = createDb();

    await assertActivityOpen(db, await findActivity(db, activityId));
    await findIncome(db, activityId, incomeId);
    await db
      .update(activityIncomes)
      .set({ concept: body.concept, amount: body.amount, note: body.note ?? null })
      .where(eq(activityIncomes.id, incomeId));

    return ok(context, toMovementResource(await findIncome(db, activityId, incomeId)));
  })

  .delete(ACTIVITY_INCOME_ROUTES.INCOME, requireAuth, async (context) => {
    const activityId = context.req.param("id");
    const incomeId = context.req.param("incomeId");
    const db = createDb();

    await assertActivityOpen(db, await findActivity(db, activityId));
    await findIncome(db, activityId, incomeId);
    await db.delete(activityIncomes).where(eq(activityIncomes.id, incomeId));

    return ok(context, { id: incomeId });
  });
