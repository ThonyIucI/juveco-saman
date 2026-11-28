import type { createDb } from "@juveco/db";
import { dwellings } from "@juveco/db/schema/dwellings";
import { families, familyMembers } from "@juveco/db/schema/families";
import { userConditions, userProfiles } from "@juveco/db/schema/user-profiles";
import { users } from "@juveco/db/schema/users";
import { ageOn, todayInLima } from "@juveco/shared/dates";
import {
  type IDwellingDetailResource,
  type IDwellingResource,
  formatDwellingCode,
} from "@juveco/shared/dwellings";
import {
  EFamilyRelationship,
  type IFamilyContact,
  type IFamilyMemberResource,
  type IFamilyResource,
} from "@juveco/shared/families";
import { type INeighborhood, neighborhoodOf } from "@juveco/shared/neighborhoods";
import { fullName } from "@juveco/shared/people";
import type { EUserCondition } from "@juveco/shared/user-profiles";
import { eq } from "drizzle-orm";

import { notFound } from "./errors";
import { toPhoneResource } from "./phone-input";

type TDb = ReturnType<typeof createDb>;
type TDwellingRow = typeof dwellings.$inferSelect;
type TFamilyRow = typeof families.$inferSelect;
type TUserRow = typeof users.$inferSelect;

const groupBy = <TItem>(items: TItem[], keyOf: (item: TItem) => string): Map<string, TItem[]> => {
  const groups = new Map<string, TItem[]>();
  for (const item of items) {
    const key = keyOf(item);
    groups.set(key, [...(groups.get(key) ?? []), item]);
  }
  return groups;
};

export const DWELLING_NOT_FOUND = "No encontramos esa vivienda.";

/* Los barrios son fijos y la llave foránea lo garantiza: un ID desconocido es un error nuestro. */
const neighborhoodOfDwelling = (row: TDwellingRow): INeighborhood => {
  const neighborhood = neighborhoodOf(row.neighborhoodId);
  if (!neighborhood) {
    throw new Error(`Barrio desconocido en la vivienda ${row.id}.`);
  }
  return neighborhood;
};

export const dwellingCodeOf = (row: TDwellingRow): string =>
  formatDwellingCode(neighborhoodOfDwelling(row).prefix, row.localSequence);

interface IMemberRow {
  dwellingId: string;
  family: TFamilyRow;
  memberId: string;
  relationship: EFamilyRelationship;
  user: TUserRow;
  birthDate: string | null;
}

/* Todos los integrantes (de una vivienda, o de todas si no se pasa `dwellingId`). */
const selectMemberRows = async (db: TDb, dwellingId?: string): Promise<IMemberRow[]> => {
  const query = db
    .select({
      family: families,
      memberId: familyMembers.id,
      relationship: familyMembers.relationship,
      user: users,
      birthDate: userProfiles.birthDate,
    })
    .from(familyMembers)
    .innerJoin(families, eq(families.id, familyMembers.familyId))
    .innerJoin(users, eq(users.id, familyMembers.userId))
    .leftJoin(userProfiles, eq(userProfiles.userId, users.id));
  const rows = await (dwellingId ? query.where(eq(families.dwellingId, dwellingId)) : query);
  return rows.map((row) => ({ ...row, dwellingId: row.family.dwellingId }));
};

/* El jefe primero; luego por nombre. */
const compareMembers = (first: IMemberRow, second: IMemberRow): number => {
  const isFirstHead = first.relationship === EFamilyRelationship.HEAD;
  const isSecondHead = second.relationship === EFamilyRelationship.HEAD;
  if (isFirstHead !== isSecondHead) {
    return isFirstHead ? -1 : 1;
  }
  return fullName(first.user).localeCompare(fullName(second.user), "es");
};

const loadConditions = async (db: TDb, dwellingId: string): Promise<Map<string, EUserCondition[]>> => {
  const rows = await db
    .select({ userId: userConditions.userId, condition: userConditions.condition })
    .from(userConditions)
    .innerJoin(familyMembers, eq(familyMembers.userId, userConditions.userId))
    .innerJoin(families, eq(families.id, familyMembers.familyId))
    .where(eq(families.dwellingId, dwellingId));
  const byUser = new Map<string, EUserCondition[]>();
  for (const { userId, condition } of rows) {
    byUser.set(userId, [...(byUser.get(userId) ?? []), condition]);
  }
  return byUser;
};

