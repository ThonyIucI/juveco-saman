import { createDb } from "@juveco/db";
import { dwellings } from "@juveco/db/schema/dwellings";
import { families, familyMembers } from "@juveco/db/schema/families";
import {
  DWELLING_NEIGHBORHOOD_REQUIRED_MESSAGE,
  type IMeterMatchResource,
  dwellingCodeTakenMessage,
  dwellingHasFamiliesMessage,
  formatDwellingCode,
} from "@juveco/shared/dwellings";
import { isKnownNeighborhood, neighborhoodOf } from "@juveco/shared/neighborhoods";
import { and, eq, max, ne, sql } from "drizzle-orm";
import { Hono } from "hono";

import { addMember, removeMember, updateMember } from "../lib/dwelling-members";
import {
  createDwellingSchema,
  createMemberSchema,
  updateDwellingSchema,
  updateMemberSchema,
} from "../lib/dwelling-input";
import { dwellingCodeOf, findDwellingDetail, findDwellingRow, listDwellings } from "../lib/dwelling-resources";
import type { TAppEnv } from "../lib/app-env";
import { badRequest, conflict, notFound } from "../lib/errors";
import { newId } from "../lib/ids";
import { ok } from "../lib/response";
import { validateJson } from "../lib/validator";
import { requireAuth } from "../middleware/require-role";

export const DWELLING_ROUTES = {
  DWELLINGS: "/dwellings",
  /* Antes de `DWELLING`: «next-code» y «meter-matches» no son ids. */
  NEXT_CODE: "/dwellings/next-code",
  METER_MATCHES: "/dwellings/meter-matches",
  DWELLING: "/dwellings/:id",
  FAMILY: "/dwellings/:id/families/:familyId",
  MEMBERS: "/dwellings/:id/members",
  MEMBER: "/dwellings/:id/members/:memberId",
} as const;

const FAMILY_NOT_FOUND = "No encontramos esa familia.";
const METER_QUERY_MESSAGE = "Indica el número de medidor.";
const MAX_METER_MATCHES = 5;

type TDb = ReturnType<typeof createDb>;

/* El correlativo que sigue en el barrio: el máximo actual más uno. */
const nextSequenceOf = async (db: TDb, neighborhoodId: string): Promise<number> => {
  const row = await db
    .select({ last: max(dwellings.localSequence) })
    .from(dwellings)
    .where(eq(dwellings.neighborhoodId, neighborhoodId))
    .get();
  return (row?.last ?? 0) + 1;
};

const nextCodeOf = async (db: TDb, neighborhoodId: string): Promise<{ sequence: number; code: string }> => {
  const neighborhood = neighborhoodOf(neighborhoodId);
  if (!neighborhood) {
    throw badRequest(DWELLING_NEIGHBORHOOD_REQUIRED_MESSAGE);
  }
  const sequence = await nextSequenceOf(db, neighborhoodId);
  return { sequence, code: formatDwellingCode(neighborhood.prefix, sequence) };
};

const findFamilyRow = async (db: TDb, dwellingId: string, familyId: string) => {
  const row = await db
    .select()
    .from(families)
    .where(and(eq(families.id, familyId), eq(families.dwellingId, dwellingId)))
    .get();
  if (!row) {
    throw notFound(FAMILY_NOT_FOUND);
  }
  return row;
};

/**
 * Viviendas, sus familias y los integrantes (empadronamiento). Solo administradores. Cada
 * escritura de familias e integrantes responde la vivienda completa, ya al día, para que la
 * pantalla se reemplace sin pedir nada más.
 */
