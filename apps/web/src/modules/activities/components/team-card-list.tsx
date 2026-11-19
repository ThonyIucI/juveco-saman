import { Skeleton } from "@juveco/ui/components/skeleton";
import type { IActivityTeamResource } from "@juveco/shared/activity-teams";
import { fullName } from "@juveco/shared/people";

import NeighborhoodBadge from "@/common/components/neighborhood-badge";
import RowActions, { type IRowAction } from "@/common/components/row-actions";
import { FADE_IN_CLASS } from "@/common/constants/motion";
import { formatTeamNumber, playerCountLabel } from "@/modules/activities/utils/teams";

import CollectionBadge from "./collection-badge";

const SKELETON_COUNT = 4;

interface ITeamCardListProps {
  teams: IActivityTeamResource[];
  isLoading: boolean;
  /** El número de cada equipo: su orden de inscripción en todo el campeonato. */
  numbers: Map<string, number>;
  buildActions: (team: IActivityTeamResource) => IRowAction[];
  onOpen: (team: IActivityTeamResource) => void;
}

/**
 * Cards de los equipos en celular, como las de las cartillas: header gris con el número, el
 * nombre y las acciones; en el cuerpo, el delegado con su barrio a la izquierda y lo que falta
 * cobrar a la derecha. En escritorio va la tabla.
 */
export default function TeamCardList({ teams, isLoading, numbers, buildActions, onOpen }: ITeamCardListProps) {
  if (isLoading) {
    return (
      <div className="space-y-3 md:hidden">
        {Array.from({ length: SKELETON_COUNT }, (_, index) => (
          <div key={index} className="overflow-hidden rounded-sm border border-border bg-card">
            <div className="space-y-2 border-b border-border bg-muted p-3">
              <Skeleton className="h-6 w-48 rounded-md" />
              <Skeleton className="h-4 w-28 rounded-md" />
            </div>
            <div className="flex justify-between gap-2 p-3">
              <Skeleton className="h-10 w-32 rounded-md" />
              <Skeleton className="h-10 w-20 rounded-md" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={`space-y-3 md:hidden ${FADE_IN_CLASS}`}>
      {teams.map((team) => (
        <article
          key={team.id}
          role="button"
          tabIndex={0}
          aria-label={`Ver el equipo ${team.name}`}
          onClick={() => onOpen(team)}
          onKeyDown={(event) => {
            if (event.target === event.currentTarget && (event.key === "Enter" || event.key === " ")) {
              event.preventDefault();
              onOpen(team);
            }
          }}
          className="cursor-pointer overflow-hidden rounded-sm border border-border bg-card transition-colors outline-none hover:border-primary/40 focus-visible:ring-4 focus-visible:ring-ring/30"
        >
          <div className="flex items-start gap-2 border-b border-border bg-muted p-3">
            <div className="min-w-0 flex-1">
              <p className="line-clamp-2 font-heading text-lg font-semibold wrap-anywhere text-foreground">
                <span className="font-mono text-primary tabular-nums">
                  {formatTeamNumber(numbers.get(team.id) ?? 0)}
                </span>{" "}
                {team.name}
              </p>
              <p className="text-sm text-muted-foreground">{playerCountLabel(team.players.length)}</p>
            </div>
            <RowActions actions={buildActions(team)} isBordered />
          </div>

          <div className="grid grid-cols-2 gap-2 p-3">
            <div className="min-w-0 space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Delegado</p>
              <p className="truncate text-sm text-foreground">{fullName(team.delegate)}</p>
              {team.delegate.neighborhood && (
                <NeighborhoodBadge neighborhood={team.delegate.neighborhood} hasIcon={false} />
              )}
            </div>
            <div className="flex flex-col items-end space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Por cobrar</p>
              <CollectionBadge item={team} />
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
