import type { IActivityResource } from "@juveco/shared/activities";
import { formatSoles } from "@juveco/shared/money";
import { CalendarDays, Ticket } from "lucide-react";

import { formatShortDate } from "@/common/utils/format-date";

interface IActivityMetaProps {
  activity: Pick<IActivityResource, "eventDate" | "defaultPrice">;
}

/**
 * El subtítulo de una actividad: la fecha y el precio, cada uno con su ícono y separados por
 * una barra gris, no por «·» (Thony, 2026-11-11). Va en cartillas y en el resumen.
 */
export default function ActivityMeta({ activity }: IActivityMetaProps) {
  return (
    <span className="inline-flex flex-wrap items-center gap-x-2.5 gap-y-1">
      <span className="inline-flex items-center gap-1.5">
        <CalendarDays aria-hidden className="size-4 shrink-0" />
        {formatShortDate(activity.eventDate)}
      </span>
      <span aria-hidden className="h-4 w-px bg-border" />
      <span className="inline-flex items-center gap-1.5 tabular-nums">
        <Ticket aria-hidden className="size-4 shrink-0" />
        <span className="sr-only">Precio:</span>
        {formatSoles(activity.defaultPrice)}
      </span>
    </span>
  );
}
