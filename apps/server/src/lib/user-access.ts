import type { TAuth } from "@juveco/auth";
import type { createDb } from "@juveco/db";
import { authAccounts, authSessions, authUsers } from "@juveco/db/schema/auth";
import { users } from "@juveco/db/schema/users";
import { fullName } from "@juveco/shared/people";
import { EUserRole } from "@juveco/shared/roles";
import { USER_MIN_PASSWORD_LENGTH } from "@juveco/shared/users";
import { and, eq, ne } from "drizzle-orm";
import { z } from "zod";

import { badRequest, conflict } from "./errors";

type TDb = ReturnType<typeof createDb>;
type TUserRow = typeof users.$inferSelect;

/* better-auth guarda la contraseña del login con correo en la cuenta «credential». */
const CREDENTIAL_PROVIDER = "credential";
const PASSWORD_LENGTH_MESSAGE = "La contraseña debe tener al menos 8 caracteres.";
const EMAIL_TAKEN_MESSAGE = "Ya hay alguien que entra con ese correo.";

const emailSchema = z.email("Correo inválido.").transform((email) => email.toLowerCase());
const passwordSchema = z.string().min(USER_MIN_PASSWORD_LENGTH, PASSWORD_LENGTH_MESSAGE);

export const grantAccessSchema = z.object({
  /* Solo se puede dar ADMIN: el superadmin no se asigna desde la app. */
  role: z.literal(EUserRole.ADMIN).default(EUserRole.ADMIN),
  email: emailSchema,
  password: passwordSchema,
});

export type TGrantAccess = z.infer<typeof grantAccessSchema>;

/**
 * Acceso al editar: `null` lo quita; con correo lo da o lo cambia. La contraseña es
 * obligatoria solo al darlo; si ya tenía acceso y llega vacía, no se cambia.
 */
export const editAccessSchema = z
  .object({ email: emailSchema, password: passwordSchema.optional() })
  .nullable()
  .optional();

export type TEditAccess = z.infer<typeof editAccessSchema>;

/** Falla si el correo ya es de otro login. `exceptUserId`: la persona que se edita. */
export const assertEmailAvailable = async (db: TDb, email: string, exceptUserId?: string) => {
  const taken = await db
    .select({ id: authUsers.id })
    .from(authUsers)
    .where(exceptUserId ? and(eq(authUsers.email, email), ne(authUsers.userId, exceptUserId)) : eq(authUsers.email, email))
    .get();
  if (taken) {
    throw conflict(EMAIL_TAKEN_MESSAGE);
  }
};

interface IGrantLoginParams {
  db: TDb;
  auth: TAuth;
  person: TUserRow;
  access: TGrantAccess;
}

/* Crea el login de la persona y la pasa a ADMIN; devuelve la persona ya actualizada. */
export const grantLogin = async ({ db, auth, person, access }: IGrantLoginParams): Promise<TUserRow> => {
  const { user: login } = await auth.api.signUpEmail({
    body: { name: fullName(person), email: access.email, password: access.password },
  });
  const [, [updated]] = await db.batch([
    db.update(authUsers).set({ userId: person.id }).where(eq(authUsers.id, login.id)),
    db.update(users).set({ role: access.role }).where(eq(users.id, person.id)).returning(),
  ]);
  return updated!;
};

interface IUpdateLoginParams {
  db: TDb;
  auth: TAuth;
  personId: string;
  email: string;
  password?: string;
}

/**
 * Cambia el correo y/o la contraseña del login de la persona. Con contraseña nueva se
 * cierran sus sesiones abiertas: tiene que volver a entrar con la nueva.
 */
export const updateLogin = async ({ db, auth, personId, email, password }: IUpdateLoginParams) => {
  const login = await db.select({ id: authUsers.id }).from(authUsers).where(eq(authUsers.userId, personId)).get();
  if (!login) {
    throw badRequest("Esa persona no tiene acceso.");
  }
  await db.update(authUsers).set({ email }).where(eq(authUsers.id, login.id));
  if (!password) {
    return;
  }
  const context = await auth.$context;
  const hashed = await context.password.hash(password);
  await db.batch([
    db
      .update(authAccounts)
      .set({ password: hashed })
      .where(and(eq(authAccounts.userId, login.id), eq(authAccounts.providerId, CREDENTIAL_PROVIDER))),
    db.delete(authSessions).where(eq(authSessions.userId, login.id)),
  ]);
};

/**
 * Quita el acceso: borra el login (sus sesiones y cuentas también) y la persona vuelve a
 * USER. Devuelve la persona actualizada. Entrar depende de tener login
 * (ver docs/tecnico/accesos.md).
 */
export const revokeLogin = async (db: TDb, personId: string): Promise<TUserRow> => {
  const login = await db.select({ id: authUsers.id }).from(authUsers).where(eq(authUsers.userId, personId)).get();
  const roleUpdate = db.update(users).set({ role: EUserRole.USER }).where(eq(users.id, personId)).returning();
  if (!login) {
    const [updated] = await roleUpdate;
    return updated!;
  }
  const [, , , [updated]] = await db.batch([
    db.delete(authSessions).where(eq(authSessions.userId, login.id)),
    db.delete(authAccounts).where(eq(authAccounts.userId, login.id)),
    db.delete(authUsers).where(eq(authUsers.id, login.id)),
    roleUpdate,
  ]);
  return updated!;
};
