import dayjs from "dayjs";

/** Días que faltan para una fecha «2026-11-28»: 0 es hoy, negativo ya pasó. */
export const daysUntil = (date: string): number => dayjs(date).startOf("day").diff(dayjs().startOf("day"), "day");

/** «Es hoy», «Es mañana», «Faltan 3 días». Solo para fechas que no pasaron. */
export const countdownLabelOf = (days: number): string => {
  if (days === 0) {
    return "Es hoy";
  }
  return days === 1 ? "Es mañana" : `Faltan ${days} días`;
};

/** «2026-11-28» → «sábado 28 de noviembre». */
export const formatWeekdayLong = (date: string): string => dayjs(date).format("dddd D [de] MMMM");