export const dwellingRoutes = new Hono<TAppEnv>()
  .get(DWELLING_ROUTES.DWELLINGS, requireAuth, async (context) => ok(context, await listDwellings(createDb())))

  /* El código que le tocaría hoy a una vivienda nueva del barrio. */
  .get(DWELLING_ROUTES.NEXT_CODE, requireAuth, async (context) => {
    const neighborhoodId = context.req.query("neighborhoodId") ?? "";
    if (!isKnownNeighborhood(neighborhoodId)) {
      throw badRequest(DWELLING_NEIGHBORHOOD_REQUIRED_MESSAGE);
    }
    const { code } = await nextCodeOf(createDb(), neighborhoodId);
    return ok(context, { code });
  })

  /* Otras viviendas con el mismo medidor: solo avisa, no bloquea. */
  .get(DWELLING_ROUTES.METER_MATCHES, requireAuth, async (context) => {
    const meterNumber = (context.req.query("meterNumber") ?? "").trim();
    if (!meterNumber) {
      throw badRequest(METER_QUERY_MESSAGE);
    }
    const exceptId = context.req.query("exceptId") || undefined;
    const rows = await createDb()
      .select()
      .from(dwellings)
      .where(
        and(
          sql`lower(${dwellings.meterNumber}) = ${meterNumber.toLowerCase()}`,
          exceptId ? ne(dwellings.id, exceptId) : undefined,
        ),
      )
      .limit(MAX_METER_MATCHES);
    const matches: IMeterMatchResource[] = rows.map((row) => ({ id: row.id, code: dwellingCodeOf(row) }));
    return ok(context, matches);
  })

  .get(DWELLING_ROUTES.DWELLING, requireAuth, async (context) =>
    ok(context, await findDwellingDetail(createDb(), context.req.param("id"))),
  )

  .post(DWELLING_ROUTES.DWELLINGS, requireAuth, validateJson(createDwellingSchema), async (context) => {
    const { expectedCode, ...body } = context.req.valid("json");
    const db = createDb();

    const { sequence, code } = await nextCodeOf(db, body.neighborhoodId);
    if (code !== expectedCode) {
      throw conflict(dwellingCodeTakenMessage(expectedCode, code));
    }

    const id = newId();
    await db.insert(dwellings).values({ id, ...body, localSequence: sequence });

    return ok(context, await findDwellingDetail(db, id), 201);
  })

  /* El barrio no se cambia: el código de la vivienda lleva sus iniciales. */
  .patch(DWELLING_ROUTES.DWELLING, requireAuth, validateJson(updateDwellingSchema), async (context) => {
    const body = context.req.valid("json");
    const db = createDb();
    const current = await findDwellingRow(db, context.req.param("id"));

    await db.update(dwellings).set(body).where(eq(dwellings.id, current.id));

    return ok(context, await findDwellingDetail(db, current.id));
  })

  .delete(DWELLING_ROUTES.DWELLING, requireAuth, async (context) => {
    const db = createDb();
    const current = await findDwellingRow(db, context.req.param("id"));
    const family = await db
      .select({ id: families.id })
      .from(families)
      .where(eq(families.dwellingId, current.id))
      .get();
    if (family) {
      throw conflict(dwellingHasFamiliesMessage(dwellingCodeOf(current)));
    }
    await db.delete(dwellings).where(eq(dwellings.id, current.id));

    return ok(context, { id: current.id });
  })

  /* Borra la familia y sus integrantes (nunca a las personas). */
  .delete(DWELLING_ROUTES.FAMILY, requireAuth, async (context) => {
    const db = createDb();
    const dwelling = await findDwellingRow(db, context.req.param("id"));
    const family = await findFamilyRow(db, dwelling.id, context.req.param("familyId"));
    await db.batch([
      db.delete(familyMembers).where(eq(familyMembers.familyId, family.id)),
      db.delete(families).where(eq(families.id, family.id)),
    ]);

    return ok(context, await findDwellingDetail(db, dwelling.id));
  })

  /* La persona, su familia y su jefatura en una sola escritura; la familia se crea sola si hace falta. */
  .post(DWELLING_ROUTES.MEMBERS, requireAuth, validateJson(createMemberSchema), async (context) => {
    const db = createDb();
    const dwelling = await findDwellingRow(db, context.req.param("id"));
    await addMember(db, dwelling, context.req.valid("json"));

    return ok(context, await findDwellingDetail(db, dwelling.id), 201);
  })

  .patch(DWELLING_ROUTES.MEMBER, requireAuth, validateJson(updateMemberSchema), async (context) => {
    const db = createDb();
    const dwelling = await findDwellingRow(db, context.req.param("id"));
    await updateMember(db, dwelling, context.req.param("memberId"), context.req.valid("json"));

    return ok(context, await findDwellingDetail(db, dwelling.id));
  })

  .delete(DWELLING_ROUTES.MEMBER, requireAuth, async (context) => {
    const db = createDb();
    const dwelling = await findDwellingRow(db, context.req.param("id"));
    await removeMember(db, dwelling, context.req.param("memberId"));

    return ok(context, await findDwellingDetail(db, dwelling.id));
  });
