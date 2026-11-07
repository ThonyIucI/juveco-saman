import { type CountryCode, getCountries, getCountryCallingCode } from "libphonenumber-js";

export interface ICountryOption {
  /** El ISO («PE»): con el prefijo solo no alcanza, +1 son varios países. */
  value: CountryCode;
  label: string;
  /** Prefijo sin «+»: «51». */
  prefix: string;
}

const regionNames = new Intl.DisplayNames(["es"], { type: "region" });

/** Todos los países, con su nombre en español y en orden alfabético. */
export const COUNTRY_OPTIONS: readonly ICountryOption[] = getCountries()
  .map((country) => ({
    value: country,
    label: regionNames.of(country) ?? country,
    prefix: getCountryCallingCode(country),
  }))
  .sort((a, b) => a.label.localeCompare(b.label, "es"));

const normalize = (text: string) =>
  text.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

/** Busca por nombre (sin tildes: «peru» encuentra «Perú»), por ISO o por prefijo («+51»). */
export const matchesCountry = (option: ICountryOption, search: string): boolean => {
  const term = normalize(search.trim()).replace(/^\+/, "");
  return (
    !term ||
    normalize(option.label).includes(term) ||
    option.value.toLowerCase() === term ||
    option.prefix.startsWith(term)
  );
};
