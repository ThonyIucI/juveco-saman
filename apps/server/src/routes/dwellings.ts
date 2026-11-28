import { createDb } from "@juveco/db";
import { dwellings } from "@juveco/db/schema/dwellings";
import { families, familyMembers } from "@juveco/db/schema/families";
import { users } from "@juveco/db/schema/users";
import {
  DWELLING_NEIGHBORHOOD_REQUIRED_MESSAGE,
  type IMeterMatchResource,
  dwellingCodeTakenMessage,
  dwellingHasFamiliesMessage,
  formatDwellingCode,
} from "@juveco/shared/dwellings";
import {
  EFamilyRelationship,
  FAMILY_HEAD_LOCKED_MESSAGE,
  personInOtherFamilyMessage,
} from "@juveco/shared/families";
import { isKnownNeighborhood, neighborhoodOf } from "@juveco/shared/neighborhoods";
import { fullName } from "@juveco/shared/people";
import { and, eq, max, ne, sql } from "drizzle-orm";
import { Hono } from "hono";

import {
  createDwellingSchema,
  createFamilySchema,
  familyMemberSchema,
  updateDwellingSchema,
  updateFamilyMemberSchema,
  updateFamilySchema,
} from "../lib/dwelling-input";
import {
  dwellingCodeOf,
  findDwellingDetail,
  findDwellingRow,
  listDwellings,
} from "../lib/dwelling-resources";
import type { TAppEnv } from "../lib/app-env";
import { badRequest, conflict, forbidden, notFound } from "../lib/errors";
import { newId } from "../lib/ids";
import { toPhoneColumns } from "../lib/phone-input";
import { ok } from "../lib/response";
import { validateJson } from "../lib/validator";
import { requireAuth } from "../middleware/require-role";

export const DWELLING_ROUTES = {
  DWELLINGS: "/dwellings",
  /* Antes de `DWELLING`: «next-code» y «meter-matches» no son ids. */
  NEXT_CODE: "/dwellings/next-code",
  METER_MATCHES: "/dwellings/meter-matches",
  DWELLING: "/dwellings/:id",
  FAMILIES: "/dwellings/:id/families",
  FAMILY: "/dwellings/:id/families/:familyId",
  MEMBERS: "/dwellings/:id/families/:familyId/members",
  MEMBER: "/dwellings/:id/families/:familyId/members/:memberId",
} as const;

const FAMILY_NOT_FOUND = "No encontramos esa familia.";
const MEMBER_NOT_FOUND = "No encontramos a ese integrante.";
const PERSON_NOT_FOUND = "No encontramos a esa persona.";
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

const findMemberRow = async (db: TDb, familyId: string, memberId: string) => {
  const row = await db
    .select()
    .from(familyMembers)
    .where(and(eq(familyMembers.id, memberId), eq(familyMembers.familyId, familyId)))
    .get();
  if (!row) {
    throw notFound(MEMBER_NOT_FOUND);
  }
  return row;
};

const findUserRow = async (db: TDb, id: string) => {
  const row = await db.select().from(users).where(eq(users.id, id)).get();
  if (!row) {
    throw badRequest(PERSON_NOT_FOUND);
  }
  return row;
};

/* Una persona integra una sola familia: si ya está en una, se dice en qué vivienda. */
const assertPersonFree = async (db: TDb, userId: string) => {
  const found = await db
    .select({ user: users, dwelling: dwellings })
    .from(familyMembers)
    .innerJoin(families, eq(families.id, familyMembers.familyId))
    .innerJoin(dwellings, eq(dwellings.id, families.dwellingId))
    .innerJoin(users, eq(users.id, familyMembers.userId))
    .where(eq(familyMembers.userId, userId))
    .get();
  if (found) {
    throw conflict(personInOtherFamilyMessage(fullName(found.user), dwellingCodeOf(found.dwelling)));
  }
};

/*
  El contacto alternativo solo se guarda si el jefe no tiene teléfono: con teléfono, el jefe
  ya es el contacto y lo que llegue se ignora.
*/
const contactColumns = (
  contact: { name: string; phone: Parameters<typeof toPhoneColumns>[0] } | null,
  headHasPhone: boolean,
) => {
  const effective = headHasPhone ? null : contact;
  const phone = toPhoneColumns(effective?.phone ?? null);
  return {
    contactName: effective?.name ?? null,
    contactCountryPrefix: phone.countryPrefix,
    contactPhone: phone.phone,
  };
};

