import type { createDb } from "@juveco/db";
import { userConditions, userProfiles } from "@juveco/db/schema/user-profiles";
import { users } from "@juveco/db/schema/users";
import { EMPTY_USER_PROFILE, type IUserProfile } from "@juveco/shared/user-profiles";
import { asc, eq } from "drizzle-orm";

import type { TUserProfileBody } from "./user-profile-input";

type TDb = ReturnType<typeof createDb>;

/** Los datos del censo de una persona; vacíos si nunca se le cargó nada. */
export const loadUserProfile = async (db: TDb, userId: string): Promise<IUserProfile> => {
  const row = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId)).get();
  const conditionRows = await db
    .select({ condition: userConditions.condition })
    .from(userConditions)
    .where(eq(userConditions.userId, userId))
    .orderBy(asc(userConditions.condition));

  return {
    ...EMPTY_USER_PROFILE,
    documentNumber: row?.documentNumber ?? null,
    birthDate: row?.birthDate ?? null,
    gender: row?.gender ?? null,
    conditionNote: row?.conditionNote ?? null,
    conditions: conditionRows.map((conditionRow) => conditionRow.condition),
  };
};

/**
 * Reemplaza los datos del censo de la persona por los recibidos, en un solo `batch`. Sin
 * ningún dato en la fila, no se deja una fila vacía.
 */
export const saveUserProfile = async (db: TDb, userId: string, details: TUserProfileBody) => {
  const columns = {
    documentNumber: details.documentNumber,
    birthDate: details.birthDate,
    gender: details.gender,
    conditionNote: details.conditionNote,
  };
  const hasColumnsData = Object.values(columns).some((value) => value !== null);

  const writeRow = hasColumnsData
    ? db
        .insert(userProfiles)
        .values({ userId, ...columns })
        .onConflictDoUpdate({ target: userProfiles.userId, set: { ...columns, updatedAt: new Date() } })
    : db.delete(userProfiles).where(eq(userProfiles.userId, userId));
  const clearConditions = db.delete(userConditions).where(eq(userConditions.userId, userId));

  if (details.conditions.length === 0) {
    await db.batch([writeRow, clearConditions]);
    return;
  }
  const conditionRows = details.conditions.map((condition) => ({ userId, condition }));
  await db.batch([writeRow, clearConditions, db.insert(userConditions).values(conditionRows)]);
};

/** Quién tiene ese DNI, si alguien. */
export const findUserByDocument = (db: TDb, documentNumber: string) =>
  db
    .select({ user: users })
    .from(userProfiles)
    .innerJoin(users, eq(users.id, userProfiles.userId))
    .where(eq(userProfiles.documentNumber, documentNumber))
    .get();
