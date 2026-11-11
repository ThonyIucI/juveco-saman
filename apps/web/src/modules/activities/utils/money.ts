import { formatSoles } from "@juveco/shared/money";

/**
 * Montos que pueden quedar en negativo (la ganancia): con «−» delante y no «S/ -20.00». Al
 * inicio, con premios ya comprados, es lo normal, así que va sin rojo (Thony, 2026-11-11).
 */
export const formatSignedSoles = (value: number): string =>
  value < 0 ? `− ${formatSoles(Math.abs(value))}` : formatSoles(value);
