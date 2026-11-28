import { createDb } from "@juveco/db";
import { authUsers } from "@juveco/db/schema/auth";
import { activityItems } from "@juveco/db/schema/activity-items";
import { activityPrizes } from "@juveco/db/schema/activity-prizes";
import { familyMembers } from "@juveco/db/schema/families";
import { userProfiles } from "@juveco/db/schema/user-profiles";
import { users } from "@juveco/db/schema/users";
import { isIsoDate } from "@juveco/shared/dates";
import { neighborhoodOf } from "@juveco/shared/neighborhoods";
import { fullName } from "@juveco/shared/people";
import {
  DOCUMENT_NUMBER_INVALID_MESSAGE,
  type IPersonMatchResource,
  isValidDocumentNumber,
} from "@juveco/shared/user-profiles";
import { EUserRole, type TUserRole } from "@juveco/shared/roles";
import type { IUserDetailResource, IUserResource } from "@juveco/shared/users";
import { and, asc, eq, sql } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";

import type { TAppEnv } from "../lib/app-env";
import { badRequest, conflict, forbidden, notFound } from "../lib/errors";
import { findUserByDocument, loadUserProfile } from "../lib/user-profiles";
import { userProfileSchema } from "../lib/user-profile-input";
import { firstNameSchema, personExtraFields, personSchema } from "../lib/person-input";
import { createPersonRecord, updatePersonRecord } from "../lib/person-records";
import { toPhoneResource } from "../lib/phone-input";
import { ok } from "../lib/response";
import {
  assertEmailAvailable,
  editAccessSchema,
  grantAccessSchema,
  grantLogin,
  revokeLogin,
  updateLogin,
} from "../lib/user-access";
import { validateJson } from "../lib/validator";
import { requireAuth, requireSuperadmin } from "../middleware/require-role";

export const USER_ROUTES = {
  USERS: "/users",
  /* Antes de `USER`: «matches» no es un id. */
  MATCHES: "/users/matches",
  USER: "/users/:id",
  USER_ACCESS: "/users/:id/access",
} as const;

const USER_NOT_FOUND = "No encontramos ese usuario.";
const NO_CHANGES_MESSAGE = "No hay cambios para guardar.";
const MATCHES_QUERY_MESSAGE = "Indica el DNI, o los nombres, el apellido paterno y la fecha de nacimiento.";
const MAX_MATCHES = 5;

/* `access` es opcional: con él, la persona se crea ya con su login (solo el superadmin). */
const createUserSchema = personSchema.extend({
  access: grantAccessSchema.optional(),
});

/* `access` solo lo manda el superadmin: `null` quita el acceso; con correo lo da o lo cambia. */
const updateUserSchema = z
  .object({
    firstName: firstNameSchema.optional(),
    ...personExtraFields,
    details: userProfileSchema.optional(),
    access: editAccessSchema,
  })
  .refine((body) => Object.values(body).some((value) => value !== undefined), {
    message: NO_CHANGES_MESSAGE,
  });

interface IRequester {
  id: string;
  role: TUserRole;
}

/* Solo el superadmin, y nunca sobre sí mismo ni sobre otro superadmin. */
const assertCanEditAccess = (requester: IRequester, target: TUserRow) => {
  if (requester.role !== EUserRole.SUPERADMIN) {
    throw forbidden("Solo el superadmin puede cambiar el acceso a la app.");
  }
  if (target.id === requester.id || target.role === EUserRole.SUPERADMIN) {
    throw forbidden("El acceso del superadmin no se cambia desde la app.");
  }
};

type TDb = ReturnType<typeof createDb>;
type TUserRow = typeof users.$inferSelect;

const toUserResource = (row: TUserRow, email: string | null): IUserResource => ({
  id: row.id,
  firstName: row.firstName,
  paternalLastName: row.paternalLastName,
  maternalLastName: row.maternalLastName,
  neighborhood: neighborhoodOf(row.neighborhoodId),
  phone: toPhoneResource(row),
  whatsappUsername: row.whatsappUsername,
  note: row.note,
  role: row.role,
  email,
  createdAt: row.createdAt.toISOString(),
});

