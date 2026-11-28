import type { createDb } from "@juveco/db";
import { dwellings } from "@juveco/db/schema/dwellings";
import { families, familyMembers } from "@juveco/db/schema/families";
import { users } from "@juveco/db/schema/users";
import {
  EFamilyRelationship,
  FAMILY_NOT_CHOSEN_MESSAGE,
  FORMER_HEAD_RELATIONSHIP,
  NEW_FAMILY,
  headChangeBlockedMessage,
  headRemoveBlockedMessage,
  personInOtherFamilyMessage,
} from "@juveco/shared/families";
import { fullName } from "@juveco/shared/people";
import { and, eq } from "drizzle-orm";
import type { BatchItem } from "drizzle-orm/batch";

import { dwellingCodeOf } from "./dwelling-resources";
import type { TCreateMemberBody, TUpdateMemberBody } from "./dwelling-input";
import { badRequest, conflict, notFound } from "./errors";
import { newId } from "./ids";
import { createPersonRecord, updatePersonRecord } from "./person-records";
import { toPhoneColumns } from "./phone-input";

/**
 * Integrantes de una vivienda. Una sola operación guarda a la persona (alta o edición, con la
 * lógica de Usuarios), su familia y su jefatura. Lo de la familia va en un `db.batch` (D1 lo
 * aplica entero o nada); si falla, la persona recién creada se deshace.
 */

type TDb = ReturnType<typeof createDb>;
type TDwellingRow = typeof dwellings.$inferSelect;
type TFamilyRow = typeof families.$inferSelect;
type TUserRow = typeof users.$inferSelect;
type TStatement = BatchItem<"sqlite">;

const FAMILY_NOT_FOUND = "No encontramos esa familia.";
const MEMBER_NOT_FOUND = "No encontramos a ese integrante.";
const PERSON_NOT_FOUND = "No encontramos a esa persona.";
/* El parentesco que más se repite, si no llega ninguno. */
const DEFAULT_RELATIONSHIP = EFamilyRelationship.CHILD;

