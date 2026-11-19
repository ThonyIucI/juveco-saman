import { createDb } from "@juveco/db";
import { activities } from "@juveco/db/schema/activities";
import { projects } from "@juveco/db/schema/projects";
import type { IActivityBalance } from "@juveco/shared/activity-expenses";
import { isIsoDate } from "@juveco/shared/dates";
import { roundSoles } from "@juveco/shared/money";
import {
  type IProjectDetail,
  type IProjectProgress,
  type IProjectResource,
  PROJECT_BENEFICIARIES_INVALID_MESSAGE,
  PROJECT_CLOSED_MESSAGE,
  PROJECT_DATE_INVALID_MESSAGE,
  PROJECT_DESCRIPTION_LENGTH_MESSAGE,
  PROJECT_DESCRIPTION_MAX_LENGTH,
  PROJECT_END_BEFORE_START_MESSAGE,
  PROJECT_NAME_LENGTH_MESSAGE,
  PROJECT_NAME_MAX_LENGTH,
  PROJECT_NAME_REQUIRED_MESSAGE,
  PROJECT_TYPES,
  PROJECT_TYPE_REQUIRED_MESSAGE,
} from "@juveco/shared/projects";
import { desc, eq, isNotNull, sql } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";

import type { TAppEnv } from "../lib/app-env";
import { conflict, notFound } from "../lib/errors";
import { newId } from "../lib/ids";
import { ok } from "../lib/response";
import { validateJson } from "../lib/validator";
import { requireAuth, requireSuperadmin } from "../middleware/require-role";

import { type TDb, priceSchema, toActivityResource } from "./activities";
import { buildBalance } from "./activity-finances";

export const PROJECT_ROUTES = {
  PROJECTS: "/projects",
  PROJECT: "/projects/:id",
  CLOSE: "/projects/:id/close",
  REOPEN: "/projects/:id/reopen",
} as const;

const PROJECT_NOT_FOUND = "No encontramos ese proyecto.";
const ALREADY_CLOSED_MESSAGE = "El proyecto ya está cerrado.";
const NOT_CLOSED_MESSAGE = "El proyecto no está cerrado.";

const collapseSpaces = (value: string) => value.replace(/\s+/g, " ");
const emptyToNull = (value: string) => (value === "" ? null : value);

const dateSchema = z.string(PROJECT_DATE_INVALID_MESSAGE).refine(isIsoDate, PROJECT_DATE_INVALID_MESSAGE);

const projectSchema = z
  .object({
    type: z.enum(PROJECT_TYPES, PROJECT_TYPE_REQUIRED_MESSAGE),
    name: z
      .string(PROJECT_NAME_REQUIRED_MESSAGE)
      .trim()
      .min(1, PROJECT_NAME_REQUIRED_MESSAGE)
      .max(PROJECT_NAME_MAX_LENGTH, PROJECT_NAME_LENGTH_MESSAGE)
      .transform(collapseSpaces),
    description: z
      .string(PROJECT_DESCRIPTION_LENGTH_MESSAGE)
      .trim()
      .max(PROJECT_DESCRIPTION_MAX_LENGTH, PROJECT_DESCRIPTION_LENGTH_MESSAGE)
      .transform(emptyToNull)
      .nullable()
      .optional(),
    startDate: dateSchema,
    endDate: dateSchema.nullable().optional(),
    goalAmount: priceSchema.nullable().optional(),
    beneficiaryCount: z
      .number(PROJECT_BENEFICIARIES_INVALID_MESSAGE)
      .int(PROJECT_BENEFICIARIES_INVALID_MESSAGE)
      .positive(PROJECT_BENEFICIARIES_INVALID_MESSAGE)
      .nullable()
      .optional(),
  })
  .refine((body) => !body.endDate || body.endDate >= body.startDate, {
    path: ["endDate"],
    message: PROJECT_END_BEFORE_START_MESSAGE,
  })
  .transform((body) => ({
    type: body.type,
    name: body.name,
    description: body.description ?? null,
    startDate: body.startDate,
    endDate: body.endDate ?? null,
    goalAmount: body.goalAmount ?? null,
    beneficiaryCount: body.beneficiaryCount ?? null,
  }));

type TProjectRow = typeof projects.$inferSelect;

/*
  Se cuenta en una consulta aparte y no con un subselect: en una consulta de una sola tabla,
  Drizzle escribe las columnas sin su tabla, y `project_id = id` terminaba comparando la
  actividad consigo misma (siempre 0).
*/
const countActivitiesByProject = async (db: TDb, projectId?: string): Promise<Map<string, number>> => {
  const rows = await db
    .select({ projectId: activities.projectId, count: sql<number>`count(*)`.mapWith(Number) })
    .from(activities)
    .where(projectId ? eq(activities.projectId, projectId) : isNotNull(activities.projectId))
    .groupBy(activities.projectId);
  return new Map(rows.map((row) => [row.projectId ?? "", row.count]));
};

