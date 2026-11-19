import { createDb } from "@juveco/db";
import { activityTeamPayments, activityTeamPlayers, activityTeams } from "@juveco/db/schema/activity-teams";
import { users } from "@juveco/db/schema/users";
import { EActivityType } from "@juveco/shared/activities";
import { PAYMENT_ALREADY_PAID_MESSAGE, paymentOverPendingMessage } from "@juveco/shared/activity-item-payments";
import {
  type IActivityTeamPaymentResource,
  type IActivityTeamPerson,
  type IActivityTeamResource,
  NOT_A_CHAMPIONSHIP_MESSAGE,
  TEAM_DELEGATE_REQUIRED_MESSAGE,
  TEAM_MAX_PLAYERS,
  TEAM_NAME_LENGTH_MESSAGE,
  TEAM_NAME_MAX_LENGTH,
  TEAM_NAME_REQUIRED_MESSAGE,
  TEAM_NAME_TAKEN_MESSAGE,
  TEAM_PLAYERS_MAX_MESSAGE,
  TEAM_PLAYER_REPEATED_MESSAGE,
  playerInOtherTeamMessage,
} from "@juveco/shared/activity-teams";
import { formatSoles, roundSoles } from "@juveco/shared/money";
import { neighborhoodOf } from "@juveco/shared/neighborhoods";
import { fullName } from "@juveco/shared/people";
import { and, asc, eq, inArray, ne, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/sqlite-core";
import { Hono } from "hono";
import { z } from "zod";

import type { TAppEnv } from "../lib/app-env";
import { badRequest, conflict, notFound } from "../lib/errors";
import { newId } from "../lib/ids";
import { noteSchema } from "../lib/person-input";
import { assertActivityOpen } from "../lib/project-guards";
import { ok } from "../lib/response";
import { validateJson } from "../lib/validator";
import { requireAuth } from "../middleware/require-role";

import {
  COLLECTOR_NOT_FOUND,
  type TDb,
  assertIsAdmin,
  createPaymentSchema,
  findActivity,
  pendingOf,
} from "./activities";

export const ACTIVITY_TEAM_ROUTES = {
  TEAMS: "/activities/:id/teams",
  TEAM: "/activities/:id/teams/:teamId",
  PAYMENTS: "/activities/:id/teams/:teamId/payments",
  PAYMENT: "/activities/:id/teams/:teamId/payments/:paymentId",
} as const;

const TEAM_NOT_FOUND = "No encontramos ese equipo.";
const PAYMENT_NOT_FOUND = "No encontramos ese pago.";
const DELEGATE_NOT_FOUND = "No encontramos al delegado.";
const PLAYER_NOT_FOUND = "No encontramos a uno de los jugadores.";

const collapseSpaces = (value: string) => value.replace(/\s+/g, " ");

const teamSchema = z.object({
  name: z
    .string(TEAM_NAME_REQUIRED_MESSAGE)
    .trim()
    .min(1, TEAM_NAME_REQUIRED_MESSAGE)
    .max(TEAM_NAME_MAX_LENGTH, TEAM_NAME_LENGTH_MESSAGE)
    .transform(collapseSpaces),
  delegateId: z.string(TEAM_DELEGATE_REQUIRED_MESSAGE).min(1, TEAM_DELEGATE_REQUIRED_MESSAGE),
  playerIds: z
    .array(z.string().min(1, PLAYER_NOT_FOUND))
    .max(TEAM_MAX_PLAYERS, TEAM_PLAYERS_MAX_MESSAGE)
    .refine((ids) => new Set(ids).size === ids.length, TEAM_PLAYER_REPEATED_MESSAGE)
    .default([]),
  note: noteSchema.optional(),
});

type TTeamBody = z.infer<typeof teamSchema>;
type TUserRow = typeof users.$inferSelect;

const delegates = alias(users, "delegates");

/* Lo pagado de cada equipo, sumado en la misma consulta: la deuda no se guarda. */
const paidAmountSql = sql<number>`coalesce((select sum(${activityTeamPayments.amount}) from ${activityTeamPayments} where ${activityTeamPayments.teamId} = ${activityTeams.id}), 0)`.mapWith(Number);

const toPerson = (user: TUserRow): IActivityTeamPerson => ({
  id: user.id,
  firstName: user.firstName,
  lastName: user.lastName,
  neighborhood: neighborhoodOf(user.neighborhoodId),
});

interface ITeamRow {
  team: typeof activityTeams.$inferSelect;
  delegate: TUserRow;
  paidAmount: number;
}

const toTeamResource = (
  { team, delegate, paidAmount }: ITeamRow,
  players: IActivityTeamPerson[],
): IActivityTeamResource => ({
  id: team.id,
  activityId: team.activityId,
  name: team.name,
  price: team.price,
  paidAmount: roundSoles(paidAmount),
  delegate: toPerson(delegate),
  players,
  note: team.note,
  createdAt: team.createdAt.toISOString(),
});

const selectTeams = (db: TDb) =>
  db
    .select({ team: activityTeams, delegate: delegates, paidAmount: paidAmountSql })
    .from(activityTeams)
    .innerJoin(delegates, eq(delegates.id, activityTeams.delegateId));

/** Los jugadores de varios equipos, por equipo y ordenados por nombre. */
const loadPlayers = async (db: TDb, teamIds: string[]): Promise<Map<string, IActivityTeamPerson[]>> => {
  const byTeam = new Map<string, IActivityTeamPerson[]>(teamIds.map((id) => [id, []]));
  if (teamIds.length === 0) {
    return byTeam;
  }
  const rows = await db
    .select({ teamId: activityTeamPlayers.teamId, user: users })
    .from(activityTeamPlayers)
    .innerJoin(users, eq(users.id, activityTeamPlayers.userId))
    .where(inArray(activityTeamPlayers.teamId, teamIds))
    .orderBy(asc(users.firstName), asc(users.lastName));
  for (const { teamId, user } of rows) {
    byTeam.get(teamId)?.push(toPerson(user));
  }
  return byTeam;
};

const findTeamRow = async (db: TDb, activityId: string, teamId: string) => {
  const row = await selectTeams(db)
    .where(and(eq(activityTeams.id, teamId), eq(activityTeams.activityId, activityId)))
    .get();
  if (!row) {
    throw notFound(TEAM_NOT_FOUND);
  }
  return row;
};

const findTeam = async (db: TDb, activityId: string, teamId: string): Promise<IActivityTeamResource> => {
  const row = await findTeamRow(db, activityId, teamId);
  const players = await loadPlayers(db, [row.team.id]);
  return toTeamResource(row, players.get(row.team.id) ?? []);
};

const assertChampionship = (activity: { type: string }) => {
  if (activity.type !== EActivityType.CHAMPIONSHIP) {
    throw badRequest(NOT_A_CHAMPIONSHIP_MESSAGE);
  }
};

/* El nombre no se repite en el campeonato, sin importar mayúsculas. */
const assertNameAvailable = async (db: TDb, activityId: string, name: string, exceptTeamId?: string) => {
  const taken = await db
    .select({ id: activityTeams.id })
    .from(activityTeams)
    .where(
      and(
        eq(activityTeams.activityId, activityId),
        sql`lower(${activityTeams.name}) = lower(${name})`,
        exceptTeamId ? ne(activityTeams.id, exceptTeamId) : undefined,
      ),
    )
    .get();
  if (taken) {
    throw conflict(TEAM_NAME_TAKEN_MESSAGE);
  }
};

const assertPeopleExist = async (db: TDb, body: TTeamBody) => {
  const delegate = await db.select({ id: users.id }).from(users).where(eq(users.id, body.delegateId)).get();
  if (!delegate) {
    throw badRequest(DELEGATE_NOT_FOUND);
  }
  if (body.playerIds.length === 0) {
    return;
  }
  const found = await db.select({ id: users.id }).from(users).where(inArray(users.id, body.playerIds));
  if (found.length !== body.playerIds.length) {
    throw badRequest(PLAYER_NOT_FOUND);
  }
};

/* Un jugador no juega en dos equipos del mismo campeonato (ver `playerInOtherTeamMessage`). */
const assertPlayersFree = async (db: TDb, activityId: string, playerIds: string[], exceptTeamId?: string) => {
  if (playerIds.length === 0) {
    return;
  }
  const busy = await db
    .select({ user: users, teamName: activityTeams.name })
    .from(activityTeamPlayers)
    .innerJoin(activityTeams, eq(activityTeams.id, activityTeamPlayers.teamId))
    .innerJoin(users, eq(users.id, activityTeamPlayers.userId))
    .where(
      and(
        eq(activityTeams.activityId, activityId),
        inArray(activityTeamPlayers.userId, playerIds),
        exceptTeamId ? ne(activityTeams.id, exceptTeamId) : undefined,
      ),
    )
    .get();
  if (busy) {
    throw conflict(playerInOtherTeamMessage(fullName(busy.user), busy.teamName));
  }
};

const assertTeamBody = async (db: TDb, activityId: string, body: TTeamBody, exceptTeamId?: string) => {
  await assertNameAvailable(db, activityId, body.name, exceptTeamId);
  await assertPeopleExist(db, body);
  await assertPlayersFree(db, activityId, body.playerIds, exceptTeamId);
};

const playerRows = (teamId: string, playerIds: string[]) =>
  playerIds.map((userId) => ({ id: newId(), teamId, userId }));

interface IPaymentRow {
  payment: typeof activityTeamPayments.$inferSelect;
  collector: TUserRow;
}

const toPaymentResource = ({ payment, collector }: IPaymentRow): IActivityTeamPaymentResource => ({
  id: payment.id,
  teamId: payment.teamId,
  amount: payment.amount,
  method: payment.method,
  collector: { id: collector.id, firstName: collector.firstName, lastName: collector.lastName },
  createdAt: payment.createdAt.toISOString(),
});

const selectPayments = (db: TDb) =>
  db
    .select({ payment: activityTeamPayments, collector: users })
    .from(activityTeamPayments)
    .innerJoin(users, eq(users.id, activityTeamPayments.collectorId));

const findPayment = async (db: TDb, teamId: string, paymentId: string) => {
  const row = await selectPayments(db)
    .where(and(eq(activityTeamPayments.id, paymentId), eq(activityTeamPayments.teamId, teamId)))
    .get();
  if (!row) {
    throw notFound(PAYMENT_NOT_FOUND);
  }
  return row;
};

/**
 * Equipos de un campeonato y los pagos de su inscripción (acordado 2026-11-19). Cualquier
 * administrador los agrega, edita y cobra. Cobrar sigue las reglas de las cartillas: por
 * partes, nunca más de lo que falta, y un pago mal puesto se elimina y se registra de nuevo.
 */
export const activityTeamRoutes = new Hono<TAppEnv>()
  .get(ACTIVITY_TEAM_ROUTES.TEAMS, requireAuth, async (context) => {
    const db = createDb();
    const activity = await findActivity(db, context.req.param("id"));
    const rows = await selectTeams(db)
      .where(eq(activityTeams.activityId, activity.id))
      .orderBy(asc(activityTeams.createdAt));
    const players = await loadPlayers(
      db,
      rows.map((row) => row.team.id),
    );
    return ok(
      context,
      rows.map((row) => toTeamResource(row, players.get(row.team.id) ?? [])),
    );
  })

  .post(ACTIVITY_TEAM_ROUTES.TEAMS, requireAuth, validateJson(teamSchema), async (context) => {
    const body = context.req.valid("json");
    const db = createDb();

    const activity = await findActivity(db, context.req.param("id"));
    assertChampionship(activity);
    await assertActivityOpen(db, activity);
    await assertTeamBody(db, activity.id, body);

    const id = newId();
    const insertTeam = db.insert(activityTeams).values({
      id,
      activityId: activity.id,
      name: body.name,
      delegateId: body.delegateId,
      price: activity.defaultPrice,
      note: body.note ?? null,
    });
    /* El equipo y sus jugadores juntos: D1 aplica el `batch` entero o nada. */
    if (body.playerIds.length > 0) {
      await db.batch([insertTeam, db.insert(activityTeamPlayers).values(playerRows(id, body.playerIds))]);
    } else {
      await insertTeam;
    }

    return ok(context, await findTeam(db, activity.id, id), 201);
  })

  /* Se manda el equipo completo: los jugadores se reemplazan por la lista nueva. */
  .patch(ACTIVITY_TEAM_ROUTES.TEAM, requireAuth, validateJson(teamSchema), async (context) => {
    const body = context.req.valid("json");
    const activityId = context.req.param("id");
    const teamId = context.req.param("teamId");
    const db = createDb();

    await assertActivityOpen(db, await findActivity(db, activityId));
    await findTeamRow(db, activityId, teamId);
    await assertTeamBody(db, activityId, body, teamId);

    const updateTeam = db
      .update(activityTeams)
      .set({ name: body.name, delegateId: body.delegateId, note: body.note ?? null })
      .where(eq(activityTeams.id, teamId));
    const deletePlayers = db.delete(activityTeamPlayers).where(eq(activityTeamPlayers.teamId, teamId));
    if (body.playerIds.length > 0) {
      await db.batch([
        updateTeam,
        deletePlayers,
        db.insert(activityTeamPlayers).values(playerRows(teamId, body.playerIds)),
      ]);
    } else {
      await db.batch([updateTeam, deletePlayers]);
    }

    return ok(context, await findTeam(db, activityId, teamId));
  })

  .delete(ACTIVITY_TEAM_ROUTES.TEAM, requireAuth, async (context) => {
    const activityId = context.req.param("id");
    const teamId = context.req.param("teamId");
    const db = createDb();

    await assertActivityOpen(db, await findActivity(db, activityId));
    const current = await findTeamRow(db, activityId, teamId);
    /* Borrar el equipo se llevaría plata ya cobrada: primero se eliminan sus pagos. */
    if (current.paidAmount > 0) {
      throw conflict(`«${current.team.name}» tiene pagos: primero elimínalos desde su detalle.`);
    }
    await db.batch([
      db.delete(activityTeamPlayers).where(eq(activityTeamPlayers.teamId, teamId)),
      db.delete(activityTeams).where(eq(activityTeams.id, teamId)),
    ]);

    return ok(context, { id: teamId });
  })

  .get(ACTIVITY_TEAM_ROUTES.PAYMENTS, requireAuth, async (context) => {
    const db = createDb();
    const { team } = await findTeamRow(db, context.req.param("id"), context.req.param("teamId"));
    const rows = await selectPayments(db)
      .where(eq(activityTeamPayments.teamId, team.id))
      .orderBy(asc(activityTeamPayments.createdAt));
    return ok(context, rows.map(toPaymentResource));
  })

  .post(ACTIVITY_TEAM_ROUTES.PAYMENTS, requireAuth, validateJson(createPaymentSchema), async (context) => {
    const body = context.req.valid("json");
    const activityId = context.req.param("id");
    const teamId = context.req.param("teamId");
    const db = createDb();

    await assertActivityOpen(db, await findActivity(db, activityId));
    if (body.collectorId !== undefined) {
      await assertIsAdmin(db, body.collectorId, COLLECTOR_NOT_FOUND);
    }
    const current = await findTeamRow(db, activityId, teamId);
    const pending = pendingOf(current.team.price, current.paidAmount);
    if (pending === 0) {
      throw badRequest(PAYMENT_ALREADY_PAID_MESSAGE);
    }
    if (body.amount > pending) {
      throw badRequest(paymentOverPendingMessage(formatSoles(pending)));
    }

    const id = newId();
    await db.insert(activityTeamPayments).values({
      id,
      teamId,
      amount: body.amount,
      method: body.method,
      collectorId: body.collectorId ?? context.var.user.id,
    });

    const [payment, team] = await Promise.all([findPayment(db, teamId, id), findTeam(db, activityId, teamId)]);
    return ok(context, { payment: toPaymentResource(payment), item: team }, 201);
  })

  .delete(ACTIVITY_TEAM_ROUTES.PAYMENT, requireAuth, async (context) => {
    const activityId = context.req.param("id");
    const teamId = context.req.param("teamId");
    const db = createDb();

    await assertActivityOpen(db, await findActivity(db, activityId));
    await findTeamRow(db, activityId, teamId);
    const payment = await findPayment(db, teamId, context.req.param("paymentId"));
    await db.delete(activityTeamPayments).where(eq(activityTeamPayments.id, payment.payment.id));

    return ok(context, { payment: toPaymentResource(payment), item: await findTeam(db, activityId, teamId) });
  });
