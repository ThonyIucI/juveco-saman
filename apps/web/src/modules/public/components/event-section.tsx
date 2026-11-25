import { EActivityType } from "@juveco/shared/activities";
import type { IPublicActivity, IPublicProject } from "@juveco/shared/public";
import { ChevronRight } from "lucide-react";

import { formatLongDate } from "@/common/utils/format-date";
import { activityDatesOf, activityFirstDateOf } from "@/modules/public/utils/activity-links";

import ActivityLink from "./activity-link";
import { Reveal, RevealGroup, RevealItem } from "./reveal";
import SiteSection from "./site-section";

/* Qué hay en la página de cada actividad. */
const detailHint = (activity: IPublicActivity): string =>
  activity.type === EActivityType.CHAMPIONSHIP ? "Resultados y goleadores" : "Premios y ganadores";

/**
 * El evento en curso en el inicio (Thony, 2026-11-25): solo se menciona. A la izquierda, sus
 * actividades como filas que llevan a la página de cada una; a la derecha, las cuentas claras
 * (conceptos **sin montos**). El detalle del campeonato y del bingo vive en su página.
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
      eyebrow="Evento en curso"
      title={event.name}
      intro={event.description ?? `${facts.join(", ")}. Estas actividades reúnen los fondos para hacerla posible.`}
    >
      <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
        <div>
          <Reveal>
            <h3 className="font-heading text-xl font-semibold text-foreground">Actividades</h3>
          </Reveal>
          <RevealGroup className="mt-3 divide-y divide-border border-y border-border">
            {activities.map((activity) => (
              <RevealItem key={activity.id}>
                <ActivityLink
                  activity={activity}
                  className="group flex min-h-14 items-center gap-3 py-3 transition-colors hover:text-primary"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block text-base font-medium text-foreground group-hover:text-primary">
                      {activity.name}
                    </span>
                    <span className="block text-sm text-muted-foreground">
                      {activityDatesOf(activity)} · {detailHint(activity)}
                    </span>
                  </span>
                  <ChevronRight aria-hidden className="size-5 shrink-0 text-muted-foreground group-hover:text-primary" />
                </ActivityLink>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>

        <div>
          <Reveal>
            <h3 className="font-heading text-xl font-semibold text-foreground">Cuentas claras</h3>
            <p className="text-sm text-muted-foreground">De dónde vinieron los fondos y en qué se usaron.</p>
          </Reveal>
          <RevealGroup className="mt-3 grid gap-6 border-t border-border pt-4 sm:grid-cols-2">
            <RevealItem>
              <ConceptList title="Lo que entró" activities={activities} pick={(activity) => activity.incomeConcepts} />
            </RevealItem>
            <RevealItem>
              <ConceptList title="En qué se usó" activities={activities} pick={(activity) => activity.expenseConcepts} />
            </RevealItem>
          </RevealGroup>
        </div>
      </div>
    </SiteSection>
  );
}

interface IConceptListProps {
  title: string;
  activities: IPublicActivity[];
  pick: (activity: IPublicActivity) => string[];
}

function ConceptList({ title, activities, pick }: IConceptListProps) {
  const groups = activities.filter((activity) => pick(activity).length > 0);

  return (
    <div>
      <p className="text-sm font-medium text-foreground">{title}</p>
      {groups.length === 0 ? (
        <p className="mt-1 text-sm text-muted-foreground">Todavía no hay movimientos.</p>
      ) : (
        groups.map((activity) => (
          <div key={activity.id} className="mt-2">
            <p className="text-xs text-muted-foreground">{activity.name}</p>
            <ul className="list-inside list-disc text-sm text-foreground marker:text-muted-foreground">
              {pick(activity).map((concept) => (
                <li key={concept}>{concept}</li>
              ))}
            </ul>
          </div>
        ))
      )}
    </div>
  );
}
