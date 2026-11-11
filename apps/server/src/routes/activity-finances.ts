import { createDb } from "@juveco/db";
import { activityExpenses } from "@juveco/db/schema/activity-expenses";
import { activityItemPayments } from "@juveco/db/schema/activity-item-payments";
import { activityItems } from "@juveco/db/schema/activity-items";
import { activityPrizes } from "@juveco/db/schema/activity-prizes";
import { users } from "@juveco/db/schema/users";
import {
  EXPENSE_CONCEPT_LENGTH_MESSAGE,
  EXPENSE_CONCEPT_MAX_LENGTH,
  EXPENSE_CONCEPT_REQUIRED_MESSAGE,
  type IActivityBalance,
  type IActivityExpenseResource,
} from "@juveco/shared/activity-expenses";
import {
  EPrizeOrigin,
  type IActivityPrizeResource,
  PRIZE_COST_REQUIRED_MESSAGE,
  PRIZE_DONOR_REQUIRED_MESSAGE,
  PRIZE_NAME_LENGTH_MESSAGE,
  PRIZE_NAME_MAX_LENGTH,
  PRIZE_NAME_REQUIRED_MESSAGE,
  PRIZE_ORIGINS,
  PRIZE_ORIGIN_REQUIRED_MESSAGE,
} from "@juveco/shared/activity-prizes";
import { roundSoles } from "@juveco/shared/money";
import { type AnyColumn, and, asc, eq, isNull, sql } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";

import type { TAppEnv } from "../lib/app-env";
import { badRequest, notFound } from "../lib/errors";
import { newId } from "../lib/ids";
import { noteSchema } from "../lib/person-input";
import { ok } from "../lib/response";
import { validateJson } from "../lib/validator";
import { requireAuth } from "../middleware/require-role";

import { type TDb, findActivity, priceSchema } from "./activities";

export const ACTIVITY_FINANCE_ROUTES = {
  PRIZES: "/activities/:id/prizes",
  PRIZE: "/activities/:id/prizes/:prizeId",
  EXPENSES: "/activities/:id/expenses",
  EXPENSE: "/activities/:id/expenses/:expenseId",
  BALANCE: "/activities/:id/balance",
} as const;

const PRIZE_NOT_FOUND = "No encontramos ese premio.";
const EXPENSE_NOT_FOUND = "No encontramos ese gasto.";
const DONOR_NOT_FOUND = "No encontramos a quien lo donó.";

const collapseSpaces = (value: string) => value.replace(/\s+/g, " ");

const requiredText = (maxLength: number, requiredMessage: string, lengthMessage: string) =>
  z.string(requiredMessage).trim().min(1, requiredMessage).max(maxLength, lengthMessage).transform(collapseSpaces);

/*
  Donado lleva quién lo donó y no lleva costo; comprado, al revés. Lo que no corresponde se
  descarta, así cambiar de donado a comprado no deja un donante colgado.
*/
const prizeSchema = z
  .object({
    name: requiredText(PRIZE_NAME_MAX_LENGTH, PRIZE_NAME_REQUIRED_MESSAGE, PRIZE_NAME_LENGTH_MESSAGE),
    origin: z.enum(PRIZE_ORIGINS, PRIZE_ORIGIN_REQUIRED_MESSAGE),
    donorId: z.string().min(1).nullable().optional(),
    cost: priceSchema.nullable().optional(),
    note: noteSchema.optional(),
  })
  .superRefine((body, context) => {
    if (body.origin === EPrizeOrigin.DONATED && !body.donorId) {
      context.addIssue({ code: "custom", path: ["donorId"], message: PRIZE_DONOR_REQUIRED_MESSAGE });
    }
    if (body.origin === EPrizeOrigin.PURCHASED && (body.cost === null || body.cost === undefined)) {
      context.addIssue({ code: "custom", path: ["cost"], message: PRIZE_COST_REQUIRED_MESSAGE });
    }
  })
  .transform((body) => ({
    name: body.name,
    origin: body.origin,
    donorId: body.origin === EPrizeOrigin.DONATED ? (body.donorId ?? null) : null,
    cost: body.origin === EPrizeOrigin.PURCHASED ? (body.cost ?? null) : null,
    note: body.note ?? null,
  }));

const expenseSchema = z.object({
  concept: requiredText(EXPENSE_CONCEPT_MAX_LENGTH, EXPENSE_CONCEPT_REQUIRED_MESSAGE, EXPENSE_CONCEPT_LENGTH_MESSAGE),
  amount: priceSchema,
  note: noteSchema.optional(),
});

