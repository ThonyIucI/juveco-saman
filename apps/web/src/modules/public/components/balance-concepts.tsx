import type { IPublicActivity } from "@juveco/shared/public";
import { ArrowDownLeft, ArrowUpRight, HeartHandshake } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface IBalanceConceptsProps {
  activities: IPublicActivity[];
  supporters: string[];
}

/**
 * El balance de la Chocolatada para el público (Thony, 2026-11-25): solo de dónde entró y en
 * qué se gastó, **sin montos**, y quiénes apoyaron.
 */
export default function BalanceConcepts({ activities, supporters }: IBalanceConceptsProps) {
  const withConcepts = activities.filter(
    (activity) => activity.incomeConcepts.length > 0 || activity.expenseConcepts.length > 0,
  );

  return (
    <div className="space-y-5">
      {withConcepts.length === 0 ? (
        <p className="text-sm text-muted-foreground">Todavía no hay movimientos que mostrar.</p>
      ) : (
        withConcepts.map((activity) => (
          <div key={activity.id} className="space-y-2">
            <h3 className="font-heading font-bold text-foreground">{activity.name}</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <ConceptList icon={ArrowDownLeft} title="Ingresos" concepts={activity.incomeConcepts} />
              <ConceptList icon={ArrowUpRight} title="Egresos" concepts={activity.expenseConcepts} />
            </div>
          </div>
        ))
      )}

      {supporters.length > 0 && (
        <div className="space-y-2">
          <h3 className="flex items-center gap-2 font-heading font-bold text-foreground">
            <HeartHandshake aria-hidden className="size-4.5 text-primary" />
            Gracias a quienes apoyaron
          </h3>
          <ul className="flex flex-wrap gap-2">
            {supporters.map((name) => (
              <li key={name} className="rounded-md bg-muted px-2.5 py-1 text-sm text-foreground">
                {name}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function ConceptList({ icon: Icon, title, concepts }: { icon: LucideIcon; title: string; concepts: string[] }) {
  return (
    <div className="rounded-md border border-border px-3 py-2.5">
      <p className="mb-1 flex items-center gap-1.5 text-sm font-semibold text-muted-foreground">
        <Icon aria-hidden className="size-4" />
        {title}
      </p>
      {concepts.length === 0 ? (
        <p className="text-sm text-muted-foreground">—</p>
      ) : (
        <ul className="list-inside list-disc space-y-0.5 text-sm text-foreground marker:text-muted-foreground">
          {concepts.map((concept) => (
            <li key={concept}>{concept}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
