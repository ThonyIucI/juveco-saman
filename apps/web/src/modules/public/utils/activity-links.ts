import { EActivityType, type TActivityType } from "@juveco/shared/activities";
import type { IPublicActivity } from "@juveco/shared/public";

import { formatLongDate } from "@/common/utils/format-date";
import { CHAMPIONSHIP_NAME, MATCH_DAYS } from "@/modules/public/data/relampago-2026";

/* La palabra con la que empieza el nombre de cada tipo: no se repite en la dirección. */
const TYPE_PREFIX: Record<TActivityType, string> = {
  [EActivityType.BINGO]: "bingo",
  [EActivityType.CHAMPIONSHIP]: "campeonato",
};

const slugify = (text: string): string =>
  text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

/**
 * La parte propia de la dirección de una actividad, sacada de su nombre (sin migración):
 * «Campeonato Relámpago 2026» → `relampago-2026`; «Bingo II - 2026» → `ii-2026`.
 */
export const activitySlugOf = (activity: Pick<IPublicActivity, "name" | "type">): string => {
  const slug = slugify(activity.name);
  const prefix = `${TYPE_PREFIX[activity.type]}-`;
  return slug.startsWith(prefix) ? slug.slice(prefix.length) : slug;
};

export const findActivityBySlug = (
  activities: IPublicActivity[],
  type: TActivityType,
  slug: string,
): IPublicActivity | null =>
  activities.find((activity) => activity.type === type && activitySlugOf(activity) === slug) ?? null;

/* Solo el Relámpago 2026 tiene resultados y fechas en código (`data/relampago-2026.ts`). */
export const hasPublishedResults = (activity: Pick<IPublicActivity, "name" | "type">): boolean =>
  activity.type === EActivityType.CHAMPIONSHIP && activity.name === CHAMPIONSHIP_NAME;

/* El Relámpago se juega en dos fechas: salen de sus resultados, no de la actividad. */
export const activityDatesOf = (activity: IPublicActivity): string =>
  hasPublishedResults(activity)
    ? MATCH_DAYS.map((day) => formatLongDate(day.date)).join(" y ")
    : formatLongDate(activity.eventDate);

/** La primera fecha, para ordenar las actividades. */
export const activityFirstDateOf = (activity: IPublicActivity): string =>
  hasPublishedResults(activity) ? (MATCH_DAYS[0]?.date ?? activity.eventDate) : activity.eventDate;
