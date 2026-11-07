import { createDb } from "@juveco/db";
import { activities } from "@juveco/db/schema/activities";
import { activityItemPayments } from "@juveco/db/schema/activity-item-payments";
import { activityItems } from "@juveco/db/schema/activity-items";
import { users } from "@juveco/db/schema/users";
import type { IActivityResource } from "@juveco/shared/activities";
import {
  EPaymentMethod,
  type IActivityItemPaymentResource,
  type IActivitySummary,
  PAYMENT_ALREADY_PAID_MESSAGE,
  PAYMENT_METHODS,
  PAYMENT_METHOD_REQUIRED_MESSAGE,
  paymentOverPendingMessage,
} from "@juveco/shared/activity-item-payments";
import {
  ACTIVITY_ITEM_BUYER_REQUIRED_MESSAGE,
  ACTIVITY_ITEM_SERIAL_LENGTH_MESSAGE,
  ACTIVITY_ITEM_SERIAL_MAX_LENGTH,
  ACTIVITY_ITEM_SERIAL_REQUIRED_MESSAGE,
  type IActivityItemResource,
} from "@juveco/shared/activity-items";
import { INVALID_SOLES_MESSAGE, formatSoles, hasAtMostTwoDecimals, roundSoles } from "@juveco/shared/money";
import { neighborhoodOf } from "@juveco/shared/neighborhoods";
import { and, asc, desc, eq, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/sqlite-core";
import { Hono } from "hono";
import { z } from "zod";

import type { TAppEnv } from "../lib/app-env";
import { badRequest, conflict, notFound } from "../lib/errors";
import { newId } from "../lib/ids";
import { noteSchema } from "../lib/person-input";
import { ok } from "../lib/response";
import { validateJson } from "../lib/validator";
import { requireAuth } from "../middleware/require-role";

export const ACTIVITY_ROUTES = {
  ACTIVITIES: "/activities",
  ACTIVITY: "/activities/:id",
  ITEMS: "/activities/:id/items",
  ITEM: "/activities/:id/items/:itemId",
  PAYMENTS: "/activities/:id/items/:itemId/payments",
  PAYMENT: "/activities/:id/items/:itemId/payments/:paymentId",
  SUMMARY: "/activities/:id/summary",
} as const;

const ACTIVITY_NOT_FOUND = "No encontramos esa actividad.";
const ITEM_NOT_FOUND = "No encontramos esa venta.";
const BUYER_NOT_FOUND = "No encontramos a quien lo compró.";
const NO_CHANGES_MESSAGE = "No hay cambios para guardar.";
const PAYMENT_NOT_FOUND = "No encontramos ese pago.";

const serialSchema = z
  .string(ACTIVITY_ITEM_SERIAL_REQUIRED_MESSAGE)
  .trim()
  .min(1, ACTIVITY_ITEM_SERIAL_REQUIRED_MESSAGE)
  .max(ACTIVITY_ITEM_SERIAL_MAX_LENGTH, ACTIVITY_ITEM_SERIAL_LENGTH_MESSAGE);

/* Soles positivos con dos decimales: precios, pagos, costos y gastos. */
export const priceSchema = z
  .number(INVALID_SOLES_MESSAGE)
  .positive(INVALID_SOLES_MESSAGE)
  .refine(hasAtMostTwoDecimals, INVALID_SOLES_MESSAGE)
  .transform(roundSoles);

const buyerIdSchema = z
  .string(ACTIVITY_ITEM_BUYER_REQUIRED_MESSAGE)
  .min(1, ACTIVITY_ITEM_BUYER_REQUIRED_MESSAGE);

/* Sin precio, el ítem toma el precio por defecto de la actividad. */
const createItemSchema = z.object({
  serial: serialSchema,
  buyerId: buyerIdSchema,
  price: priceSchema.optional(),
  note: noteSchema.optional(),
});

const updateItemSchema = createItemSchema
  .partial()
  .refine((body) => Object.values(body).some((value) => value !== undefined), {
    message: NO_CHANGES_MESSAGE,
  });

const createPaymentSchema = z.object({
  amount: priceSchema,
  method: z.enum(PAYMENT_METHODS, PAYMENT_METHOD_REQUIRED_MESSAGE),
});

export type TDb = ReturnType<typeof createDb>;
type TActivityRow = typeof activities.$inferSelect;
type TUserRow = typeof users.$inferSelect;

/* `users` dos veces en la misma consulta: quien compró y quien vendió. */
const buyers = alias(users, "buyers");
const sellers = alias(users, "sellers");

/* Lo pagado de cada ítem, sumado en la misma consulta: la deuda no se guarda. */
const paidAmountSql = sql<number>`coalesce((select sum(${activityItemPayments.amount}) from ${activityItemPayments} where ${activityItemPayments.itemId} = ${activityItems.id}), 0)`.mapWith(Number);

/** Lo que falta cobrar, sin decimales de más por la suma de `real`. */
const pendingOf = (price: number, paidAmount: number): number => Math.max(roundSoles(price - paidAmount), 0);

const toActivityResource = (row: TActivityRow): IActivityResource => ({
  id: row.id,
  name: row.name,
  type: row.type,
  eventDate: row.eventDate,
  defaultPrice: row.defaultPrice,
});

interface IItemRow {
  item: typeof activityItems.$inferSelect;
  buyer: TUserRow;
  seller: TUserRow;
  paidAmount: number;
}

const toItemResource = ({ item, buyer, seller, paidAmount }: IItemRow): IActivityItemResource => ({
  id: item.id,
  activityId: item.activityId,
  serial: item.serial,
  price: item.price,
  paidAmount: roundSoles(paidAmount),
  buyer: {
    id: buyer.id,
    firstName: buyer.firstName,
    lastName: buyer.lastName,
    neighborhood: neighborhoodOf(buyer.neighborhoodId),
  },
  seller: { id: seller.id, firstName: seller.firstName, lastName: seller.lastName },
  note: item.note,
  createdAt: item.createdAt.toISOString(),
});

const selectItems = (db: TDb) =>
  db
    .select({ item: activityItems, buyer: buyers, seller: sellers, paidAmount: paidAmountSql })
    .from(activityItems)
    .innerJoin(buyers, eq(buyers.id, activityItems.buyerId))
    .innerJoin(sellers, eq(sellers.id, activityItems.sellerId));

export const findActivity = async (db: TDb, id: string) => {
  const row = await db.select().from(activities).where(eq(activities.id, id)).get();
  if (!row) {
    throw notFound(ACTIVITY_NOT_FOUND);
  }
  return row;
};

const findItem = async (db: TDb, activityId: string, itemId: string) => {
  const row = await selectItems(db)
    .where(and(eq(activityItems.id, itemId), eq(activityItems.activityId, activityId)))
    .get();
  if (!row) {
    throw notFound(ITEM_NOT_FOUND);
  }
  return row;
};

interface IPaymentRow {
  payment: typeof activityItemPayments.$inferSelect;
  collector: TUserRow;
}

const toPaymentResource = ({ payment, collector }: IPaymentRow): IActivityItemPaymentResource => ({
  id: payment.id,
  itemId: payment.itemId,
  amount: payment.amount,
  method: payment.method,
  collector: { id: collector.id, firstName: collector.firstName, lastName: collector.lastName },
  createdAt: payment.createdAt.toISOString(),
});

const selectPayments = (db: TDb) =>
  db
    .select({ payment: activityItemPayments, collector: users })
    .from(activityItemPayments)
    .innerJoin(users, eq(users.id, activityItemPayments.collectorId));

const findPayment = async (db: TDb, itemId: string, paymentId: string) => {
  const row = await selectPayments(db)
    .where(and(eq(activityItemPayments.id, paymentId), eq(activityItemPayments.itemId, itemId)))
    .get();
  if (!row) {
    throw notFound(PAYMENT_NOT_FOUND);
  }
  return row;
};

/** Los números de los KPIs, a partir de lo vendido y sus pagos. */
const buildSummary = (
  items: IItemRow[],
  collectedByMethod: IActivitySummary["collectedByMethod"],
): IActivitySummary => {
  const totals = items.reduce(
    (acc, { item, paidAmount }) => {
      const pending = pendingOf(item.price, paidAmount);
      return {
        expected: acc.expected + item.price,
        collected: acc.collected + paidAmount,
        pending: acc.pending + pending,
        paidCount: acc.paidCount + (pending === 0 ? 1 : 0),
        partialCount: acc.partialCount + (pending > 0 && paidAmount > 0 ? 1 : 0),
        unpaidCount: acc.unpaidCount + (pending > 0 && paidAmount === 0 ? 1 : 0),
      };
    },
    { expected: 0, collected: 0, pending: 0, paidCount: 0, partialCount: 0, unpaidCount: 0 },
  );

  return {
    itemCount: items.length,
    expected: roundSoles(totals.expected),
    collected: roundSoles(totals.collected),
    collectedByMethod,
    pending: roundSoles(totals.pending),
    paidCount: totals.paidCount,
    partialCount: totals.partialCount,
    unpaidCount: totals.unpaidCount,
  };
};

const assertBuyerExists = async (db: TDb, buyerId: string) => {
  const buyer = await db.select({ id: users.id }).from(users).where(eq(users.id, buyerId)).get();
  if (!buyer) {
    throw badRequest(BUYER_NOT_FOUND);
  }
};

/**
 * Actividades y lo que se vende en ellas (en un bingo, las cartillas). Cualquier administrador
 * vende, edita y elimina; quien vende es siempre el que tiene la sesión. Una serie repetida no
 * se frena: el front avisa.
 */
export const activityRoutes = new Hono<TAppEnv>()
  .get(ACTIVITY_ROUTES.ACTIVITIES, requireAuth, async (context) => {
    const rows = await createDb().select().from(activities).orderBy(desc(activities.eventDate));
    return ok(context, rows.map(toActivityResource));
  })

  .get(ACTIVITY_ROUTES.ACTIVITY, requireAuth, async (context) => {
    const row = await findActivity(createDb(), context.req.param("id"));
    return ok(context, toActivityResource(row));
  })

  .get(ACTIVITY_ROUTES.ITEMS, requireAuth, async (context) => {
    const db = createDb();
    const activity = await findActivity(db, context.req.param("id"));
    const rows = await selectItems(db).where(eq(activityItems.activityId, activity.id));
    return ok(context, rows.map(toItemResource));
  })

  .post(ACTIVITY_ROUTES.ITEMS, requireAuth, validateJson(createItemSchema), async (context) => {
    const body = context.req.valid("json");
    const db = createDb();

    const activity = await findActivity(db, context.req.param("id"));
    await assertBuyerExists(db, body.buyerId);

    const id = newId();
    await db.insert(activityItems).values({
      id,
      activityId: activity.id,
      serial: body.serial,
      buyerId: body.buyerId,
      sellerId: context.var.user.id,
      price: body.price ?? activity.defaultPrice,
      note: body.note ?? null,
    });

    const created = await findItem(db, activity.id, id);
    return ok(context, toItemResource(created), 201);
  })

  .patch(ACTIVITY_ROUTES.ITEM, requireAuth, validateJson(updateItemSchema), async (context) => {
    const body = context.req.valid("json");
    const activityId = context.req.param("id");
    const itemId = context.req.param("itemId");
    const db = createDb();

    const current = await findItem(db, activityId, itemId);
    if (body.price !== undefined && body.price < roundSoles(current.paidAmount)) {
      throw badRequest(
        `El precio no puede ser menor que lo que ya pagó: ${formatSoles(current.paidAmount)}.`,
      );
    }
    if (body.buyerId !== undefined) {
      await assertBuyerExists(db, body.buyerId);
    }

    await db
      .update(activityItems)
      .set({
        ...(body.serial !== undefined && { serial: body.serial }),
        ...(body.buyerId !== undefined && { buyerId: body.buyerId }),
        ...(body.price !== undefined && { price: body.price }),
        ...(body.note !== undefined && { note: body.note }),
      })
      .where(eq(activityItems.id, itemId));

    const updated = await findItem(db, activityId, itemId);
    return ok(context, toItemResource(updated));
  })

  .delete(ACTIVITY_ROUTES.ITEM, requireAuth, async (context) => {
    const activityId = context.req.param("id");
    const itemId = context.req.param("itemId");
    const db = createDb();

    const current = await findItem(db, activityId, itemId);
    /* Borrar el ítem se llevaría plata ya cobrada: primero se eliminan sus pagos. */
    if (current.paidAmount > 0) {
      throw conflict(`La serie «${current.item.serial}» tiene pagos: primero elimínalos desde su detalle.`);
    }
    await db.delete(activityItems).where(eq(activityItems.id, itemId));

    return ok(context, { id: itemId });
  })

  .get(ACTIVITY_ROUTES.PAYMENTS, requireAuth, async (context) => {
    const db = createDb();
    const { item } = await findItem(db, context.req.param("id"), context.req.param("itemId"));
    const rows = await selectPayments(db)
      .where(eq(activityItemPayments.itemId, item.id))
      .orderBy(asc(activityItemPayments.createdAt));
    return ok(context, rows.map(toPaymentResource));
  })

  /* Cobra el administrador de la sesión. Nunca más de lo que falta cobrar. */
  .post(ACTIVITY_ROUTES.PAYMENTS, requireAuth, validateJson(createPaymentSchema), async (context) => {
    const body = context.req.valid("json");
    const activityId = context.req.param("id");
    const itemId = context.req.param("itemId");
    const db = createDb();

    const current = await findItem(db, activityId, itemId);
    const pending = pendingOf(current.item.price, current.paidAmount);
    if (pending === 0) {
      throw badRequest(PAYMENT_ALREADY_PAID_MESSAGE);
    }
    if (body.amount > pending) {
      throw badRequest(paymentOverPendingMessage(formatSoles(pending)));
    }

    const id = newId();
    await db.insert(activityItemPayments).values({
      id,
      itemId,
      amount: body.amount,
      method: body.method,
      collectorId: context.var.user.id,
    });

    const [payment, item] = await Promise.all([findPayment(db, itemId, id), findItem(db, activityId, itemId)]);
    return ok(context, { payment: toPaymentResource(payment), item: toItemResource(item) }, 201);
  })

  .delete(ACTIVITY_ROUTES.PAYMENT, requireAuth, async (context) => {
    const activityId = context.req.param("id");
    const itemId = context.req.param("itemId");
    const db = createDb();

    await findItem(db, activityId, itemId);
    const payment = await findPayment(db, itemId, context.req.param("paymentId"));
    await db.delete(activityItemPayments).where(eq(activityItemPayments.id, payment.payment.id));

    const item = await findItem(db, activityId, itemId);
    return ok(context, { payment: toPaymentResource(payment), item: toItemResource(item) });
  })

  .get(ACTIVITY_ROUTES.SUMMARY, requireAuth, async (context) => {
    const db = createDb();
    const activity = await findActivity(db, context.req.param("id"));

    const [items, byMethod] = await Promise.all([
      selectItems(db).where(eq(activityItems.activityId, activity.id)),
      db
        .select({
          method: activityItemPayments.method,
          total: sql<number>`sum(${activityItemPayments.amount})`.mapWith(Number),
        })
        .from(activityItemPayments)
        .innerJoin(activityItems, eq(activityItems.id, activityItemPayments.itemId))
        .where(eq(activityItems.activityId, activity.id))
        .groupBy(activityItemPayments.method),
    ]);

    const collectedByMethod = { [EPaymentMethod.YAPE]: 0, [EPaymentMethod.CASH]: 0 };
    for (const { method, total } of byMethod) {
      collectedByMethod[method] = roundSoles(total);
    }

    return ok(context, buildSummary(items, collectedByMethod));
  });