const toContact = (family: TFamilyRow): IFamilyContact | null => {
  const phone = toPhoneResource({ countryPrefix: family.contactCountryPrefix, phone: family.contactPhone });
  return family.contactName && phone ? { name: family.contactName, phone } : null;
};

const toMemberResource = (
  row: IMemberRow,
  conditions: Map<string, EUserCondition[]>,
  today: string,
): IFamilyMemberResource => ({
  id: row.memberId,
  userId: row.user.id,
  firstName: row.user.firstName,
  paternalLastName: row.user.paternalLastName,
  maternalLastName: row.user.maternalLastName,
  relationship: row.relationship,
  neighborhood: neighborhoodOf(row.user.neighborhoodId),
  phone: toPhoneResource(row.user),
  birthDate: row.birthDate,
  age: row.birthDate ? ageOn(row.birthDate, today) : null,
  conditions: [...(conditions.get(row.user.id) ?? [])].sort(),
});

/** Lo que dice la lista de una vivienda, sacado de sus familias. */
interface IDwellingSummary {
  familyCount: number;
  memberCount: number;
  headNames: string[];
}

const summarize = (rows: IMemberRow[]): IDwellingSummary => ({
  familyCount: new Set(rows.map((row) => row.family.id)).size,
  memberCount: rows.length,
  headNames: rows
    .filter((row) => row.relationship === EFamilyRelationship.HEAD)
    .map((row) => fullName(row.user))
    .sort((first, second) => first.localeCompare(second, "es")),
});

const toDwellingResource = (row: TDwellingRow, summary: IDwellingSummary): IDwellingResource => ({
  id: row.id,
  code: dwellingCodeOf(row),
  neighborhood: neighborhoodOfDwelling(row),
  meterNumber: row.meterNumber,
  latitude: row.latitude,
  longitude: row.longitude,
  mapsUrl: row.mapsUrl,
  status: row.status,
  wallMaterial: row.wallMaterial,
  photosUrl: row.photosUrl,
  observation: row.observation,
  note: row.note,
  createdAt: row.createdAt.toISOString(),
  ...summary,
});

export const findDwellingRow = async (db: TDb, id: string): Promise<TDwellingRow> => {
  const row = await db.select().from(dwellings).where(eq(dwellings.id, id)).get();
  if (!row) {
    throw notFound(DWELLING_NOT_FOUND);
  }
  return row;
};

/** Todas las viviendas con su resumen (familias, personas, jefes), de la más nueva a la más vieja. */
export const listDwellings = async (db: TDb): Promise<IDwellingResource[]> => {
  const [rows, memberRows] = await Promise.all([
    db.select().from(dwellings),
    selectMemberRows(db),
  ]);
  const membersByDwelling = groupBy(memberRows, (row) => row.dwellingId);
  return rows
    .map((row) => toDwellingResource(row, summarize(membersByDwelling.get(row.id) ?? [])))
    .sort((first, second) => second.createdAt.localeCompare(first.createdAt));
};

/** Una vivienda con sus familias; cada familia con el jefe primero. */
export const findDwellingDetail = async (db: TDb, id: string): Promise<IDwellingDetailResource> => {
  const row = await findDwellingRow(db, id);
  const [familyRows, memberRows, conditions] = await Promise.all([
    db.select().from(families).where(eq(families.dwellingId, id)).orderBy(families.createdAt),
    selectMemberRows(db, id),
    loadConditions(db, id),
  ]);
  const today = todayInLima();
  const membersByFamily = groupBy(memberRows, (member) => member.family.id);

  const familyResources: IFamilyResource[] = familyRows.map((family) => ({
    id: family.id,
    dwellingId: family.dwellingId,
    contact: toContact(family),
    note: family.note,
    members: (membersByFamily.get(family.id) ?? [])
      .sort(compareMembers)
      .map((member) => toMemberResource(member, conditions, today)),
  }));

  return { ...toDwellingResource(row, summarize(memberRows)), families: familyResources };
};
