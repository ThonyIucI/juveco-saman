import { Skeleton } from "@juveco/ui/components/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@juveco/ui/components/table";
import type { IDwellingResource } from "@juveco/shared/dwellings";
import type { ReactNode } from "react";

import NeighborhoodBadge from "@/common/components/neighborhood-badge";
import RowActions, { type IRowAction } from "@/common/components/row-actions";
import { FADE_IN_CLASS } from "@/common/constants/motion";
import { dwellingCountsLabel, headNamesLabel } from "@/modules/dwellings/utils/dwellings";

import DwellingStatusBadge from "./dwelling-status-badge";

const SKELETON_COUNT = 6;
const COLUMN_COUNT = 5;

interface IDwellingTableProps {
  dwellings: IDwellingResource[];
  isLoading: boolean;
  buildActions: (dwelling: IDwellingResource) => IRowAction[];
  onOpen: (dwelling: IDwellingResource) => void;
  /** El paginado, dentro de la card. */
  footer?: ReactNode;
}

/**
 * Tabla de escritorio de las viviendas: Código · Jefes (con familias y personas debajo) ·
 * Barrio · Estado · acciones con borde. En celular van las cards. Tocar la fila abre la vivienda.
 */
export default function DwellingTable({ dwellings, isLoading, buildActions, onOpen, footer }: IDwellingTableProps) {
  return (
    <div className="hidden overflow-hidden rounded-sm border border-border bg-card md:block">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted hover:bg-muted">
            <TableHead className="w-32">Código</TableHead>
            <TableHead>Familias</TableHead>
            <TableHead>Barrio</TableHead>
            <TableHead>Estado</TableHead>
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
            : dwellings.map((dwelling) => (
                <TableRow key={dwelling.id} className="cursor-pointer" onClick={() => onOpen(dwelling)}>
                  <TableCell>
                    <span className="font-mono text-base font-semibold text-primary tabular-nums">
                      {dwelling.code}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="block max-w-md truncate font-heading font-semibold text-foreground">
                      {headNamesLabel(dwelling)}
                    </span>
                    {dwelling.familyCount > 0 && (
                      <span className="block text-sm text-muted-foreground">{dwellingCountsLabel(dwelling)}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <NeighborhoodBadge neighborhood={dwelling.neighborhood} hasIcon={false} />
                  </TableCell>
                  <TableCell>
                    <DwellingStatusBadge status={dwelling.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end">
                      <RowActions actions={buildActions(dwelling)} isBordered />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
        </TableBody>
      </Table>
      {footer}
    </div>
  );
}
