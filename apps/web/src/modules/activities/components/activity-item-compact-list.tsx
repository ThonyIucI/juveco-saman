import { IconButton } from "@juveco/ui/components/icon-button";
import { Skeleton } from "@juveco/ui/components/skeleton";
import { cn } from "@juveco/ui/lib/utils";
import { type IActivityItemResource, normalizeItemSerial } from "@juveco/shared/activity-items";
import { fullName } from "@juveco/shared/people";
import { HandCoins } from "lucide-react";

import { FADE_IN_CLASS } from "@/common/constants/motion";
import { collectionOf } from "@/modules/activities/utils/activity-items";

import CollectionBadge from "./collection-badge";
import ItemChangeBadge from "./item-change-badge";

const SKELETON_COUNT = 10;

/* Serie · cliente · por cobrar · cobrar. El último ancho fijo: las filas sin cobro no se corren. */
const ROW_GRID = "grid grid-cols-[2.5rem_minmax(0,1fr)_auto_2.25rem] items-center gap-2 px-3";

interface IActivityItemCompactListProps {
  items: IActivityItemResource[];
  isLoading: boolean;
  /** Cuántos hay con cada serie en **toda** la actividad, no solo en lo filtrado. */
  serialCounts: Map<string, number>;
  /** En pagadas y anuladas, «Cambio» en lugar de «Por cobrar» (Thony, 2026-11-11). */
  isChangeColumn: boolean;
  /** Ver `changedSerials`. */
  relatedSerials: Map<string, string>;
  onPay: (item: IActivityItemResource) => void;
  onOpen: (item: IActivityItemResource) => void;
}

/**
 * Vista compacta en celular (Thony, 2026-11-08), como la tabla de órdenes de la captura: una
 * fila por ítem con serie (amarilla si está repetida), cliente, lo que falta cobrar y el
 * botón de cobrar. Sin `⋯`: editar y eliminar están en el detalle, que abre la fila.
 */
export default function ActivityItemCompactList({
  items,
  isLoading,
  serialCounts,
  isChangeColumn,
  relatedSerials,
  onPay,
  onOpen,
}: IActivityItemCompactListProps) {
  return (
    <div className="overflow-hidden rounded-sm border border-border bg-card md:hidden">
      <div
        className={cn(
          ROW_GRID,
          "border-b border-border bg-muted py-2 text-xs font-medium tracking-wide text-muted-foreground uppercase",
        )}
      >
        <span>Serie</span>
        <span>Cliente</span>
        <span className="text-right">{isChangeColumn ? "Cambio" : "Por cobrar"}</span>
        <span className="sr-only">Cobrar</span>
      </div>

      {isLoading ? (
        <ul className="divide-y divide-border">
          {Array.from({ length: SKELETON_COUNT }, (_, index) => (
            <li key={index} className={cn(ROW_GRID, "py-2.5")}>
              <Skeleton className="h-4 w-10 rounded-md" />
              <Skeleton className="h-4 w-full rounded-md" />
              <Skeleton className="h-5 w-16 rounded-md" />
              <span />
            </li>
          ))}
        </ul>
      ) : (
        <ul className={cn("divide-y divide-border", FADE_IN_CLASS)}>
          {items.map((item) => {
            const isSerialRepeated = (serialCounts.get(normalizeItemSerial(item.serial)) ?? 0) > 1;
            /* Una anulada no se cobra: lo pagado pasó a la nueva. */
            const isPending = !item.voidedAt && collectionOf(item).pending > 0;

            return (
              <li
                key={item.id}
                role="button"
                tabIndex={0}
                aria-label={`Ver serie ${item.serial} de ${fullName(item.buyer)}`}
                onClick={() => onOpen(item)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onOpen(item);
                  }
                }}
                className={cn(
                  ROW_GRID,
                  "cursor-pointer py-1.5 outline-none hover:bg-muted/60 focus-visible:bg-muted/60",
                )}
              >
                <span
                  title={isSerialRepeated ? "Hay otra con esta serie" : undefined}
                  className={cn(
                    "truncate font-mono text-sm font-semibold tabular-nums",
                    isSerialRepeated ? "text-yellow" : "text-primary",
                  )}
                >
                  {item.serial}
                  {isSerialRepeated && <span className="sr-only"> (serie repetida)</span>}
                </span>
                <span className="truncate text-sm font-medium text-foreground">{fullName(item.buyer)}</span>
                {isChangeColumn ? (
                  <ItemChangeBadge item={item} relatedSerial={relatedSerials.get(item.id)} />
                ) : (
                  <CollectionBadge item={item} />
                )}
                {isPending ? (
                  <IconButton
                    label={`Registrar pago de la serie ${item.serial}`}
                    isBordered
                    onClick={(event) => {
                      event.stopPropagation();
                      onPay(item);
                    }}
                  >
                    <HandCoins />
                  </IconButton>
                ) : (
                  <span />
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