const toProjectResource = (row: TProjectRow, activityCount: number): IProjectResource => ({
  id: row.id,
  type: row.type,
  name: row.name,
  description: row.description,
  startDate: row.startDate,
  endDate: row.endDate,
  goalAmount: row.goalAmount,
  beneficiaryCount: row.beneficiaryCount,
  closedAt: row.closedAt?.toISOString() ?? null,
  activityCount,
});

const findProject = async (db: TDb, id: string) => {
  const [project, counts] = await Promise.all([
    db.select().from(projects).where(eq(projects.id, id)).get(),
    countActivitiesByProject(db, id),
  ]);
  if (!project) {
    throw notFound(PROJECT_NOT_FOUND);
  }
  return { project, activityCount: counts.get(id) ?? 0 };
};

const sumBalances = (balances: IActivityBalance[]): IProjectProgress => {
  const total = (pick: (balance: IActivityBalance) => number) =>
    roundSoles(balances.reduce((acc, balance) => acc + pick(balance), 0));
  return {
    collected: total((balance) => balance.collected),
    expected: total((balance) => balance.expected),
    purchasedPrizes: total((balance) => balance.purchasedPrizes),
    expenses: total((balance) => balance.expenses),
    currentProfit: total((balance) => balance.currentProfit),
    expectedProfit: total((balance) => balance.expectedProfit),
  };
};

/**
 * Eventos y proyectos (acordado 2026-11-17). Cualquier administrador los crea, edita y cierra;
 * solo el superadmin reabre uno cerrado. Un proyecto cerrado no se edita.
 */
export const projectRoutes = new Hono<TAppEnv>()
  .get(PROJECT_ROUTES.PROJECTS, requireAuth, async (context) => {
    const db = createDb();
    const [rows, counts] = await Promise.all([
      db.select().from(projects).orderBy(desc(projects.startDate)),
      countActivitiesByProject(db),
    ]);
    return ok(
      context,
      rows.map((project) => toProjectResource(project, counts.get(project.id) ?? 0)),
    );
  })

  .get(PROJECT_ROUTES.PROJECT, requireAuth, async (context) => {
    const db = createDb();
    const { project, activityCount } = await findProject(db, context.req.param("id"));
    const projectActivities = await db
      .select()
      .from(activities)
      .where(eq(activities.projectId, project.id))
      .orderBy(desc(activities.eventDate));
    const balances = await Promise.all(projectActivities.map((activity) => buildBalance(db, activity.id)));

    const detail: IProjectDetail = {
      project: toProjectResource(project, activityCount),
      progress: sumBalances(balances),
      activities: projectActivities.map((activity, index) => ({
        ...toActivityResource(activity),
        balance: balances[index] as IActivityBalance,
      })),
    };
    return ok(context, detail);
  })

  .post(PROJECT_ROUTES.PROJECTS, requireAuth, validateJson(projectSchema), async (context) => {
    const body = context.req.valid("json");
    const db = createDb();

    const id = newId();
    await db.insert(projects).values({ id, ...body });

    const { project, activityCount } = await findProject(db, id);
    return ok(context, toProjectResource(project, activityCount), 201);
  })

  .patch(PROJECT_ROUTES.PROJECT, requireAuth, validateJson(projectSchema), async (context) => {
    const body = context.req.valid("json");
    const db = createDb();

    const current = await findProject(db, context.req.param("id"));
    if (current.project.closedAt) {
      throw conflict(PROJECT_CLOSED_MESSAGE);
    }
    await db.update(projects).set(body).where(eq(projects.id, current.project.id));

    const { project, activityCount } = await findProject(db, current.project.id);
    return ok(context, toProjectResource(project, activityCount));
  })

  .post(PROJECT_ROUTES.CLOSE, requireAuth, async (context) => {
    const db = createDb();
    const current = await findProject(db, context.req.param("id"));
    if (current.project.closedAt) {
      throw conflict(ALREADY_CLOSED_MESSAGE);
    }
    await db.update(projects).set({ closedAt: new Date() }).where(eq(projects.id, current.project.id));

    const { project, activityCount } = await findProject(db, current.project.id);
    return ok(context, toProjectResource(project, activityCount));
  })

  .post(PROJECT_ROUTES.REOPEN, requireSuperadmin, async (context) => {
    const db = createDb();
    const current = await findProject(db, context.req.param("id"));
    if (!current.project.closedAt) {
      throw conflict(NOT_CLOSED_MESSAGE);
    }
    await db.update(projects).set({ closedAt: null }).where(eq(projects.id, current.project.id));

    const { project, activityCount } = await findProject(db, current.project.id);
    return ok(context, toProjectResource(project, activityCount));
  });
