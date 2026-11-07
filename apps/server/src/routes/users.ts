import { createDb } from "@juveco/db";
import { authUsers } from "@juveco/db/schema/auth";
import { users } from "@juveco/db/schema/users";
import { neighborhoodOf } from "@juveco/shared/neighborhoods";
import { fullName } from "@juveco/shared/people";
import { EUserRole } from "@juveco/shared/roles";
import { USER_MIN_PASSWORD_LENGTH, type IUserResource } from "@juveco/shared/users";
import { and, asc, eq, sql } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";

import type { TAppEnv } from "../lib/app-env";
import { conflict, forbidden, notFound } from "../lib/errors";
import { newId } from "../lib/ids";
import { assertPhoneAvailable, assertUsernameAvailable } from "../lib/person-guards";
import { firstNameSchema, personExtraFields } from "../lib/person-input";
import { type TPhoneInput, toPhoneColumns, toPhoneResource } from "../lib/phone-input";
import { ok } from "../lib/response";
import { validateJson } from "../lib/validator";
import { requireAuth, requireSuperadmin } from "../middleware/require-role";

export const USER_ROUTES = {
  USERS: "/users",
  USER: "/users/:id",
  USER_ACCESS: "/users/:id/access",
} as const;

const USER_NOT_FOUND = "No encontramos ese usuario.";
const NO_CHANGES_MESSAGE = "No hay cambios para guardar.";

const createUserSchema = z.object({ firstName: firstNameSchema, ...personExtraFields });

const updateUserSchema = z
  .object({ firstName: firstNameSchema.optional(), ...personExtraFields })
  .refine((body) => Object.values(body).some((value) => value !== undefined), {
    message: NO_CHANGES_MESSAGE,
  });

const grantAccessSchema = z.object({
  email: z.email("Correo inválido.").transform((email) => email.toLowerCase()),
  password: z
    .string()
    .min(USER_MIN_PASSWORD_LENGTH, "La contraseña debe tener al menos 8 caracteres."),
});

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
    const body = context.req.valid("json");
    const phone = body.phone ?? null;
    const whatsappUsername = body.whatsappUsername ?? null;
    const db = createDb();

    await assertPhoneAvailable({ phone, findByPhone: findByPhone(db) });
    await assertUsernameAvailable({ username: whatsappUsername, findByUsername: findByUsername(db) });

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

    return ok(context, toUserResource(created!, null), 201);
  })

  .patch(USER_ROUTES.USER, requireAuth, validateJson(updateUserSchema), async (context) => {
    const id = context.req.param("id");
    const body = context.req.valid("json");
    const db = createDb();

    const current = await findUser(db, id);
    await assertPhoneAvailable({ phone: body.phone, findByPhone: findByPhone(db), exceptId: id });
    await assertUsernameAvailable({
      username: body.whatsappUsername,
      findByUsername: findByUsername(db),
      exceptId: id,
    });

    const [updated] = await db
      .update(users)
      .set({
        ...(body.firstName !== undefined && { firstName: body.firstName }),
        ...(body.lastName !== undefined && { lastName: body.lastName }),
        ...(body.neighborhoodId !== undefined && { neighborhoodId: body.neighborhoodId }),
        ...(body.phone !== undefined && toPhoneColumns(body.phone)),
        ...(body.whatsappUsername !== undefined && { whatsappUsername: body.whatsappUsername }),
        ...(body.note !== undefined && { note: body.note }),
      })
      .where(eq(users.id, id))
      .returning();

    return ok(context, toUserResource(updated!, current.email));
  })

  /* Quien entra a la app no se borra desde acá: primero habría que quitarle el acceso. */
  .delete(USER_ROUTES.USER, requireAuth, async (context) => {
    const id = context.req.param("id");
    const db = createDb();

    const current = await findUser(db, id);
    if (current.user.role !== EUserRole.USER) {
      throw forbidden("No se puede eliminar a un administrador.");
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
      const takenEmail = await db
        .select({ id: authUsers.id })
        .from(authUsers)
        .where(eq(authUsers.email, email))
        .get();
      if (takenEmail) {
        throw conflict("Ya hay alguien que entra con ese correo.");
      }

      const { user: login } = await context.var.auth.api.signUpEmail({
        body: { name: fullName(current.user), email, password },
      });
      const [, [updated]] = await db.batch([
        db.update(authUsers).set({ userId: id }).where(eq(authUsers.id, login.id)),
        db.update(users).set({ role: EUserRole.ADMIN }).where(eq(users.id, id)).returning(),
      ]);

      return ok(context, toUserResource(updated!, email));
    },
  );
