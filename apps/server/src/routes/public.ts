import { createDb } from "@juveco/db";
import { activities } from "@juveco/db/schema/activities";
import { activityExpenses } from "@juveco/db/schema/activity-expenses";
import { activityIncomes } from "@juveco/db/schema/activity-incomes";
import { activityPrizes } from "@juveco/db/schema/activity-prizes";
import { projects } from "@juveco/db/schema/projects";
import { EActivityType, type TActivityType } from "@juveco/shared/activities";
import type { IActivityBalance } from "@juveco/shared/activity-expenses";
import { roundSoles } from "@juveco/shared/money";
import { fullName } from "@juveco/shared/people";
import {
  EPublicIncomeSource,
  type IPublicAccountLine,
  type IPublicAccounts,
  type IPublicActivity,
  type IPublicHome,
  type IPublicIncomeLine,
  type IPublicPrize,
  type IPublicProject,
} from "@juveco/shared/public";
import { asc, desc, eq, inArray } from "drizzle-orm";
import { Hono } from "hono";

import type { TAppEnv } from "../lib/app-env";
import { ok } from "../lib/response";

import type { TDb } from "./activities";
import { buildBalance, selectPrizes, toPrizeResource } from "./activity-finances";

export const PUBLIC_ROUTES = {
  HOME: "/public/home",
} as const;

/* La portada cambia poco: un minuto de caché alivia al Worker si se comparte el enlace. */
const CACHE_CONTROL = "public, max-age=60";

const PURCHASED_PRIZES_CONCEPT = "Compra de premios";
const DONATIONS_CONCEPT = "Donaciones y apoyos";
const BINGO_SALES_CONCEPT = "Venta de cartillas";
const OTHER_SALES_CONCEPT = "Ventas";

/*
  Un ingreso anotado a mano como donación o aporte puede llevar el nombre de quien lo dio en
  el concepto («Donación de Juan»). Todos esos se suman en un solo renglón: nunca se muestra
  cuánto dio cada persona.
*/
const DONATION_CONCEPT_PATTERN = /donaci|aporte|apoyo|colabora/i;

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

const loadActivities = async (db: TDb, projectId: string) => {
  const rows = await db
    .select()
    .from(activities)
    .where(eq(activities.projectId, projectId))
    .orderBy(asc(activities.eventDate), asc(activities.createdAt));
  const ids = rows.map((row) => row.id);
  if (ids.length === 0) {
    return { rows, prizes: [], incomes: [], expenses: [], balances: [] };
  }

  const [prizes, incomes, expenses, balances] = await Promise.all([
    selectPrizes(db).where(inArray(activityPrizes.activityId, ids)).orderBy(asc(activityPrizes.createdAt)),
    db
      .select({ concept: activityIncomes.concept, amount: activityIncomes.amount })
      .from(activityIncomes)
      .where(inArray(activityIncomes.activityId, ids)),
    db
      .select({ concept: activityExpenses.concept, amount: activityExpenses.amount })
      .from(activityExpenses)
      .where(inArray(activityExpenses.activityId, ids)),
    /* El mismo balance del panel: así la portada y la directiva nunca muestran cifras distintas. */
    Promise.all(rows.map(async (row) => ({ type: row.type, balance: await buildBalance(db, row.id) }))),
  ]);
  return { rows, prizes: prizes.map(toPrizeResource), incomes, expenses, balances };
};

interface IAmountRow {
  concept: string;
  amount: number;
}

/** Suma los renglones del mismo concepto (sin importar mayúsculas), de mayor a menor monto. */
const sumByConcept = (rows: IAmountRow[]): IPublicAccountLine[] => {
  const totals = new Map<string, IPublicAccountLine>();
  for (const { concept, amount } of rows) {
    const label = concept.trim();
    const key = label.toLocaleLowerCase("es");
    totals.set(key, { label: totals.get(key)?.label ?? label, amount: (totals.get(key)?.amount ?? 0) + amount });
  }
  return [...totals.values()]
    .map((line) => ({ ...line, amount: roundSoles(line.amount) }))
    .filter((line) => line.amount > 0)
    .sort((first, second) => second.amount - first.amount);
};

const otherIncomeLines = (incomes: IAmountRow[]): IPublicIncomeLine[] => {
  const isDonation = ({ concept }: IAmountRow) => DONATION_CONCEPT_PATTERN.test(concept);
  const donated = roundSoles(incomes.filter(isDonation).reduce((total, income) => total + income.amount, 0));
  return [
    ...sumByConcept(incomes.filter((income) => !isDonation(income))).map((line) => ({
      ...line,
      source: EPublicIncomeSource.OTHER,
    })),
    ...(donated > 0 ? [{ label: DONATIONS_CONCEPT, amount: donated, source: EPublicIncomeSource.DONATIONS }] : []),
  ];
};

type TActivityBalances = { type: TActivityType; balance: IActivityBalance }[];

/**
 * Cuentas claras del proyecto con montos **por concepto**, nunca por persona. Los totales salen
 * de `buildBalance`: lo cobrado de cartillas es `collected - incomes` (los pagos de los equipos
 * no cuentan; las inscripciones entran como ingresos anotados a mano).
 */
const buildAccounts = (incomes: IAmountRow[], expenses: IAmountRow[], balances: TActivityBalances): IPublicAccounts => {
  const salesLines = sumByConcept(
    balances.map(({ type, balance }) => ({
      concept: type === EActivityType.BINGO ? BINGO_SALES_CONCEPT : OTHER_SALES_CONCEPT,
      amount: balance.collected - balance.incomes,
    })),
  ).map((line) => ({ ...line, source: EPublicIncomeSource.SALES }));
  const purchasedPrizes = roundSoles(balances.reduce((total, { balance }) => total + balance.purchasedPrizes, 0));

  const collected = roundSoles(balances.reduce((total, { balance }) => total + balance.collected, 0));
  const spent = roundSoles(balances.reduce((total, { balance }) => total + balance.purchasedPrizes + balance.expenses, 0));

  return {
    collected,
    spent,
    remaining: roundSoles(collected - spent),
    incomes: [...salesLines, ...otherIncomeLines(incomes)].sort((first, second) => second.amount - first.amount),
    expenses: sumByConcept([...(purchasedPrizes > 0 ? [{ concept: PURCHASED_PRIZES_CONCEPT, amount: purchasedPrizes }] : []), ...expenses]),
  };
};

const toPublicProject = async (db: TDb, project: typeof projects.$inferSelect): Promise<IPublicProject> => {
  const { rows, prizes, incomes, expenses, balances } = await loadActivities(db, project.id);
  const prizesByActivity = groupBy(prizes, (prize) => prize.activityId);

  const publicActivities = rows.map((row): IPublicActivity => {
    const ownPrizes = prizesByActivity.get(row.id) ?? [];
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
    accounts: buildAccounts(incomes, expenses, balances),
    supporters,
  };
};

/**
 * La portada pública (acordado 2026-11-25), sin sesión: el evento o proyecto más reciente con
 * sus actividades, premios (con donante y ganador) y sus cuentas claras con montos por concepto
 * (Thony, 2026-11-25), nunca por persona: quienes apoyaron van aparte, solo con el nombre.
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