interface IPrizeRow {
  prize: typeof activityPrizes.$inferSelect;
  donor: typeof users.$inferSelect | null;
}

const toPrizeResource = ({ prize, donor }: IPrizeRow): IActivityPrizeResource => ({
  id: prize.id,
  activityId: prize.activityId,
  name: prize.name,
  origin: prize.origin,
  donor: donor ? { id: donor.id, firstName: donor.firstName, lastName: donor.lastName } : null,
  cost: prize.cost,
  note: prize.note,
  createdAt: prize.createdAt.toISOString(),
});

const toExpenseResource = (row: typeof activityExpenses.$inferSelect): IActivityExpenseResource => ({
  id: row.id,
  activityId: row.activityId,
  concept: row.concept,
  amount: row.amount,
  note: row.note,
  createdAt: row.createdAt.toISOString(),
});

const selectPrizes = (db: TDb) =>
  db
    .select({ prize: activityPrizes, donor: users })
    .from(activityPrizes)
    .leftJoin(users, eq(users.id, activityPrizes.donorId));

const findPrize = async (db: TDb, activityId: string, prizeId: string) => {
  const row = await selectPrizes(db)
    .where(and(eq(activityPrizes.id, prizeId), eq(activityPrizes.activityId, activityId)))
    .get();
  if (!row) {
    throw notFound(PRIZE_NOT_FOUND);
  }
  return row;
};

const findExpense = async (db: TDb, activityId: string, expenseId: string) => {
  const row = await db
    .select()
    .from(activityExpenses)
    .where(and(eq(activityExpenses.id, expenseId), eq(activityExpenses.activityId, activityId)))
    .get();
  if (!row) {
    throw notFound(EXPENSE_NOT_FOUND);
  }
  return row;
};

const assertDonorExists = async (db: TDb, donorId: string | null) => {
  if (!donorId) {
    return;
  }
  const donor = await db.select({ id: users.id }).from(users).where(eq(users.id, donorId)).get();
  if (!donor) {
    throw badRequest(DONOR_NOT_FOUND);
  }
};

const sumOf = (column: AnyColumn) => sql<number>`coalesce(sum(${column}), 0)`.mapWith(Number);

/** Lo que entra (cobrado y esperado) menos premios comprados y gastos. */
const buildBalance = async (db: TDb, activityId: string): Promise<IActivityBalance> => {
  const [expectedRow, collectedRow, purchasedRow, donatedRow, expensesRow] = await Promise.all([
    db
      .select({ total: sumOf(activityItems.price) })
      .from(activityItems)
      /* Las anuladas por un cambio no se cobran: su reemplazo ya suma su precio. */
      .where(and(eq(activityItems.activityId, activityId), isNull(activityItems.voidedAt)))
      .get(),
    db
      .select({ total: sumOf(activityItemPayments.amount) })
      .from(activityItemPayments)
      .innerJoin(activityItems, eq(activityItems.id, activityItemPayments.itemId))
      .where(eq(activityItems.activityId, activityId))
      .get(),
    db
      .select({ total: sumOf(activityPrizes.cost) })
      .from(activityPrizes)
      .where(and(eq(activityPrizes.activityId, activityId), eq(activityPrizes.origin, EPrizeOrigin.PURCHASED)))
      .get(),
    db
      .select({ count: sql<number>`count(*)`.mapWith(Number) })
      .from(activityPrizes)
      .where(and(eq(activityPrizes.activityId, activityId), eq(activityPrizes.origin, EPrizeOrigin.DONATED)))
      .get(),
    db
      .select({ total: sumOf(activityExpenses.amount) })
      .from(activityExpenses)
      .where(eq(activityExpenses.activityId, activityId))
      .get(),
  ]);

  const expected = roundSoles(expectedRow?.total ?? 0);
  const collected = roundSoles(collectedRow?.total ?? 0);
  const purchasedPrizes = roundSoles(purchasedRow?.total ?? 0);
  const expenses = roundSoles(expensesRow?.total ?? 0);

  return {
    collected,
    expected,
    purchasedPrizes,
    expenses,
    currentProfit: roundSoles(collected - purchasedPrizes - expenses),
    expectedProfit: roundSoles(expected - purchasedPrizes - expenses),
    donatedPrizeCount: donatedRow?.count ?? 0,
  };
};

