import { Button } from "@juveco/ui/components/button";
import { Skeleton } from "@juveco/ui/components/skeleton";
import type { IActivityExpenseResource } from "@juveco/shared/activity-expenses";
import { formatSoles } from "@juveco/shared/money";
import { Plus } from "lucide-react";

import { DetailSection } from "@/common/components/detail-section";
import RowActions, { type IRowAction } from "@/common/components/row-actions";
import { FADE_IN_CLASS } from "@/common/constants/motion";
import { type TMovementKind, movementLabels } from "@/modules/activities/utils/movements";

const SKELETON_ROWS = 2;

interface IMovementListProps {
  kind: TMovementKind;
  movements: IActivityExpenseResource[];
  isLoading: boolean;
  buildActions: (movement: IActivityExpenseResource) => IRowAction[];
  onCreate: () => void;
}

/** Los ingresos o los gastos de la actividad con su monto. */
export default function MovementList({
  kind,
  movements,
  isLoading,
  buildActions,
  onCreate,
}: IMovementListProps) {
  const labels = movementLabels[kind];
  return (
    <DetailSection
      title={labels.title}
      isBordered
      action={
        <Button type="button" size="sm" variant="outline" onClick={onCreate}>
          <Plus />
          Agregar
        </Button>
      }
    >
      {isLoading && movements.length === 0 ? (
        <div className="space-y-2">
          {Array.from({ length: SKELETON_ROWS }, (_, index) => (
            <Skeleton key={index} className="h-11 w-full rounded-md" />
          ))}
        </div>
      ) : movements.length === 0 ? (
        <p className="py-1 text-sm text-muted-foreground">{labels.empty}</p>
      ) : (
        <ul className={`-my-1 divide-y divide-border ${FADE_IN_CLASS}`}>
          {movements.map((movement) => (
            <li key={movement.id} className="flex items-center gap-3 py-2.5">
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-foreground">{movement.concept}</p>
                {movement.note && <p className="truncate text-sm text-muted-foreground">{movement.note}</p>}
              </div>
              <span className="shrink-0 font-semibold text-foreground tabular-nums">{formatSoles(movement.amount)}</span>
              <RowActions actions={buildActions(movement)} isBordered />
            </li>
          ))}
        </ul>
      )}
    </DetailSection>
  );
}
