import { createDb } from "@juveco/db";
import { authUsers } from "@juveco/db/schema/auth";
import { activityItems } from "@juveco/db/schema/activity-items";
import { activityPrizes } from "@juveco/db/schema/activity-prizes";
import { users } from "@juveco/db/schema/users";
import { neighborhoodOf } from "@juveco/shared/neighborhoods";
import { fullName } from "@juveco/shared/people";
import { EUserRole, type TUserRole } from "@juveco/shared/roles";
import type { IUserResource } from "@juveco/shared/users";
import { and, asc, eq, sql } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";

import type { TAppEnv } from "../lib/app-env";
import { badRequest, conflict, forbidden, notFound } from "../lib/errors";
import { newId } from "../lib/ids";
import { assertPhoneAvailable, assertUsernameAvailable } from "../lib/person-guards";
import { firstNameSchema, personExtraFields } from "../lib/person-input";
import { type TPhoneInput, toPhoneColumns, toPhoneResource } from "../lib/phone-input";
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
  USER: "/users/:id",
  USER_ACCESS: "/users/:id/access",
} as const;

const USER_NOT_FOUND = "No encontramos ese usuario.";
const NO_CHANGES_MESSAGE = "No hay cambios para guardar.";

/* `access` es opcional: con él, la persona se crea ya con su login (solo el superadmin). */
const createUserSchema = z.object({
  firstName: firstNameSchema,
  ...personExtraFields,
  access: grantAccessSchema.optional(),
});

/* `access` solo lo manda el superadmin: `null` quita el acceso; con correo lo da o lo cambia. */
const updateUserSchema = z
  .object({ firstName: firstNameSchema.optional(), ...personExtraFields, access: editAccessSchema })
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
  lastName: row.lastName,
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

const toMatch = (row: TUserRow | undefined) => (row ? { id: row.id, label: fullName(row) } : undefined);

const findByPhone = (db: TDb) => async (phone: NonNullable<TPhoneInput>) => {
  const row = await db
    .select()
    .from(users)
    .where(and(eq(users.countryPrefix, phone.countryPrefix), eq(users.phone, phone.number)))
    .get();
  return toMatch(row);
};

/* Con la misma expresión del índice único. */
const findByUsername = (db: TDb) => async (usernameLower: string) => {
  const row = await db
    .select()
    .from(users)
    .where(sql`lower(${users.whatsappUsername}) = ${usernameLower}`)
    .get();
  return toMatch(row);
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

  .get(USER_ROUTES.USER, requireAuth, async (context) => {
    const row = await findUser(createDb(), context.req.param("id"));
    return ok(context, toUserResource(row.user, row.email));
  })

  .post(USER_ROUTES.USERS, requireAuth, validateJson(createUserSchema), async (context) => {
    const { access, ...body } = context.req.valid("json");
    const phone = body.phone ?? null;
    const whatsappUsername = body.whatsappUsername ?? null;
    const db = createDb();

    if (access && context.var.user.role !== EUserRole.SUPERADMIN) {
      throw forbidden("Solo el superadmin puede dar acceso a la app.");
    }
    await assertPhoneAvailable({ phone, findByPhone: findByPhone(db) });
    await assertUsernameAvailable({ username: whatsappUsername, findByUsername: findByUsername(db) });
    if (access) {
      await assertEmailAvailable(db, access.email);
    }

    const [created] = await db
      .insert(users)
      .values({
        id: newId(),
        firstName: body.firstName,
        lastName: body.lastName ?? null,
        neighborhoodId: body.neighborhoodId ?? null,
        ...toPhoneColumns(phone),
        whatsappUsername,
        note: body.note ?? null,
      })
      .returning();

    if (!access) {
      return ok(context, toUserResource(created!, null), 201);
    }

    /* Sin login la persona no debe quedar a medias: si falla, se deshace el alta. */
    try {
      const withAccess = await grantLogin({ db, auth: context.var.auth, person: created!, access });
      return ok(context, toUserResource(withAccess, access.email), 201);
    } catch (error) {
      await db.delete(users).where(eq(users.id, created!.id));
      throw error;
    }
  })

  .patch(USER_ROUTES.USER, requireAuth, validateJson(updateUserSchema), async (context) => {
    const id = context.req.param("id");
    const { access, ...body } = context.req.valid("json");
    const db = createDb();

    const current = await findUser(db, id);
    await assertPhoneAvailable({ phone: body.phone, findByPhone: findByPhone(db), exceptId: id });
    await assertUsernameAvailable({
      username: body.whatsappUsername,
      findByUsername: findByUsername(db),
      exceptId: id,
    });
    if (access !== undefined) {
      assertCanEditAccess(context.var.user, current.user);
    }
    if (access && !current.email && !access.password) {
      throw badRequest("Ingresa la contraseña para darle acceso.");
    }
    if (access) {
      await assertEmailAvailable(db, access.email, id);
    }

    const personChanges = {
      ...(body.firstName !== undefined && { firstName: body.firstName }),
      ...(body.lastName !== undefined && { lastName: body.lastName }),
      ...(body.neighborhoodId !== undefined && { neighborhoodId: body.neighborhoodId }),
      ...(body.phone !== undefined && toPhoneColumns(body.phone)),
      ...(body.whatsappUsername !== undefined && { whatsappUsername: body.whatsappUsername }),
      ...(body.note !== undefined && { note: body.note }),
    };
    /* Si solo cambió el acceso no hay nada que actualizar en la persona. */
    const [person] =
      Object.keys(personChanges).length > 0
        ? await db.update(users).set(personChanges).where(eq(users.id, id)).returning()
        : [current.user];

    if (access === undefined) {
      return ok(context, toUserResource(person!, current.email));
    }
    if (access === null) {
      return ok(context, toUserResource(await revokeLogin(db, id), null));
    }
    if (!current.email) {
      const withAccess = await grantLogin({
        db,
        auth: context.var.auth,
        person: person!,
        access: { role: EUserRole.ADMIN, email: access.email, password: access.password! },
      });
      return ok(context, toUserResource(withAccess, access.email));
    }
    await updateLogin({ db, auth: context.var.auth, personId: id, email: access.email, password: access.password });
    return ok(context, toUserResource(person!, access.email));
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
