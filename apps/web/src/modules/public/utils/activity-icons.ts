import { EActivityType, type TActivityType } from "@juveco/shared/activities";
import type { LucideIcon } from "lucide-react";
import { Ticket, Trophy } from "lucide-react";

/** El ícono de cada tipo de actividad: trofeo para el campeonato, ticket para el bingo. */
export const ACTIVITY_ICONS: Record<TActivityType, LucideIcon> = {
  [EActivityType.BINGO]: Ticket,
  [EActivityType.CHAMPIONSHIP]: Trophy,
};
