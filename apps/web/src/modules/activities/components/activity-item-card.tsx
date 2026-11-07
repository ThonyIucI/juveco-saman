import { Badge } from "@juveco/ui/components/badge";
import { Skeleton } from "@juveco/ui/components/skeleton";
import type { IActivityItemResource } from "@juveco/shared/activity-items";
import { formatSoles } from "@juveco/shared/money";
import { fullName } from "@juveco/shared/people";
import { CircleCheck, CircleX, Clock, type LucideIcon, TriangleAlert } from "lucide-react";
import type { ComponentProps } from "react";

import NeighborhoodBadge from "@/common/components/neighborhood-badge";
import RowActions, { type IRowAction } from "@/common/components/row-actions";
import { type TCollectionStatus, collectionOf } from "@/modules/activities/utils/activity-items";

interface IActivityItemCardProps {
  item: IActivityItemResource;
  /** Hay otro ítem con la misma serie en esta actividad. */
  isSerialRepeated: boolean;
  actions: IRowAction[];
}

/* Como el «A cobrar» de la card de reportes de ventas de id-pos (acordado 2026-11-07). */
const COLLECTION_BADGE: Record<TCollectionStatus, { color: ComponentProps<typeof Badge>["color"]; icon: LucideIcon }> = {
  PAID: { color: "success", icon: CircleCheck },
  PARTIAL: { color: "yellow", icon: Clock },
  UNPAID: { color: "destructive", icon: CircleX },
};

/**
 * Card de lo vendido (en un bingo, una cartilla), como la de reportes de ventas de id-pos
 * (acordado 2026-11-07):
 * - Header gris: la serie y, debajo, el comprador; a la derecha, `⋯` con borde.
 * - Cuerpo: el barrio y, a la derecha, «Por cobrar»: verde en S/ 0.00 si pagó todo,
 *   amarillo si pagó una parte y rojo si no pagó nada.
 */
export default function ActivityItemCard({ item, isSerialRepeated, actions }: IActivityItemCardProps) {
  const collection = collectionOf(item);
  const { color, icon: CollectionIcon } = COLLECTION_BADGE[collection.status];

  return (
    /* Borde gris y radio chico como el DetailCard de reportes de id-pos; sin sombra (Thony, 2026-11-07). */
    <article className="overflow-hidden rounded-sm border border-border bg-card">
      <div className="flex items-start gap-2 border-b border-border bg-muted p-3">
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 font-mono text-sm font-semibold text-primary tabular-nums">
            <span className="truncate">N.º {item.serial}</span>
            {isSerialRepeated && (
              <TriangleAlert role="img" aria-label="Serie repetida" className="size-4 shrink-0 text-yellow">
                <title>Hay otra con esta serie</title>
              </TriangleAlert>
            )}
          </p>
          <p className="truncate font-heading text-base font-bold text-foreground">{fullName(item.buyer)}</p>
        </div>
        <RowActions actions={actions} isBordered />
      </div>

      <div className="grid grid-cols-2 gap-2 p-3">
        <div className="min-w-0 space-y-1">
          <p className="text-sm font-medium text-muted-foreground">Barrio</p>
          {/* Sin barrio queda vacío (Thony, 2026-11-07). */}
          {item.buyer.neighborhood && <NeighborhoodBadge neighborhood={item.buyer.neighborhood} />}
        </div>
        {/* A la derecha, para no dejar un hueco al costado del monto. */}
        <div className="flex flex-col items-end space-y-1">
          <p className="text-sm font-medium text-muted-foreground">Por cobrar</p>
          <Badge color={color} className="rounded-md tabular-nums">
            <CollectionIcon aria-hidden />
            {formatSoles(collection.pending)}
          </Badge>
        </div>
      </div>
    </article>
  );
}

export function ActivityItemCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-sm border border-border bg-card">
      <div className="space-y-2 border-b border-border bg-muted p-3">
        <Skeleton className="h-4 w-20 rounded-md" />
        <Skeleton className="h-5 w-40 rounded-md" />
      </div>
      <div className="grid grid-cols-2 gap-2 p-3">
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-14 rounded-md" />
          <Skeleton className="h-5 w-24 rounded-full" />
        </div>
        <div className="flex flex-col items-end space-y-1.5">
          <Skeleton className="h-4 w-20 rounded-md" />
          <Skeleton className="h-5 w-20 rounded-md" />
        </div>
      </div>
    </div>
  );
}
