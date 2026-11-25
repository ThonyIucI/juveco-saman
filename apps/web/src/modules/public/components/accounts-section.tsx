import type { IPublicProject } from "@juveco/shared/public";
import { ArrowDownLeft, ArrowUpRight, HeartHandshake } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Reveal, RevealGroup, RevealItem } from "./reveal";
import SiteSection from "./site-section";

interface IConceptGroup {
  activityName: string;
  concepts: string[];
}

/**
 * Cuentas claras del evento (Thony, 2026-11-25): de dónde vinieron los fondos y en qué se
 * usaron, **solo los conceptos, sin montos**, y quiénes apoyaron.
 */
export default function AccountsSection({ event }: { event: IPublicProject }) {
  const incomes = event.activities
    .map((activity) => ({ activityName: activity.name, concepts: activity.incomeConcepts }))
    .filter((group) => group.concepts.length > 0);
  const expenses = event.activities
    .map((activity) => ({ activityName: activity.name, concepts: activity.expenseConcepts }))
    .filter((group) => group.concepts.length > 0);

  return (
    <SiteSection
      id="cuentas"
      tone="muted"
      eyebrow={event.name}
      title="Cuentas claras"
      intro="De dónde vinieron los fondos y en qué se usaron."
    >
      <RevealGroup className="grid gap-5 md:grid-cols-2">
        <RevealItem>
          <ConceptCard icon={ArrowDownLeft} title="Lo que entró" groups={incomes} />
        </RevealItem>
        <RevealItem>
          <ConceptCard icon={ArrowUpRight} title="En qué se usó" groups={expenses} />
        </RevealItem>
      </RevealGroup>

      {event.supporters.length > 0 && (
        <Reveal className="mt-12">
          <h3 className="flex items-center gap-2 font-heading text-xl font-extrabold text-foreground">
            <HeartHandshake aria-hidden className="size-6 text-primary" />
            Gracias a quienes apoyaron
          </h3>
          <ul className="mt-4 flex flex-wrap gap-2">
            {event.supporters.map((name) => (
              <li key={name} className="rounded-full border border-border bg-card px-4 py-1.5 text-foreground">
                {name}
              </li>
            ))}
          </ul>
        </Reveal>
      )}
    </SiteSection>
  );
}

function ConceptCard({ icon: Icon, title, groups }: { icon: LucideIcon; title: string; groups: IConceptGroup[] }) {
  return (
    <div className="h-full rounded-lg border border-border bg-card p-6">
      <h3 className="flex items-center gap-2 font-heading text-lg font-bold text-foreground">
        <Icon aria-hidden className="size-5 text-primary" />
        {title}
      </h3>
      {groups.length === 0 ? (
        <p className="mt-3 text-muted-foreground">Todavía no hay movimientos.</p>
      ) : (
        <div className="mt-4 space-y-4">
          {groups.map((group) => (
            <div key={group.activityName}>
              <p className="text-sm font-semibold text-muted-foreground">{group.activityName}</p>
              <ul className="mt-1 space-y-1">
                {group.concepts.map((concept) => (
                  <li key={concept} className="flex items-start gap-2 text-foreground">
                    <span aria-hidden className="mt-2.5 size-1.5 shrink-0 rounded-full bg-primary" />
                    {concept}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
