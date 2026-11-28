import type { createDb } from "@juveco/db";
import { users } from "@juveco/db/schema/users";
import { fullName } from "@juveco/shared/people";
import { and, eq, sql } from "drizzle-orm";

import { assertDocumentAvailable, assertPhoneAvailable, assertUsernameAvailable } from "./person-guards";
import type { TPersonBody } from "./person-input";
import { type TPhoneInput, toPhoneColumns } from "./phone-input";
import { newId } from "./ids";
import { findUserByDocument, saveUserProfile } from "./user-profiles";

/**
 * Alta y edición de una persona (usuario + datos del censo) con sus guardias de teléfono,
 * usuario de WhatsApp y DNI. Las usa Usuarios y el registro de integrantes de una vivienda:
 * una sola lógica, sin copias.
 */

type TDb = ReturnType<typeof createDb>;
export type TUserRow = typeof users.$inferSelect;

const toMatch = (row: TUserRow | undefined) => (row ? { id: row.id, label: fullName(row) } : undefined);

export const findByPhone = (db: TDb) => async (phone: NonNullable<TPhoneInput>) => {
  const row = await db
    .select()
    .from(users)
    .where(and(eq(users.countryPrefix, phone.countryPrefix), eq(users.phone, phone.number)))
    .get();
  return toMatch(row);
};

export const findByDocument = (db: TDb) => async (documentNumber: string) => {
  const row = await findUserByDocument(db, documentNumber);
  return toMatch(row?.user);
};

/* Con la misma expresión del índice único. */
export const findByUsername = (db: TDb) => async (usernameLower: string) => {
  const row = await db
    .select()
    .from(users)
    .where(sql`lower(${users.whatsappUsername}) = ${usernameLower}`)
    .get();
  return toMatch(row);
};

const assertPersonAvailable = async (db: TDb, body: Partial<TPersonBody>, exceptId?: string) => {
  await assertPhoneAvailable({ phone: body.phone, findByPhone: findByPhone(db), exceptId });
  await assertUsernameAvailable({
    username: body.whatsappUsername,
    findByUsername: findByUsername(db),
    exceptId,
  });
  await assertDocumentAvailable({
    documentNumber: body.details?.documentNumber,
    findByDocument: findByDocument(db),
    exceptId,
  });
};

/**
 * Crea la persona. Sin sus datos del censo no debe quedar a medias: si fallan, se deshace el alta.
 */
export const createPersonRecord = async (db: TDb, body: TPersonBody): Promise<TUserRow> => {
  await assertPersonAvailable(db, body);

  const [created] = await db
    .insert(users)
    .values({
      id: newId(),
      firstName: body.firstName,
      paternalLastName: body.paternalLastName ?? null,
      maternalLastName: body.maternalLastName ?? null,
      neighborhoodId: body.neighborhoodId ?? null,
      ...toPhoneColumns(body.phone ?? null),
      whatsappUsername: body.whatsappUsername ?? null,
      note: body.note ?? null,
    })
    .returning();

  if (body.details) {
    try {
      await saveUserProfile(db, created!.id, body.details);
    } catch (error) {
      await db.delete(users).where(eq(users.id, created!.id));
      throw error;
    }
  }
  return created!;
};

/** Actualiza solo lo que llega (`undefined` no se toca); `details` reemplaza los datos del censo. */
export const updatePersonRecord = async (
  db: TDb,
  current: TUserRow,
  body: Partial<TPersonBody>,
): Promise<TUserRow> => {
  await assertPersonAvailable(db, body, current.id);

  const changes = {
    ...(body.firstName !== undefined && { firstName: body.firstName }),
    ...(body.paternalLastName !== undefined && { paternalLastName: body.paternalLastName }),
    ...(body.maternalLastName !== undefined && { maternalLastName: body.maternalLastName }),
    ...(body.neighborhoodId !== undefined && { neighborhoodId: body.neighborhoodId }),
    ...(body.phone !== undefined && toPhoneColumns(body.phone)),
    ...(body.whatsappUsername !== undefined && { whatsappUsername: body.whatsappUsername }),
    ...(body.note !== undefined && { note: body.note }),
  };
  /* Si solo cambió el acceso o el censo no hay nada que actualizar en la persona. */
  const [person] =
    Object.keys(changes).length > 0
      ? await db.update(users).set(changes).where(eq(users.id, current.id)).returning()
      : [current];
  if (body.details) {
    await saveUserProfile(db, current.id, body.details);
  }
  return person!;
};
