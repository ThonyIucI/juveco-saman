import type { IDwellingResource } from "@juveco/shared/dwellings";

const pluralize = (count: number, singular: string, plural: string) =>
  `${count} ${count === 1 ? singular : plural}`;

/** «2 familias · 7 personas». */
export const dwellingCountsLabel = (dwelling: Pick<IDwellingResource, "familyCount" | "memberCount">): string =>
  `${pluralize(dwelling.familyCount, "familia", "familias")} · ${pluralize(dwelling.memberCount, "persona", "personas")}`;

/** Los jefes en una línea; sin familias, un texto que lo dice. */
export const headNamesLabel = (dwelling: Pick<IDwellingResource, "headNames">): string =>
  dwelling.headNames.length > 0 ? dwelling.headNames.join(", ") : "Sin familias todavía";

/** «12 años», «1 año», «Menos de 1 año»; `null` si no se sabe. */
export const ageLabel = (age: number | null): string | null => {
  if (age === null) {
    return null;
  }
  return age < 1 ? "Menos de 1 año" : pluralize(age, "año", "años");
};
