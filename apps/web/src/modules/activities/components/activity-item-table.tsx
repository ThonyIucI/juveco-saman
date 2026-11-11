import { Skeleton } from "@juveco/ui/components/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@juveco/ui/components/table";
import { type IActivityItemResource, normalizeItemSerial } from "@juveco/shared/activity-items";
import { formatSoles } from "@juveco/shared/money";
import { fullName } from "@juveco/shared/people";
import { TriangleAlert } from "lucide-react";

import NeighborhoodBadge from "@/common/components/neighborhood-badge";
import RowActions, { type IRowAction } from "@/common/components/row-actions";
import { FADE_IN_CLASS } from "@/common/constants/motion";

import CollectionBadge from "./collection-badge";
import ItemChangeBadge from "./item-change-badge";

const SKELETON_COUNT = 6;
const COLUMN_COUNT = 7;

interface IActivityItemTableProps {
  items: IActivityItemResource[];
  isLoading: boolean;
  /** Cuántos hay con cada serie en **toda** la actividad, no solo en lo filtrado. */
  serialCounts: Map<string, number>;
  /** En pagadas y anuladas, «Cambio» en lugar de «Por cobrar» (Thony, 2026-11-11). */
  isChangeColumn: boolean;
  /** Ver `changedSerials`. */
  relatedSerials: Map<string, string>;
  buildActions: (item: IActivityItemResource) => IRowAction[];
  onOpen: (item: IActivityItemResource) => void;
}

/**
 * Tabla de escritorio de lo vendido (prueba, Thony 2026-11-07); en celular van las cards.
 * Serie · Comprador · Barrio · Vendedor · Precio · Por cobrar · acciones con borde. Tocar la
 * fila abre el detalle; el acceso al pago y `⋯` no.
 */
export default function ActivityItemTable({
  items,
  isLoading,
  serialCounts,
  isChangeColumn,
  relatedSerials,
  buildActions,
  onOpen,
}: IActivityItemTableProps) {
  return (
    /* Borde gris y radio chico, como las cards (Thony, 2026-11-07). */
    <div className="hidden overflow-hidden rounded-sm border border-border bg-card md:block">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted hover:bg-muted">
            <TableHead>Serie</TableHead>
            <TableHead className="w-[26%]">Comprador</TableHead>
            <TableHead>Barrio</TableHead>
            <TableHead>Vendedor</TableHead>
            <TableHead className="text-right">Precio</TableHead>
            <TableHead className="text-right">{isChangeColumn ? "Cambio" : "Por cobrar"}</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody className={isLoading ? undefined : FADE_IN_CLASS}>
          {isLoading
            ? Array.from({ length: SKELETON_COUNT }, (_, index) => (
                <TableRow key={index}>
                  {Array.from({ length: COLUMN_COUNT }, (_, cell) => (
                    <TableCell key={cell}>
                      <Skeleton className="h-5 w-full max-w-28 rounded-md" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            : items.map((item) => {
                const isSerialRepeated = (serialCounts.get(normalizeItemSerial(item.serial)) ?? 0) > 1;

                return (
                  <TableRow key={item.id} className="cursor-pointer" onClick={() => onOpen(item)}>
                    <TableCell>
                      <span className="flex items-center gap-1.5 font-mono text-base font-semibold text-primary tabular-nums">
                        {item.serial}
                        {isSerialRepeated && (
                          <TriangleAlert role="img" aria-label="Serie repetida" className="size-4 shrink-0 text-yellow">
                            <title>Hay otra con esta serie</title>
                          </TriangleAlert>
                        )}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="block truncate font-heading font-semibold text-foreground">
                        {fullName(item.buyer)}
                      </span>
                    </TableCell>
                    <TableCell>
                      {item.buyer.neighborhood && (
                        <NeighborhoodBadge neighborhood={item.buyer.neighborhood} hasIcon={false} />
                      )}
                    </TableCell>
                    <TableCell className="text-foreground">{fullName(item.seller)}</TableCell>
                    <TableCell className="text-right text-foreground tabular-nums">{formatSoles(item.price)}</TableCell>
                    <TableCell className="text-right">
                      {isChangeColumn ? (
                        <ItemChangeBadge item={item} relatedSerial={relatedSerials.get(item.id)} />
                      ) : (
                        <CollectionBadge item={item} />
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end">
                        <RowActions actions={buildActions(item)} isBordered />
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
        </TableBody>
      </Table>
    </div>
  );
}
