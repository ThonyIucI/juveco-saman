import { Skeleton } from "@juveco/ui/components/skeleton";
import type { IDwellingResource } from "@juveco/shared/dwellings";

import NeighborhoodBadge from "@/common/components/neighborhood-badge";
import RowActions, { type IRowAction } from "@/common/components/row-actions";
import { FADE_IN_CLASS } from "@/common/constants/motion";
import { dwellingCountsLabel, headNamesLabel } from "@/modules/dwellings/utils/dwellings";

import DwellingStatusBadge from "./dwelling-status-badge";

const SKELETON_COUNT = 4;

interface IDwellingCardListProps {
  dwellings: IDwellingResource[];
  isLoading: boolean;
  buildActions: (dwelling: IDwellingResource) => IRowAction[];
  onOpen: (dwelling: IDwellingResource) => void;
}

/**
 * Cards de las viviendas en celular: header gris con el código, los jefes y las acciones; en
 * el cuerpo, el barrio a la izquierda y el estado a la derecha. En escritorio va la tabla.
 */
export default function DwellingCardList({ dwellings, isLoading, buildActions, onOpen }: IDwellingCardListProps) {
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
              <Skeleton className="h-6 w-28 rounded-md" />
              <Skeleton className="h-6 w-20 rounded-md" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={`space-y-3 md:hidden ${FADE_IN_CLASS}`}>
      {dwellings.map((dwelling) => (
        <article
          key={dwelling.id}
          role="button"
          tabIndex={0}
          aria-label={`Ver la vivienda ${dwelling.code}`}
          onClick={() => onOpen(dwelling)}
          onKeyDown={(event) => {
            if (event.target === event.currentTarget && (event.key === "Enter" || event.key === " ")) {
              event.preventDefault();
              onOpen(dwelling);
            }
          }}
          className="cursor-pointer overflow-hidden rounded-sm border border-border bg-card transition-colors outline-none hover:border-primary/40 focus-visible:ring-4 focus-visible:ring-ring/30"
        >
          <div className="flex items-start gap-2 border-b border-border bg-muted p-3">
            <div className="min-w-0 flex-1">
              <p className="line-clamp-2 font-heading text-lg font-semibold wrap-anywhere text-foreground">
                <span className="font-mono text-primary tabular-nums">{dwelling.code}</span>{" "}
                {headNamesLabel(dwelling)}
              </p>
              <p className="text-sm text-muted-foreground">{dwellingCountsLabel(dwelling)}</p>
            </div>
            <RowActions actions={buildActions(dwelling)} isBordered />
          </div>

          <div className="flex items-center justify-between gap-2 p-3">
            <NeighborhoodBadge neighborhood={dwelling.neighborhood} hasIcon={false} />
            <DwellingStatusBadge status={dwelling.status} />
          </div>
        </article>
      ))}
    </div>
  );
}
