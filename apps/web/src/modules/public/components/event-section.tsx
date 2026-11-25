import { EActivityType, activityTypeLabels } from "@juveco/shared/activities";
import type { IPublicActivity, IPublicProject } from "@juveco/shared/public";
import { ArrowRight, Clock } from "lucide-react";

import { formatLongDate } from "@/common/utils/format-date";
import { ACTIVITY_ICONS } from "@/modules/public/utils/activity-icons";
import { activityFirstDateOf, activityNextDateOf, activityShownDateOf } from "@/modules/public/utils/activity-links";
import { countdownLabelOf, daysUntil } from "@/modules/public/utils/event-dates";

import AccountsPanel from "./accounts-panel";
import ActivityLink from "./activity-link";
import DateBlock from "./date-block";
import { RevealGroup, RevealItem } from "./reveal";
import SiteSection from "./site-section";

/* Qué hay en la página de cada actividad. */
const detailHint = (activity: IPublicActivity): string =>
  activity.type === EActivityType.CHAMPIONSHIP ? "Resultados y goleadores" : "Premios y ganadores";

/* Estado corto y verdadero según las fechas: lo que falta o que ya pasó. */
const statusOf = (activity: IPublicActivity): string => {
  const nextDate = activityNextDateOf(activity);
  return nextDate ? countdownLabelOf(daysUntil(nextDate)) : "Ya se realizó";
};

/**
 * El evento en curso en el inicio (Thony, 2026-11-25), sobre azul marino a todo el ancho:
 * dos piezas grandes, una por actividad, que llevan a su página, y debajo las cuentas claras
 * con montos por concepto.
 */
export default function EventSection({ event }: { event: IPublicProject }) {
  const activities = [...event.activities].sort((first, second) =>
    activityFirstDateOf(first).localeCompare(activityFirstDateOf(second)),
  );
  const facts = [
    formatLongDate(event.startDate),
    event.beneficiaryCount ? `para ${event.beneficiaryCount} niños y niñas` : null,
  ].filter(Boolean);

  return (
    <SiteSection
      tone="navy"
      eyebrow="Evento en curso"
      title={event.name}
      intro={event.description ?? `${facts.join(", ")}. Estas actividades reúnen los fondos para hacerla posible.`}
    >
      <RevealGroup className="grid gap-4 md:grid-cols-2">
        {activities.map((activity) => {
          const Icon = ACTIVITY_ICONS[activity.type];
          return (
            <RevealItem key={activity.id}>
              <ActivityLink
                activity={activity}
                className="group flex min-h-24 items-center md:min-h-32 gap-3 rounded-xl border border-white/15 bg-white/5 p-4 md:gap-4 md:p-5 transition-colors hover:border-gold hover:bg-white/10"
              >
                <DateBlock date={activityShownDateOf(activity)} isOnNavy />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5 text-xs font-semibold tracking-widest text-gold uppercase">
                    <Icon aria-hidden className="size-4 shrink-0" />
                    {activityTypeLabels[activity.type]}
                  </span>
                  <span className="mt-1 block font-heading text-xl font-semibold text-white">{activity.name}</span>
                  <span className="mt-1 flex items-center gap-1.5 text-sm font-medium text-gold">
                    <Clock aria-hidden className="size-4 shrink-0" />
                    {statusOf(activity)}
                  </span>
                  <span className="block text-sm text-white/70">{detailHint(activity)}</span>
                </span>
                <ArrowRight
                  aria-hidden
                  className="size-6 shrink-0 text-white/70 transition-transform group-hover:translate-x-1 group-hover:text-gold motion-reduce:transition-none"
                />
              </ActivityLink>
            </RevealItem>
          );
        })}
      </RevealGroup>

      <AccountsPanel event={event} />
    </SiteSection>
  );
}
