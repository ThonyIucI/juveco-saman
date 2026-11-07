import { Skeleton } from "@juveco/ui/components/skeleton";
import type { IActivityItemResource } from "@juveco/shared/activity-items";
import { fullName } from "@juveco/shared/people";
import { TriangleAlert } from "lucide-react";

import NeighborhoodBadge from "@/common/components/neighborhood-badge";
import RowActions, { type IRowAction } from "@/common/components/row-actions";

import CollectionBadge from "./collection-badge";

interface IActivityItemCardProps {
  item: IActivityItemResource;
  /** Hay otro ítem con la misma serie en esta actividad. */
  isSerialRepeated: boolean;
  actions: IRowAction[];
  /** Abre el detalle con sus pagos. */
  onOpen: () => void;
}

/**
 * Card de lo vendido (en un bingo, una cartilla), como la de reportes de ventas de id-pos
 * (acordado 2026-11-07):
 * - Header gris: la serie (18 px) y, debajo, el comprador con su barrio al lado; a la
 *   derecha, el acceso al pago y `⋯` con borde.
 * - Cuerpo: quién lo vendió y, a la derecha, «Por cobrar»: verde en S/ 0.00 si pagó todo,
 *   amarillo si pagó una parte y rojo si no pagó nada.
 * Solo en celular: en escritorio va la tabla.
 */
export default function ActivityItemCard({ item, isSerialRepeated, actions, onOpen }: IActivityItemCardProps) {
  return (
    /* Borde gris y radio chico como el DetailCard de reportes de id-pos; sin sombra (Thony, 2026-11-07). */
    /* Toda la card abre el detalle; `⋯` y el acceso al pago frenan el clic (RowActions). */
    <article
      role="button"
      tabIndex={0}
      aria-label={`Ver la serie ${item.serial} de ${fullName(item.buyer)}`}
      onClick={onOpen}
      onKeyDown={(event) => {
        if (event.target === event.currentTarget && (event.key === "Enter" || event.key === " ")) {
          event.preventDefault();
          onOpen();
        }
      }}
      className="cursor-pointer overflow-hidden rounded-sm border border-border bg-card transition-colors outline-none hover:border-primary/40 focus-visible:ring-4 focus-visible:ring-ring/30"
    >
      <div className="flex items-start gap-2 border-b border-border bg-muted p-3">
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 font-mono text-lg font-semibold text-primary tabular-nums">
            <span className="truncate">N.º {item.serial}</span>
            {isSerialRepeated && (
              <TriangleAlert role="img" aria-label="Serie repetida" className="size-4 shrink-0 text-yellow">
                <title>Hay otra con esta serie</title>
              </TriangleAlert>
            )}
          </p>
          {/* El barrio al lado del nombre (prueba, Thony 2026-11-07); sin barrio, nada. */}
          <div className="flex min-w-0 items-center gap-2">
            <p className="truncate font-heading text-base font-bold text-foreground">{fullName(item.buyer)}</p>
            {item.buyer.neighborhood && (
              <span className="shrink-0">
                <NeighborhoodBadge neighborhood={item.buyer.neighborhood} hasIcon={false} />
              </span>
            )}
          </div>
        </div>
        <RowActions actions={actions} isBordered />
      </div>

      <div className="grid grid-cols-2 gap-2 p-3">
        <div className="min-w-0 space-y-1">
          <p className="text-sm font-medium text-muted-foreground">Vendedor</p>
          <p className="truncate text-sm font-semibold text-foreground">{fullName(item.seller)}</p>
        </div>
        {/* A la derecha, para no dejar un hueco al costado del monto. */}
        <div className="flex flex-col items-end space-y-1">
          <p className="text-sm font-medium text-muted-foreground">Por cobrar</p>
          <CollectionBadge item={item} />
        </div>
      </div>
    </article>
  );
}

export function ActivityItemCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-sm border border-border bg-card">
      <div className="space-y-2 border-b border-border bg-muted p-3">
        <Skeleton className="h-6 w-24 rounded-md" />
        <Skeleton className="h-5 w-48 rounded-md" />
      </div>
      <div className="grid grid-cols-2 gap-2 p-3">
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-16 rounded-md" />
          <Skeleton className="h-5 w-28 rounded-md" />
        </div>
        <div className="flex flex-col items-end space-y-1.5">
          <Skeleton className="h-4 w-20 rounded-md" />
          <Skeleton className="h-5 w-20 rounded-md" />
        </div>
      </div>
    </div>
  );
}
