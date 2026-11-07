import { Button } from "@juveco/ui/components/button";
import { Skeleton } from "@juveco/ui/components/skeleton";
import type { IActivityExpenseResource } from "@juveco/shared/activity-expenses";
import { formatSoles } from "@juveco/shared/money";
import { Plus } from "lucide-react";

import { DetailSection } from "@/common/components/detail-section";
import RowActions, { type IRowAction } from "@/common/components/row-actions";

const SKELETON_ROWS = 2;

interface IExpenseListProps {
  expenses: IActivityExpenseResource[];
  isLoading: boolean;
  buildActions: (expense: IActivityExpenseResource) => IRowAction[];
  onCreate: () => void;
}

/** Los gastos de la actividad (impresión de cartillas, alquileres…) con su monto. */
export default function ExpenseList({ expenses, isLoading, buildActions, onCreate }: IExpenseListProps) {
  return (
    <DetailSection
      title="Gastos"
      isBordered
      action={
        <Button type="button" size="sm" variant="outline" onClick={onCreate}>
          <Plus />
          Agregar
        </Button>
      }
    >
      {isLoading && expenses.length === 0 ? (
        <div className="space-y-2">
          {Array.from({ length: SKELETON_ROWS }, (_, index) => (
            <Skeleton key={index} className="h-11 w-full rounded-md" />
          ))}
        </div>
      ) : expenses.length === 0 ? (
        <p className="py-1 text-sm text-muted-foreground">Todavía no hay gastos.</p>
      ) : (
        <ul className="-my-1 divide-y divide-border">
          {expenses.map((expense) => (
            <li key={expense.id} className="flex items-center gap-3 py-2.5">
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-foreground">{expense.concept}</p>
                {expense.note && <p className="truncate text-sm text-muted-foreground">{expense.note}</p>}
              </div>
              <span className="shrink-0 font-semibold text-foreground tabular-nums">{formatSoles(expense.amount)}</span>
              <RowActions actions={buildActions(expense)} isBordered />
            </li>
          ))}
        </ul>
      )}
    </DetailSection>
  );
}
