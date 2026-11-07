/**
 * Fechas **sin hora** («2026-10-22»), en hora de Perú (acordado 2026-10-13). Se guardan y
 * viajan como texto ISO, y se calcula sobre UTC para que el huso del equipo no corra un día.
 * Lo usan el front y el server.
 */

export const BUSINESS_TIME_ZONE = "America/Lima";

const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

const toUtc = (iso: string): Date => {
  const [, year, month, day] = ISO_DATE_PATTERN.exec(iso) ?? [];
  return new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
};

const toIso = (date: Date): string => date.toISOString().slice(0, 10);

/** Si es una fecha «AAAA-MM-DD» que existe (no «2026-02-30»). */
export const isIsoDate = (value: string): boolean =>
  ISO_DATE_PATTERN.test(value) && toIso(toUtc(value)) === value;

/** Hoy en Perú, aunque el equipo o el Worker estén en otro huso. */
export const todayInLima = (now: Date = new Date()): string =>
  /* `en-CA` escribe la fecha como «2026-10-22». */
  new Intl.DateTimeFormat("en-CA", { timeZone: BUSINESS_TIME_ZONE }).format(now);

/**
 * Suma meses. Si el día no existe en el mes de llegada, queda en el último: 31 ene + 1 mes
 * = 28 feb (o 29), no 3 de marzo.
 */
export const addMonths = (iso: string, months: number): string => {
  const date = toUtc(iso);
  const target = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1));
  const lastDay = new Date(
    Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0),
  ).getUTCDate();
  target.setUTCDate(Math.min(date.getUTCDate(), lastDay));
  return toIso(target);
};

/** Días de `from` a `to`: negativo si `to` ya pasó. */
export const daysBetween = (from: string, to: string): number =>
  Math.round((toUtc(to).getTime() - toUtc(from).getTime()) / MS_PER_DAY);
