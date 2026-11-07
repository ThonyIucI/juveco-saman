import { Badge } from "@juveco/ui/components/badge";
import { Skeleton } from "@juveco/ui/components/skeleton";
import { cn } from "@juveco/ui/lib/utils";
import { type IActivityResource, activityTypeLabels } from "@juveco/shared/activities";
import { formatSoles } from "@juveco/shared/money";
import { CalendarDays } from "lucide-react";
import { useEffect } from "react";

import { formatShortDate, todayIso } from "@/common/utils/format-date";
import { useGetActivityBalance } from "@/modules/activities/hooks/use-get-activity-balance";

interface IActivityOverviewCardProps {
  activity: IActivityResource;
  onOpen: () => void;
}

/** Ya pasó el día del evento: se puede mostrar cómo quedó. */
export const isActivityFinished = (activity: IActivityResource): boolean => activity.eventDate < todayIso();

/**
 * Una actividad en el inicio (acordado 2026-11-07): nombre y tipo arriba; abajo, la ganancia
 * neta si ya se realizó o «Por realizar el: fecha» si todavía no. Toda la card abre la
 * actividad.
 */
export default function ActivityOverviewCard({ activity, onOpen }: IActivityOverviewCardProps) {
  const isFinished = isActivityFinished(activity);
  const GetActivityBalance = useGetActivityBalance();
  const { balance } = GetActivityBalance;

  /* El balance solo hace falta si ya se realizó. */
  useEffect(() => {
    if (!isFinished) {
      return;
    }
    const controller = new AbortController();
    GetActivityBalance.handler(activity.id, controller.signal);
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activity.id, isFinished]);

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
        {isFinished ? (
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Ganancia neta</p>
            {balance ? (
              <p
                className={cn(
                  "font-heading text-xl font-bold tabular-nums",
                  balance.currentProfit < 0 ? "text-destructive" : "text-foreground",
                )}
              >
                {balance.currentProfit < 0
                  ? `− ${formatSoles(Math.abs(balance.currentProfit))}`
                  : formatSoles(balance.currentProfit)}
              </p>
            ) : (
              <Skeleton className="h-7 w-28 rounded-md" />
            )}
          </div>
        ) : (
          <p className="flex items-center gap-2 text-sm text-foreground">
            <CalendarDays aria-hidden className="size-4 text-muted-foreground" />
            <span>
              <span className="text-muted-foreground">Por realizar el:</span>{" "}
              <span className="font-semibold">{formatShortDate(activity.eventDate)}</span>
            </span>
          </p>
        )}
      </div>
    </article>
  );
}
