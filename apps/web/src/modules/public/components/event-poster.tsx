import type { IPublicProject } from "@juveco/shared/public";
import { Gift } from "lucide-react";

import { formatWeekdayDate } from "@/common/utils/format-date";
import { ACTIVITY_ICONS } from "@/modules/public/utils/activity-icons";
import { activityFirstDateOf, activityShownDateOf } from "@/modules/public/utils/activity-links";
import { daysUntil } from "@/modules/public/utils/event-dates";

import ActivityLink from "./activity-link";
import DateBlock from "./date-block";

/** La cuenta regresiva en su bloque dorado; nada si el evento ya pasó. */
function Countdown({ date }: { date: string }) {
  const days = daysUntil(date);
  if (days < 0) {
    return null;
  }

  return (
    <div className="flex min-w-20 shrink-0 flex-col items-center justify-center rounded-lg bg-gold px-3 py-2 text-center text-gold-foreground md:row-span-2 md:col-start-3 md:row-start-1 md:min-w-24">
      {days >= 2 ? (
        <>
          <span className="font-heading text-2xl leading-none font-semibold tabular-nums">{days}</span>
          <span className="text-xs font-medium">días</span>
        </>
      ) : (
        <span className="text-base font-semibold">{days === 0 ? "Es hoy" : "Es mañana"}</span>
      )}
    </div>
  );
}

/**
 * El cartel del evento en curso: una tarjeta blanca que monta sobre el borde inferior del
 * carrusel (Thony, 2026-11-25). Fecha como calendario, beneficiarios, las actividades como
 * pastillas que llevan a su página y la cuenta regresiva. En celular, dos filas.
 */
export default function EventPoster({ event }: { event: IPublicProject }) {
  const activities = [...event.activities].sort((first, second) =>
    activityFirstDateOf(first).localeCompare(activityFirstDateOf(second)),
  );

  return (
    <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-3 rounded-xl border border-border bg-card p-4 shadow-elevated md:grid-cols-[auto_1fr_auto] md:items-center md:gap-x-5 md:p-5">
      <DateBlock date={event.startDate} className="md:row-span-2" />

      <div className="min-w-0 md:col-start-2 md:row-start-1">
        <p className="text-xs font-semibold tracking-widest text-primary uppercase dark:text-blue-400">Evento en curso</p>
        <h2 className="font-heading text-xl font-semibold text-foreground">{event.name}</h2>
        {event.beneficiaryCount ? (
          <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
            <Gift aria-hidden className="size-4 shrink-0 text-gold-ink" />
            {event.beneficiaryCount} niños y niñas
          </p>
        ) : null}
      </div>

      <div className="col-span-2 flex items-stretch gap-3 md:contents">
        <div className="flex min-w-0 flex-1 flex-col gap-2 md:col-start-2 md:row-start-2 md:flex-row md:flex-wrap">
          {activities.map((activity) => {
            const Icon = ACTIVITY_ICONS[activity.type];
            return (
              <ActivityLink
                key={activity.id}
                activity={activity}
                className="flex min-h-11 items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-1.5 text-sm transition-colors hover:border-primary hover:bg-muted"
              >
                <Icon aria-hidden className="size-4 shrink-0 text-primary dark:text-blue-400" />
                <span className="min-w-0 flex-1 font-medium text-foreground">{activity.name}</span>
                <span className="shrink-0 rounded-md bg-primary/10 px-1.5 py-0.5 text-xs font-medium text-primary dark:text-blue-400">
                  {formatWeekdayDate(activityShownDateOf(activity))}
                </span>
              </ActivityLink>
            );
          })}
        </div>
        <Countdown date={event.startDate} />
      </div>
    </div>
  );
}
