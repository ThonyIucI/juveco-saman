import { Badge } from "@juveco/ui/components/badge";
import { type IActivityResource, activityTypeLabels } from "@juveco/shared/activities";
import { CalendarDays } from "lucide-react";

import { formatShortDate } from "@/common/utils/format-date";

interface IActivityOverviewCardProps {
  activity: IActivityResource;
  onOpen: () => void;
}

/**
 * Una actividad en el inicio: nombre y tipo arriba; abajo, la fecha. Toda la card abre la
 * actividad. La ganancia neta se suma después (Thony, 2026-11-07: por ahora solo nombre, tipo
 * y fecha).
 */
export default function ActivityOverviewCard({ activity, onOpen }: IActivityOverviewCardProps) {
  return (
    <article
      role="button"
      tabIndex={0}
      aria-label={`Ver ${activity.name}`}
      onClick={onOpen}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpen();
        }
      }}
      className="cursor-pointer overflow-hidden rounded-sm border border-border bg-card transition-colors outline-none hover:border-primary/40 focus-visible:ring-4 focus-visible:ring-ring/30"
    >
      <div className="flex items-center justify-between gap-2 border-b border-border bg-muted px-3 py-2.5">
        <p className="truncate font-heading text-base font-bold text-foreground">{activity.name}</p>
        <Badge color="primary" className="shrink-0 rounded-md">
          {activityTypeLabels[activity.type]}
        </Badge>
      </div>

      <div className="p-3">
        <p className="flex items-center gap-2 text-sm text-foreground">
          <CalendarDays aria-hidden className="size-4 text-muted-foreground" />
          <span className="font-semibold">{formatShortDate(activity.eventDate)}</span>
        </p>
      </div>
    </article>
  );
}