const hasPhone = (user: { countryPrefix: string | null; phone: string | null }): boolean =>
  Boolean(user.countryPrefix && user.phone);

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

  /* La familia y su jefe juntos: D1 aplica el `batch` entero o nada. */
  .post(DWELLING_ROUTES.FAMILIES, requireAuth, validateJson(createFamilySchema), async (context) => {
    const body = context.req.valid("json");
    const db = createDb();
    const dwelling = await findDwellingRow(db, context.req.param("id"));
    const head = await findUserRow(db, body.headId);
    await assertPersonFree(db, head.id);

    const familyId = newId();
    await db.batch([
      db.insert(families).values({
        id: familyId,
        dwellingId: dwelling.id,
        ...contactColumns(body.contact, hasPhone(head)),
        note: body.note,
      }),
      db.insert(familyMembers).values({
        id: newId(),
        familyId,
        userId: head.id,
        relationship: EFamilyRelationship.HEAD,
      }),
    ]);

    return ok(context, await findDwellingDetail(db, dwelling.id), 201);
  })

  .patch(DWELLING_ROUTES.FAMILY, requireAuth, validateJson(updateFamilySchema), async (context) => {
    const body = context.req.valid("json");
    const db = createDb();
    const dwelling = await findDwellingRow(db, context.req.param("id"));
    const family = await findFamilyRow(db, dwelling.id, context.req.param("familyId"));
    const head = await db
      .select({ user: users })
      .from(familyMembers)
      .innerJoin(users, eq(users.id, familyMembers.userId))
      .where(and(eq(familyMembers.familyId, family.id), eq(familyMembers.relationship, EFamilyRelationship.HEAD)))
      .get();

    await db
      .update(families)
      .set({ ...contactColumns(body.contact, head ? hasPhone(head.user) : false), note: body.note })
      .where(eq(families.id, family.id));

    return ok(context, await findDwellingDetail(db, dwelling.id));
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

  .post(DWELLING_ROUTES.MEMBERS, requireAuth, validateJson(familyMemberSchema), async (context) => {
    const body = context.req.valid("json");
    const db = createDb();
    const dwelling = await findDwellingRow(db, context.req.param("id"));
    const family = await findFamilyRow(db, dwelling.id, context.req.param("familyId"));
    const person = await findUserRow(db, body.userId);
    await assertPersonFree(db, person.id);

    await db.insert(familyMembers).values({
      id: newId(),
      familyId: family.id,
      userId: person.id,
      relationship: body.relationship,
    });

    return ok(context, await findDwellingDetail(db, dwelling.id), 201);
  })

  /* Solo cambia el parentesco; el jefe no se toca. */
  .patch(DWELLING_ROUTES.MEMBER, requireAuth, validateJson(updateFamilyMemberSchema), async (context) => {
    const body = context.req.valid("json");
    const db = createDb();
    const dwelling = await findDwellingRow(db, context.req.param("id"));
    const family = await findFamilyRow(db, dwelling.id, context.req.param("familyId"));
    const member = await findMemberRow(db, family.id, context.req.param("memberId"));
    if (member.relationship === EFamilyRelationship.HEAD) {
      throw forbidden(FAMILY_HEAD_LOCKED_MESSAGE);
    }

    await db
      .update(familyMembers)
      .set({ relationship: body.relationship })
      .where(eq(familyMembers.id, member.id));

    return ok(context, await findDwellingDetail(db, dwelling.id));
  })

  .delete(DWELLING_ROUTES.MEMBER, requireAuth, async (context) => {
    const db = createDb();
    const dwelling = await findDwellingRow(db, context.req.param("id"));
    const family = await findFamilyRow(db, dwelling.id, context.req.param("familyId"));
    const member = await findMemberRow(db, family.id, context.req.param("memberId"));
    if (member.relationship === EFamilyRelationship.HEAD) {
      throw forbidden(FAMILY_HEAD_LOCKED_MESSAGE);
    }
    await db.delete(familyMembers).where(eq(familyMembers.id, member.id));

    return ok(context, await findDwellingDetail(db, dwelling.id));
  });