const findUserRow = async (db: TDb, id: string): Promise<TUserRow> => {
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

const hasPhone = (user: { countryPrefix: string | null; phone: string | null }): boolean =>
  Boolean(user.countryPrefix && user.phone);

/*
  El contacto alternativo solo se guarda si el jefe no tiene teléfono: con teléfono, el jefe
  ya es el contacto y lo que llegue se ignora.
*/
const contactColumns = (contact: TCreateMemberBody["contact"], headHasPhone: boolean) => {
  const effective = headHasPhone ? null : contact;
  const phone = toPhoneColumns(effective?.phone ?? null);
  return {
    contactName: effective?.name ?? null,
    contactCountryPrefix: phone.countryPrefix,
    contactPhone: phone.phone,
  };
};

const runBatch = (db: TDb, statements: TStatement[]) => {
  const [first, ...rest] = statements;
  return db.batch([first!, ...rest]);
};

const findCurrentHead = (db: TDb, familyId: string) =>
  db
    .select()
    .from(familyMembers)
    .where(and(eq(familyMembers.familyId, familyId), eq(familyMembers.relationship, EFamilyRelationship.HEAD)))
    .get();

/** La familia donde cae la persona nueva; `null` si hay que crear una. */
const resolveTargetFamily = async (db: TDb, dwellingId: string, familyId: string | undefined) => {
  if (familyId === NEW_FAMILY) {
    return null;
  }
  const rows = await db.select().from(families).where(eq(families.dwellingId, dwellingId));
  if (familyId) {
    const found = rows.find((row) => row.id === familyId);
    if (!found) {
      throw notFound(FAMILY_NOT_FOUND);
    }
    return found;
  }
  if (rows.length === 0) {
    return null;
  }
  if (rows.length > 1) {
    throw badRequest(FAMILY_NOT_CHOSEN_MESSAGE);
  }
  return rows[0]!;
};

/** Agrega a una persona (existente o nueva) a la vivienda. */
export const addMember = async (db: TDb, dwelling: TDwellingRow, body: TCreateMemberBody): Promise<void> => {
  const family: TFamilyRow | null = await resolveTargetFamily(db, dwelling.id, body.familyId);

  const existing = body.userId ? await findUserRow(db, body.userId) : null;
  if (existing) {
    await assertPersonFree(db, existing.id);
  }
  const isCreated = existing === null;
  const person = existing
    ? body.person
      ? await updatePersonRecord(db, existing, body.person)
      : existing
    : await createPersonRecord(db, body.person!);

  /* En una familia nueva, el primero es el jefe. */
  const isHead = body.isHead || family === null;
  const familyId = family?.id ?? newId();
  const contact = contactColumns(body.contact, hasPhone(person));
  const statements: TStatement[] = [];

  if (!family) {
    statements.push(db.insert(families).values({ id: familyId, dwellingId: dwelling.id, ...contact }));
  } else if (isHead) {
    const head = await findCurrentHead(db, family.id);
    if (head) {
      statements.push(
        db.update(familyMembers).set({ relationship: FORMER_HEAD_RELATIONSHIP }).where(eq(familyMembers.id, head.id)),
      );
    }
    statements.push(db.update(families).set(contact).where(eq(families.id, family.id)));
  }
  statements.push(
    db.insert(familyMembers).values({
      id: newId(),
      familyId,
      userId: person.id,
      relationship: isHead ? EFamilyRelationship.HEAD : (body.relationship ?? DEFAULT_RELATIONSHIP),
    }),
  );

  try {
    await runBatch(db, statements);
  } catch (error) {
    /* Sin su familia la persona recién creada no debe quedar suelta. */
    if (isCreated) {
      await db.delete(users).where(eq(users.id, person.id));
    }
    throw error;
  }
};

const findMemberRow = async (db: TDb, dwellingId: string, memberId: string) => {
  const row = await db
    .select({ member: familyMembers, family: families, user: users })
    .from(familyMembers)
    .innerJoin(families, eq(families.id, familyMembers.familyId))
    .innerJoin(users, eq(users.id, familyMembers.userId))
    .where(and(eq(familyMembers.id, memberId), eq(families.dwellingId, dwellingId)))
    .get();
  if (!row) {
    throw notFound(MEMBER_NOT_FOUND);
  }
  return row;
};

/** Edita a la persona, su parentesco, si es jefe y el contacto de su familia. */
export const updateMember = async (
  db: TDb,
  dwelling: TDwellingRow,
  memberId: string,
  body: TUpdateMemberBody,
): Promise<void> => {
  const { member, family, user } = await findMemberRow(db, dwelling.id, memberId);
  const wasHead = member.relationship === EFamilyRelationship.HEAD;
  if (wasHead && !body.isHead) {
    throw badRequest(headChangeBlockedMessage(fullName(user)));
  }

  const person = body.person ? await updatePersonRecord(db, user, body.person) : user;
  const statements: TStatement[] = [];

  if (body.isHead) {
    if (!wasHead) {
      const head = await findCurrentHead(db, family.id);
      if (head) {
        statements.push(
          db.update(familyMembers).set({ relationship: FORMER_HEAD_RELATIONSHIP }).where(eq(familyMembers.id, head.id)),
        );
      }
      statements.push(
        db.update(familyMembers).set({ relationship: EFamilyRelationship.HEAD }).where(eq(familyMembers.id, member.id)),
      );
    }
    statements.push(
      db.update(families).set(contactColumns(body.contact, hasPhone(person))).where(eq(families.id, family.id)),
    );
  } else {
    statements.push(
      db
        .update(familyMembers)
        .set({ relationship: body.relationship ?? member.relationship })
        .where(eq(familyMembers.id, member.id)),
    );
  }

  await runBatch(db, statements);
};

/** Saca al integrante de su familia; si era el único, la familia se va con él. La persona nunca se borra. */
export const removeMember = async (db: TDb, dwelling: TDwellingRow, memberId: string): Promise<void> => {
  const { member, family, user } = await findMemberRow(db, dwelling.id, memberId);
  const siblings = await db.select({ id: familyMembers.id }).from(familyMembers).where(eq(familyMembers.familyId, family.id));

  if (siblings.length <= 1) {
    await runBatch(db, [
      db.delete(familyMembers).where(eq(familyMembers.id, member.id)),
      db.delete(families).where(eq(families.id, family.id)),
    ]);
    return;
  }
  if (member.relationship === EFamilyRelationship.HEAD) {
    throw conflict(headRemoveBlockedMessage(fullName(user)));
  }
  await db.delete(familyMembers).where(eq(familyMembers.id, member.id));
};