/* La persona con el correo de su login, si tiene. */
const findUser = async (db: TDb, id: string) => {
  const row = await db
    .select({ user: users, email: authUsers.email })
    .from(users)
    .leftJoin(authUsers, eq(authUsers.userId, users.id))
    .where(eq(users.id, id))
    .get();
  if (!row) {
    throw notFound(USER_NOT_FOUND);
  }
  return row;
};

const toMatchResource = (row: TUserRow): IPersonMatchResource => ({
  id: row.id,
  firstName: row.firstName,
  paternalLastName: row.paternalLastName,
  maternalLastName: row.maternalLastName,
});

const collapseSpaces = (value: string | undefined) => (value ?? "").trim().replace(/\s+/g, " ");

/* Quién ya tiene ese DNI: a lo sumo uno. */
const matchesByDocument = async (db: TDb, documentNumber: string, exceptId?: string) => {
  const row = await findUserByDocument(db, documentNumber);
  return row && row.user.id !== exceptId ? [toMatchResource(row.user)] : [];
};

/* Quiénes tienen los mismos nombres, apellido paterno y fecha de nacimiento (sin importar mayúsculas). */
const matchesByNameAndBirthDate = async (
  db: TDb,
  person: { firstName: string; paternalLastName: string; birthDate: string },
  exceptId?: string,
) => {
  const rows = await db
    .select({ user: users })
    .from(userProfiles)
    .innerJoin(users, eq(users.id, userProfiles.userId))
    .where(
      and(
        eq(userProfiles.birthDate, person.birthDate),
        sql`lower(${users.firstName}) = ${person.firstName.toLowerCase()}`,
        sql`lower(${users.paternalLastName}) = ${person.paternalLastName.toLowerCase()}`,
      ),
    )
    .limit(MAX_MATCHES + 1);
  return rows
    .filter((row) => row.user.id !== exceptId)
    .slice(0, MAX_MATCHES)
    .map((row) => toMatchResource(row.user));
};

/**
 * Usuarios: todas las personas de Juveco. Los administradores los registran y los editan;
 * solo el superadmin da acceso a la app (y así alguien pasa a ser administrador).
 */
