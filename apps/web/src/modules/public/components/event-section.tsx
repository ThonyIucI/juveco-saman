import { EActivityType } from "@juveco/shared/activities";
import type { IPublicActivity, IPublicProject } from "@juveco/shared/public";
import { CalendarDays, Ticket, Trophy, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { formatLongDate } from "@/common/utils/format-date";
import { MATCH_DAYS } from "@/modules/public/data/relampago-2026";

import ChampionshipBoard from "./championship-board";
import CountUp from "./count-up";
import EventTimeline, { type ITimelineStep } from "./event-timeline";
import PrizeGrid from "./prize-grid";
import { Reveal } from "./reveal";
import SiteSection from "./site-section";

/* El campeonato se juega en dos fechas: salen de sus resultados, no de la actividad. */
const activityDates = (activity: IPublicActivity): string =>
  activity.type === EActivityType.CHAMPIONSHIP
    ? MATCH_DAYS.map((day) => formatLongDate(day.date)).join(" y ")
    : formatLongDate(activity.eventDate);

const firstDateOf = (activity: IPublicActivity): string =>
  activity.type === EActivityType.CHAMPIONSHIP ? (MATCH_DAYS[0]?.date ?? activity.eventDate) : activity.eventDate;

/**
 * El evento en curso contado como una sola historia (acordado 2026-11-25): qué es, la línea
 * de tiempo de las actividades que juntan los fondos y cada actividad con lo suyo. Las cuentas
 * van en la sección que sigue.
 */
export default function EventSection({ event }: { event: IPublicProject }) {
  const activities = [...event.activities].sort((first, second) =>
    firstDateOf(first).localeCompare(firstDateOf(second)),
  );
  const steps: ITimelineStep[] = [
    ...activities.map((activity) => ({ targetId: activity.id, title: activity.name, date: activityDates(activity) })),
    { title: event.name, date: formatLongDate(event.startDate) },
  ];

  return (
    <SiteSection
      id="eventos"
      eyebrow="Evento en curso"
      title={event.name}
      intro={event.description ?? "Estas actividades juntan los fondos para hacerlo posible."}
    >
      <div className="space-y-16 md:space-y-20">
        <Reveal className="grid grid-cols-2 gap-4 md:grid-cols-3">
          <Stat icon={CalendarDays} label="Fecha" value={formatLongDate(event.startDate)} />
          {event.beneficiaryCount !== null && (
            <Stat icon={Users} label="Niños y niñas" value={<CountUp value={event.beneficiaryCount} />} />
          )}
          <Stat icon={Ticket} label="Actividades" value={<CountUp value={activities.length} />} />
        </Reveal>

        <EventTimeline steps={steps} />

        {activities.map((activity) => (
          <ActivityBlock key={activity.id} activity={activity} />
        ))}
      </div>
    </SiteSection>
  );
}

function Stat({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-card p-5 last:col-span-2 md:last:col-span-1">
      <Icon aria-hidden className="mb-3 size-5 text-primary" />
      <p className="font-heading text-2xl font-extrabold text-foreground tabular-nums md:text-3xl">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

function ActivityBlock({ activity }: { activity: IPublicActivity }) {
  const isChampionship = activity.type === EActivityType.CHAMPIONSHIP;
  const Icon = isChampionship ? Trophy : Ticket;

  return (
    <div id={activity.id} className="scroll-mt-20">
      <Reveal className="mb-6 flex items-center gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-md bg-secondary text-primary">
          <Icon aria-hidden className="size-6" />
        </span>
        <div>
          <h3 className="font-heading text-2xl font-extrabold text-foreground">{activity.name}</h3>
          <p className="text-muted-foreground">{activityDates(activity)}</p>
        </div>
      </Reveal>
      {isChampionship ? <ChampionshipBoard /> : <PrizeGrid prizes={activity.prizes} />}
    </div>
  );
}
