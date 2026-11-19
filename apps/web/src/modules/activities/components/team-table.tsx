import { Skeleton } from "@juveco/ui/components/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@juveco/ui/components/table";
import type { IActivityTeamResource } from "@juveco/shared/activity-teams";
import { fullName } from "@juveco/shared/people";

import NeighborhoodBadge from "@/common/components/neighborhood-badge";
import RowActions, { type IRowAction } from "@/common/components/row-actions";
import { FADE_IN_CLASS } from "@/common/constants/motion";
import { formatTeamNumber, playerCountLabel } from "@/modules/activities/utils/teams";

import CollectionBadge from "./collection-badge";

const SKELETON_COUNT = 6;
const COLUMN_COUNT = 5;

interface ITeamTableProps {
  teams: IActivityTeamResource[];
  isLoading: boolean;
  /** El número de cada equipo: su orden de inscripción en todo el campeonato. */
  numbers: Map<string, number>;
  buildActions: (team: IActivityTeamResource) => IRowAction[];
  onOpen: (team: IActivityTeamResource) => void;
}

/**
 * Tabla de escritorio de los equipos (diseño de Stitch corregido, 2026-11-19): N.º · Equipo con
 * sus jugadores debajo · Delegado con su barrio debajo · Por cobrar · acciones con borde. Nada
 * se parte en dos líneas: lo secundario va debajo, no al costado. En celular van las cards.
 */
export default function TeamTable({ teams, isLoading, numbers, buildActions, onOpen }: ITeamTableProps) {
  return (
    <div className="hidden overflow-hidden rounded-sm border border-border bg-card md:block">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted hover:bg-muted">
            <TableHead className="w-16">N.º</TableHead>
            <TableHead>Equipo</TableHead>
            <TableHead>Delegado</TableHead>
            <TableHead className="text-right">Por cobrar</TableHead>
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
            : teams.map((team) => (
                <TableRow key={team.id} className="cursor-pointer" onClick={() => onOpen(team)}>
                  <TableCell>
                    <span className="font-mono text-base font-semibold text-primary tabular-nums">
                      {formatTeamNumber(numbers.get(team.id) ?? 0)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="block truncate font-heading font-semibold text-foreground">{team.name}</span>
                    <span className="block text-sm text-muted-foreground">{playerCountLabel(team.players.length)}</span>
                  </TableCell>
                  <TableCell>
                    <span className="block truncate text-foreground">{fullName(team.delegate)}</span>
                    {team.delegate.neighborhood && (
                      <span className="mt-0.5 block">
                        <NeighborhoodBadge neighborhood={team.delegate.neighborhood} hasIcon={false} />
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <CollectionBadge item={team} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end">
                      <RowActions actions={buildActions(team)} isBordered />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
        </TableBody>
      </Table>
    </div>
  );
}