export const userRoutes = new Hono<TAppEnv>()
  .get(USER_ROUTES.USERS, requireAuth, async (context) => {
    const rows = await createDb()
      .select({ user: users, email: authUsers.email })
      .from(users)
      .leftJoin(authUsers, eq(authUsers.userId, users.id))
      .orderBy(asc(sql`lower(${users.firstName})`));
    return ok(
      context,
      rows.map((row) => toUserResource(row.user, row.email)),
    );
  })

  /*
    Duplicados en el servidor: por `documentNumber`, o por `firstName` + `paternalLastName` +
    `birthDate`. `exceptId` excluye a la persona que se está editando.
  */
  .get(USER_ROUTES.MATCHES, requireAuth, async (context) => {
    const db = createDb();
    const query = context.req.query();
    const exceptId = query.exceptId || undefined;

    const documentNumber = collapseSpaces(query.documentNumber);
    if (documentNumber) {
      if (!isValidDocumentNumber(documentNumber)) {
        throw badRequest(DOCUMENT_NUMBER_INVALID_MESSAGE);
      }
      return ok(context, await matchesByDocument(db, documentNumber, exceptId));
    }

    const firstName = collapseSpaces(query.firstName);
    const paternalLastName = collapseSpaces(query.paternalLastName);
    const birthDate = collapseSpaces(query.birthDate);
    if (!firstName || !paternalLastName || !isIsoDate(birthDate)) {
      throw badRequest(MATCHES_QUERY_MESSAGE);
    }
    return ok(context, await matchesByNameAndBirthDate(db, { firstName, paternalLastName, birthDate }, exceptId));
  })

  .get(USER_ROUTES.USER, requireAuth, async (context) => {
    const db = createDb();
    const id = context.req.param("id");
    const row = await findUser(db, id);
    const resource: IUserDetailResource = {
      ...toUserResource(row.user, row.email),
      details: await loadUserProfile(db, id),
    };
    return ok(context, resource);
  })

  .post(USER_ROUTES.USERS, requireAuth, validateJson(createUserSchema), async (context) => {
    const { access, ...body } = context.req.valid("json");
    const db = createDb();

    if (access && context.var.user.role !== EUserRole.SUPERADMIN) {
      throw forbidden("Solo el superadmin puede dar acceso a la app.");
    }
    if (access) {
      await assertEmailAvailable(db, access.email);
    }
    const created = await createPersonRecord(db, body);

    if (!access) {
      return ok(context, toUserResource(created, null), 201);
    }

    /* Sin login la persona no debe quedar a medias: si falla, se deshace el alta. */
    try {
      const withAccess = await grantLogin({ db, auth: context.var.auth, person: created, access });
      return ok(context, toUserResource(withAccess, access.email), 201);
    } catch (error) {
      await db.delete(users).where(eq(users.id, created.id));
      throw error;
    }
  })

  .patch(USER_ROUTES.USER, requireAuth, validateJson(updateUserSchema), async (context) => {
    const id = context.req.param("id");
    const { access, ...body } = context.req.valid("json");
    const db = createDb();

    const current = await findUser(db, id);
    if (access !== undefined) {
      assertCanEditAccess(context.var.user, current.user);
    }
    if (access && !current.email && !access.password) {
      throw badRequest("Ingresa la contraseña para darle acceso.");
    }
    if (access) {
      await assertEmailAvailable(db, access.email, id);
    }

    const person = await updatePersonRecord(db, current.user, body);

    if (access === undefined) {
      return ok(context, toUserResource(person, current.email));
    }
    if (access === null) {
      return ok(context, toUserResource(await revokeLogin(db, id), null));
    }
    if (!current.email) {
      const withAccess = await grantLogin({
        db,
        auth: context.var.auth,
        person,
        access: { role: EUserRole.ADMIN, email: access.email, password: access.password! },
      });
      return ok(context, toUserResource(withAccess, access.email));
    }
    await updateLogin({ db, auth: context.var.auth, personId: id, email: access.email, password: access.password });
    return ok(context, toUserResource(person, access.email));
  })

  /* Quien entra a la app no se borra desde acá: primero habría que quitarle el acceso. */
  .delete(USER_ROUTES.USER, requireAuth, async (context) => {
    const id = context.req.param("id");
    const db = createDb();

    const current = await findUser(db, id);
    if (current.user.role !== EUserRole.USER) {
      throw forbidden("No se puede eliminar a un administrador.");
    }
    /* Sin esto, la llave foránea de lo vendido responde un 500 sin explicación. */
    const boughtItem = await db
      .select({ id: activityItems.id })
      .from(activityItems)
      .where(eq(activityItems.buyerId, id))
      .get();
    if (boughtItem) {
      throw conflict(`«${fullName(current.user)}» compró en una actividad: primero cambia el comprador o elimina esa venta.`);
    }
    const donatedPrize = await db
      .select({ id: activityPrizes.id })
      .from(activityPrizes)
      .where(eq(activityPrizes.donorId, id))
      .get();
    if (donatedPrize) {
      throw conflict(`«${fullName(current.user)}» donó un premio: primero cambia el donante o elimina ese premio.`);
    }
    const familyMember = await db
      .select({ id: familyMembers.id })
      .from(familyMembers)
      .where(eq(familyMembers.userId, id))
      .get();
    if (familyMember) {
      throw conflict(`«${fullName(current.user)}» integra una familia del padrón: primero quítala de su familia.`);
    }
    await db.delete(users).where(eq(users.id, id));

    return ok(context, { id });
  })

  /**
   * Da acceso a la app: crea su login (correo + contraseña) y lo pasa a ADMIN. Solo el
   * superadmin, y solo a quien todavía no tiene acceso.
   */
  .post(
    USER_ROUTES.USER_ACCESS,
    requireSuperadmin,
    validateJson(grantAccessSchema),
    async (context) => {
      const id = context.req.param("id");
      const { email, password } = context.req.valid("json");
      const db = createDb();

      const current = await findUser(db, id);
      if (current.email) {
        throw conflict(`«${fullName(current.user)}» ya tiene acceso.`);
      }
      await assertEmailAvailable(db, email);

      const updated = await grantLogin({
        db,
        auth: context.var.auth,
        person: current.user,
        access: { role: EUserRole.ADMIN, email, password },
      });

      return ok(context, toUserResource(updated, email));
    },
  );