/**
 * Premios, gastos y balance de una actividad (acordado 2026-11-07). Cualquier administrador
 * agrega, edita y elimina, igual que las cartillas.
 */
export const activityFinanceRoutes = new Hono<TAppEnv>()
  .get(ACTIVITY_FINANCE_ROUTES.PRIZES, requireAuth, async (context) => {
    const db = createDb();
    const activity = await findActivity(db, context.req.param("id"));
    const rows = await selectPrizes(db)
      .where(eq(activityPrizes.activityId, activity.id))
      .orderBy(asc(activityPrizes.createdAt));
    return ok(context, rows.map(toPrizeResource));
  })

  .post(ACTIVITY_FINANCE_ROUTES.PRIZES, requireAuth, validateJson(prizeSchema), async (context) => {
    const body = context.req.valid("json");
    const db = createDb();
    const activity = await findActivity(db, context.req.param("id"));
    await assertDonorExists(db, body.donorId);

    const id = newId();
    await db.insert(activityPrizes).values({ id, activityId: activity.id, ...body });

    return ok(context, toPrizeResource(await findPrize(db, activity.id, id)), 201);
  })

  /* Se manda el premio completo: así donado/comprado se valida siempre junto con lo suyo. */
  .patch(ACTIVITY_FINANCE_ROUTES.PRIZE, requireAuth, validateJson(prizeSchema), async (context) => {
    const body = context.req.valid("json");
    const activityId = context.req.param("id");
    const prizeId = context.req.param("prizeId");
    const db = createDb();

    await findPrize(db, activityId, prizeId);
    await assertDonorExists(db, body.donorId);
    await db.update(activityPrizes).set(body).where(eq(activityPrizes.id, prizeId));

    return ok(context, toPrizeResource(await findPrize(db, activityId, prizeId)));
  })

  .delete(ACTIVITY_FINANCE_ROUTES.PRIZE, requireAuth, async (context) => {
    const activityId = context.req.param("id");
    const prizeId = context.req.param("prizeId");
    const db = createDb();

    await findPrize(db, activityId, prizeId);
    await db.delete(activityPrizes).where(eq(activityPrizes.id, prizeId));

    return ok(context, { id: prizeId });
  })

  .get(ACTIVITY_FINANCE_ROUTES.EXPENSES, requireAuth, async (context) => {
    const db = createDb();
    const activity = await findActivity(db, context.req.param("id"));
    const rows = await db
      .select()
      .from(activityExpenses)
      .where(eq(activityExpenses.activityId, activity.id))
      .orderBy(asc(activityExpenses.createdAt));
    return ok(context, rows.map(toExpenseResource));
  })

  .post(ACTIVITY_FINANCE_ROUTES.EXPENSES, requireAuth, validateJson(expenseSchema), async (context) => {
    const body = context.req.valid("json");
    const db = createDb();
    const activity = await findActivity(db, context.req.param("id"));

    const id = newId();
    await db.insert(activityExpenses).values({
      id,
      activityId: activity.id,
      concept: body.concept,
      amount: body.amount,
      note: body.note ?? null,
    });

    return ok(context, toExpenseResource(await findExpense(db, activity.id, id)), 201);
  })

  .patch(ACTIVITY_FINANCE_ROUTES.EXPENSE, requireAuth, validateJson(expenseSchema), async (context) => {
    const body = context.req.valid("json");
    const activityId = context.req.param("id");
    const expenseId = context.req.param("expenseId");
    const db = createDb();

    await findExpense(db, activityId, expenseId);
    await db
      .update(activityExpenses)
      .set({ concept: body.concept, amount: body.amount, note: body.note ?? null })
      .where(eq(activityExpenses.id, expenseId));

    return ok(context, toExpenseResource(await findExpense(db, activityId, expenseId)));
  })

  .delete(ACTIVITY_FINANCE_ROUTES.EXPENSE, requireAuth, async (context) => {
    const activityId = context.req.param("id");
    const expenseId = context.req.param("expenseId");
    const db = createDb();

    await findExpense(db, activityId, expenseId);
    await db.delete(activityExpenses).where(eq(activityExpenses.id, expenseId));

    return ok(context, { id: expenseId });
  })

  .get(ACTIVITY_FINANCE_ROUTES.BALANCE, requireAuth, async (context) => {
    const db = createDb();
    const activity = await findActivity(db, context.req.param("id"));
    return ok(context, await buildBalance(db, activity.id));
  });
