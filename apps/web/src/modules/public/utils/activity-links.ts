import { EActivityType, type TActivityType } from "@juveco/shared/activities";
import type { IPublicActivity } from "@juveco/shared/public";

import { formatLongDate } from "@/common/utils/format-date";
import { CHAMPIONSHIP_NAME, MATCH_DAYS } from "@/modules/public/data/relampago-2026";
import { daysUntil } from "@/modules/public/utils/event-dates";

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
const activityDateListOf = (activity: IPublicActivity): string[] =>
  hasPublishedResults(activity) ? MATCH_DAYS.map((day) => day.date) : [activity.eventDate];

export const activityDatesOf = (activity: IPublicActivity): string =>
  activityDateListOf(activity).map(formatLongDate).join(" y ");

/** La primera fecha, para ordenar las actividades. */
export const activityFirstDateOf = (activity: IPublicActivity): string =>
  activityDateListOf(activity)[0] ?? activity.eventDate;

/** La próxima fecha que aún no pasa (hoy cuenta); `null` si ya se jugó todo. */
export const activityNextDateOf = (activity: IPublicActivity): string | null =>
  activityDateListOf(activity).find((date) => daysUntil(date) >= 0) ?? null;

/** La fecha que se muestra: la próxima o, si ya pasaron todas, la última. */
export const activityShownDateOf = (activity: IPublicActivity): string => {
  const dates = activityDateListOf(activity);
  return activityNextDateOf(activity) ?? dates[dates.length - 1] ?? activity.eventDate;
};

/** La actividad cuya próxima fecha está más cerca; `null` si ninguna tiene fecha por venir. */
export const nextActivityOf = (activities: IPublicActivity[]): { activity: IPublicActivity; date: string } | null => {
  const upcoming = activities.flatMap((activity) => {
    const date = activityNextDateOf(activity);
    return date ? [{ activity, date }] : [];
  });
  return [...upcoming].sort((first, second) => first.date.localeCompare(second.date))[0] ?? null;
};
