import { createDb } from "@juveco/db";
import { activities } from "@juveco/db/schema/activities";
import { activityExpenses } from "@juveco/db/schema/activity-expenses";
import { activityIncomes } from "@juveco/db/schema/activity-incomes";
import { activityItems } from "@juveco/db/schema/activity-items";
import { activityPrizes } from "@juveco/db/schema/activity-prizes";
import { projects } from "@juveco/db/schema/projects";
import { type TActivityType, activityItemLabels } from "@juveco/shared/activities";
import { EPrizeOrigin } from "@juveco/shared/activity-prizes";
import { fullName } from "@juveco/shared/people";
import type { IPublicActivity, IPublicHome, IPublicPrize, IPublicProject } from "@juveco/shared/public";
import { and, asc, desc, eq, inArray, isNull, sql } from "drizzle-orm";
import { Hono } from "hono";

import type { TAppEnv } from "../lib/app-env";
import { ok } from "../lib/response";

import type { TDb } from "./activities";
import { selectPrizes, toPrizeResource } from "./activity-finances";

export const PUBLIC_ROUTES = {
  HOME: "/public/home",
} as const;

/* La portada cambia poco: un minuto de caché alivia al Worker si se comparte el enlace. */
const CACHE_CONTROL = "public, max-age=60";

const PURCHASED_PRIZES_CONCEPT = "Compra de premios";

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

/** Sin repetir, sin importar mayúsculas, en el orden en que aparecen. */
const uniqueConcepts = (concepts: string[]): string[] => {
  const seen = new Set<string>();
  return concepts.filter((concept) => {
    const key = concept.trim().toLocaleLowerCase("es");
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
};

const groupBy = <TRow>(rows: TRow[], keyOf: (row: TRow) => string): Map<string, TRow[]> => {
  const groups = new Map<string, TRow[]>();
  for (const row of rows) {
    groups.set(keyOf(row), [...(groups.get(keyOf(row)) ?? []), row]);
  }
  return groups;
};

/** Actividades que vendieron algo (cartillas): eso ya es un concepto de ingreso. */
const activitiesWithSales = async (db: TDb, activityIds: string[]): Promise<Set<string>> => {
  const rows = await db
    .select({ activityId: activityItems.activityId, count: sql<number>`count(*)`.mapWith(Number) })
    .from(activityItems)
    .where(and(inArray(activityItems.activityId, activityIds), isNull(activityItems.voidedAt)))
    .groupBy(activityItems.activityId);
  return new Set(rows.filter((row) => row.count > 0).map((row) => row.activityId));
};

const loadActivities = async (db: TDb, projectId: string) => {
  const rows = await db
    .select()
    .from(activities)
    .where(eq(activities.projectId, projectId))
    .orderBy(asc(activities.eventDate), asc(activities.createdAt));
  const ids = rows.map((row) => row.id);
  if (ids.length === 0) {
    return { rows, prizes: [], incomes: [], expenses: [], withSales: new Set<string>() };
  }

  const [prizes, incomes, expenses, withSales] = await Promise.all([
    selectPrizes(db).where(inArray(activityPrizes.activityId, ids)).orderBy(asc(activityPrizes.createdAt)),
    db
      .select({ activityId: activityIncomes.activityId, concept: activityIncomes.concept })
      .from(activityIncomes)
      .where(inArray(activityIncomes.activityId, ids))
      .orderBy(asc(activityIncomes.createdAt)),
    db
      .select({ activityId: activityExpenses.activityId, concept: activityExpenses.concept })
      .from(activityExpenses)
      .where(inArray(activityExpenses.activityId, ids))
      .orderBy(asc(activityExpenses.createdAt)),
    activitiesWithSales(db, ids),
  ]);
  return { rows, prizes: prizes.map(toPrizeResource), incomes, expenses, withSales };
};

const salesConcept = (type: TActivityType) => `Venta de ${activityItemLabels[type].plural}`;

const toPublicProject = async (db: TDb, project: typeof projects.$inferSelect): Promise<IPublicProject> => {
  const { rows, prizes, incomes, expenses, withSales } = await loadActivities(db, project.id);
  const prizesByActivity = groupBy(prizes, (prize) => prize.activityId);
  const incomesByActivity = groupBy(incomes, (income) => income.activityId);
  const expensesByActivity = groupBy(expenses, (expense) => expense.activityId);

  const publicActivities = rows.map((row): IPublicActivity => {
    const ownPrizes = prizesByActivity.get(row.id) ?? [];
    const hasPurchased = ownPrizes.some((prize) => prize.origin === EPrizeOrigin.PURCHASED);
    return {
      id: row.id,
      name: row.name,
      type: row.type,
      eventDate: row.eventDate,
      prizes: ownPrizes.map(
        (prize): IPublicPrize => ({
          name: prize.name,
          donorName: prize.donor ? fullName(prize.donor) : null,
          winner: prize.winner ? { serial: prize.winner.serial, name: fullName(prize.winner.buyer) } : null,
        }),
      ),
      incomeConcepts: uniqueConcepts([
        ...(withSales.has(row.id) ? [capitalize(salesConcept(row.type))] : []),
        ...(incomesByActivity.get(row.id) ?? []).map((income) => income.concept),
      ]),
      expenseConcepts: uniqueConcepts([
        ...(hasPurchased ? [PURCHASED_PRIZES_CONCEPT] : []),
        ...(expensesByActivity.get(row.id) ?? []).map((expense) => expense.concept),
      ]),
    };
  });

  const supporters = uniqueConcepts(
    prizes.flatMap((prize) => (prize.donor ? [fullName(prize.donor)] : [])),
  ).sort((first, second) => first.localeCompare(second, "es"));

  return {
    id: project.id,
    type: project.type,
    name: project.name,
    description: project.description,
    startDate: project.startDate,
    endDate: project.endDate,
    beneficiaryCount: project.beneficiaryCount,
    isClosed: project.closedAt !== null,
    activities: publicActivities,
    supporters,
  };
};

/**
 * La portada pública (acordado 2026-11-25), sin sesión: el evento o proyecto más reciente con
 * sus actividades, premios (con donante y ganador) y los conceptos de su balance **sin montos**.
 */
export const publicRoutes = new Hono<TAppEnv>().get(PUBLIC_ROUTES.HOME, async (context) => {
  const db = createDb();
  const project = await db
    .select()
    .from(projects)
    .orderBy(desc(projects.startDate), desc(projects.createdAt))
    .limit(1)
    .get();

  const home: IPublicHome = { project: project ? await toPublicProject(db, project) : null };
  context.header("Cache-Control", CACHE_CONTROL);
  return ok(context, home);
});
