import dayjs from "dayjs";
import "dayjs/locale/es";
import updateLocale from "dayjs/plugin/updateLocale";

/** Locale de toda la app. Se cambia acá y afecta a todas las fechas. */
export const APP_LOCALE = "es";

/**
 * El locale `es` de dayjs abrevia septiembre como «sept.» (cuatro letras y un punto),
 * que en una tarjeta angosta empuja la fecha a dos líneas. Se reemplazan las
 * abreviaturas por las de tres letras, sin punto.
 */
const MONTHS_SHORT = [
  "ene",
  "feb",
  "mar",
  "abr",
  "may",
  "jun",
  "jul",
  "ago",
  "sep",
  "oct",
  "nov",
  "dic",
];

/** Mismo motivo: el locale trae «sáb.» con punto y acá se usa pegado a la fecha. */
const WEEKDAYS_SHORT = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];

dayjs.extend(updateLocale);
dayjs.locale(APP_LOCALE);
dayjs.updateLocale(APP_LOCALE, {
  monthsShort: MONTHS_SHORT,
  weekdaysShort: WEEKDAYS_SHORT,
});

/**
 * `"2026-09-12"` → `"12 sep 2026"`. Es la que va en las tarjetas: entra en una línea
 * aunque la pantalla sea de 320 px.
 */
export const formatShortDate = (date: string | Date): string =>
  dayjs(date).format("DD MMM YYYY");

/** `"2026-10-22"` → `"oct 2026"`. Para «Cliente desde oct 2026». */
export const formatMonthYear = (date: string | Date): string => dayjs(date).format("MMM YYYY");

/** Si la fecha es de este año: decide entre «06-sep» y «oct-2025». */
export const isCurrentYear = (date: string | Date): boolean => dayjs(date).year() === dayjs().year();

/**
 * La fecha más corta, para avisos dentro de una card (acordado 2026-10-22): de este año,
 * día y mes (`"2026-09-06"` → `"06-sep"`); de otro año, mes y año (`"oct-2025"`).
 */
export const formatCompactDate = (date: string | Date): string =>
  dayjs(date).format(isCurrentYear(date) ? "DD-MMM" : "MMM-YYYY");

/**
 * `"2026-11-04"` → `"04 nov"`; de otro año, con el año (`"04 ene 2027"`). Para rangos como
 * «Del 04 nov → 04 dic».
 */
export const formatDayMonth = (date: string | Date): string =>
  dayjs(date).format(isCurrentYear(date) ? "DD MMM" : "DD MMM YYYY");

/** `"2026-09-12"` → `"12 de septiembre de 2026"`. Para textos corridos, no para tarjetas. */
export const formatLongDate = (date: string | Date): string =>
  dayjs(date).format("DD [de] MMMM [de] YYYY");

/**
 * `"2026-10-10"` → `"sáb 10 oct"`. Para el calendario de clases, donde el día de la
 * semana importa tanto como la fecha: las clases son siempre el mismo día.
 */
export const formatWeekdayDate = (date: string | Date): string =>
  dayjs(date).format("ddd DD MMM");

/** Hoy como `YYYY-MM-DD`, para valores por defecto y `min`/`max` de los `<input type="date">`. */
export const todayIso = (): string => dayjs().format("YYYY-MM-DD");
