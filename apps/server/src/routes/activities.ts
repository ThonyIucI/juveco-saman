import { createDb } from "@juveco/db";
import { activities } from "@juveco/db/schema/activities";
import { activityItems } from "@juveco/db/schema/activity-items";
import { users } from "@juveco/db/schema/users";
import type { IActivityResource } from "@juveco/shared/activities";
import {
  ACTIVITY_ITEM_BUYER_REQUIRED_MESSAGE,
  ACTIVITY_ITEM_SERIAL_LENGTH_MESSAGE,
  ACTIVITY_ITEM_SERIAL_MAX_LENGTH,
  ACTIVITY_ITEM_SERIAL_REQUIRED_MESSAGE,
  type IActivityItemResource,
} from "@juveco/shared/activity-items";
import { INVALID_SOLES_MESSAGE, hasAtMostTwoDecimals, roundSoles } from "@juveco/shared/money";
import { neighborhoodOf } from "@juveco/shared/neighborhoods";
import { and, desc, eq } from "drizzle-orm";
import { alias } from "drizzle-orm/sqlite-core";
import { Hono } from "hono";
import { z } from "zod";

import type { TAppEnv } from "../lib/app-env";
import { badRequest, notFound } from "../lib/errors";
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
} as const;

const ACTIVITY_NOT_FOUND = "No encontramos esa actividad.";
const ITEM_NOT_FOUND = "No encontramos esa venta.";
const BUYER_NOT_FOUND = "No encontramos a quien lo compró.";
const NO_CHANGES_MESSAGE = "No hay cambios para guardar.";

const serialSchema = z
  .string(ACTIVITY_ITEM_SERIAL_REQUIRED_MESSAGE)
  .trim()
  .min(1, ACTIVITY_ITEM_SERIAL_REQUIRED_MESSAGE)
  .max(ACTIVITY_ITEM_SERIAL_MAX_LENGTH, ACTIVITY_ITEM_SERIAL_LENGTH_MESSAGE);

const priceSchema = z
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

type TDb = ReturnType<typeof createDb>;
type TActivityRow = typeof activities.$inferSelect;
type TUserRow = typeof users.$inferSelect;

/* `users` dos veces en la misma consulta: quien compró y quien vendió. */
const buyers = alias(users, "buyers");
const sellers = alias(users, "sellers");

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
}

const toItemResource = ({ item, buyer, seller }: IItemRow): IActivityItemResource => ({
  id: item.id,
  activityId: item.activityId,
  serial: item.serial,
  price: item.price,
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
    .select({ item: activityItems, buyer: buyers, seller: sellers })
    .from(activityItems)
    .innerJoin(buyers, eq(buyers.id, activityItems.buyerId))
    .innerJoin(sellers, eq(sellers.id, activityItems.sellerId));

const findActivity = async (db: TDb, id: string) => {
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

    await findItem(db, activityId, itemId);
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

    await findItem(db, activityId, itemId);
    await db.delete(activityItems).where(eq(activityItems.id, itemId));

    return ok(context, { id: itemId });
  });
