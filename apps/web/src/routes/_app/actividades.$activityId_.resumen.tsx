import { Button } from "@juveco/ui/components/button";
import { IconButton } from "@juveco/ui/components/icon-button";
import { cn } from "@juveco/ui/lib/utils";
import { activityItemLabels } from "@juveco/shared/activities";
import type { IActivityExpenseResource } from "@juveco/shared/activity-expenses";
import type { IActivityPrizeResource } from "@juveco/shared/activity-prizes";
import { formatSoles } from "@juveco/shared/money";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ChevronLeft, Pencil, RefreshCw, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

import ConfirmModal from "@/common/components/confirm-modal";
import PageHeader from "@/common/components/page-header";
import type { IRowAction } from "@/common/components/row-actions";
import { formatShortDate } from "@/common/utils/format-date";
import ActivityBalance from "@/modules/activities/components/activity-balance";
import ActivityKpis from "@/modules/activities/components/activity-kpis";
import ExpenseFormModal from "@/modules/activities/components/expense-form-modal";
import ExpenseList from "@/modules/activities/components/expense-list";
import PrizeFormModal from "@/modules/activities/components/prize-form-modal";
import PrizeList from "@/modules/activities/components/prize-list";
import { useDeleteActivityExpense } from "@/modules/activities/hooks/use-delete-activity-expense";
import { useDeleteActivityPrize } from "@/modules/activities/hooks/use-delete-activity-prize";
import { useGetActivity } from "@/modules/activities/hooks/use-get-activity";
import { useGetActivityBalance } from "@/modules/activities/hooks/use-get-activity-balance";
import { useGetActivitySummary } from "@/modules/activities/hooks/use-get-activity-summary";
import { useListActivityExpenses } from "@/modules/activities/hooks/use-list-activity-expenses";
import { useListActivityPrizes } from "@/modules/activities/hooks/use-list-activity-prizes";
import { useListUsers } from "@/modules/users/hooks/use-list-users";

/*
  `$activityId_`: la página no va anidada dentro de la de cartillas (esa no tiene `<Outlet>`),
  pero la URL sí: /actividades/:id/resumen.
*/
export const Route = createFileRoute("/_app/actividades/$activityId_/resumen")({
  component: ActivitySummaryPage,
});

/* Un formulario abierto: nuevo (sin registro) o edición. */
type TFormTarget<TEntry> = { entry?: TEntry } | null;

type TDeleteTarget =
  | { kind: "prize"; prize: IActivityPrizeResource }
  | { kind: "expense"; expense: IActivityExpenseResource }
  | null;

/**
 * Resumen de una actividad (acordado 2026-11-07), todo en una página: KPIs de las cartillas,
 * balance (ingresos − premios comprados − gastos), premios y gastos. Se llega desde el botón
 * «Resumen» de la página de cartillas.
 */
function ActivitySummaryPage() {
  const { activityId } = Route.useParams();
  const navigate = useNavigate();
  const GetActivity = useGetActivity();
  const GetActivitySummary = useGetActivitySummary();
  const GetActivityBalance = useGetActivityBalance();
  const ListActivityPrizes = useListActivityPrizes();
  const ListActivityExpenses = useListActivityExpenses();
  const ListUsers = useListUsers();
  const DeleteActivityPrize = useDeleteActivityPrize();
  const DeleteActivityExpense = useDeleteActivityExpense();

  const [prizeForm, setPrizeForm] = useState<TFormTarget<IActivityPrizeResource>>(null);
  const [expenseForm, setExpenseForm] = useState<TFormTarget<IActivityExpenseResource>>(null);
  const [deleteTarget, setDeleteTarget] = useState<TDeleteTarget>(null);

  /* Las personas también: el donante se elige de ahí. */
  const loadAll = (signal?: AbortSignal) =>
    Promise.all([
      GetActivity.handler(activityId, signal),
      GetActivitySummary.handler(activityId, signal),
      GetActivityBalance.handler(activityId, signal),
      ListActivityPrizes.handler(activityId, signal),
      ListActivityExpenses.handler(activityId, signal),
      ListUsers.handler(signal),
    ]);

  useEffect(() => {
    const controller = new AbortController();
    loadAll(controller.signal);
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activityId]);

  /* Cada premio o gasto cambia el balance: se vuelve a pedir. */
  const refreshBalance = () => GetActivityBalance.handler(activityId);

  const { activity } = GetActivity;
  const isSyncing =
    GetActivity.loading ||
    GetActivitySummary.loading ||
    GetActivityBalance.loading ||
    ListActivityPrizes.loading ||
    ListActivityExpenses.loading;

  const handlePrizeSaved = (prize: IActivityPrizeResource) => {
    ListActivityPrizes.onUpsert(prize);
    refreshBalance();
  };

  const handleExpenseSaved = (expense: IActivityExpenseResource) => {
    ListActivityExpenses.onUpsert(expense);
    refreshBalance();
  };

  const buildPrizeActions = (prize: IActivityPrizeResource): IRowAction[] => [
    { icon: Pencil, label: "Editar", onClick: () => setPrizeForm({ entry: prize }) },
    {
      icon: Trash2,
      label: "Eliminar",
      variant: "destructive",
      onClick: () => setDeleteTarget({ kind: "prize", prize }),
    },
  ];

  const buildExpenseActions = (expense: IActivityExpenseResource): IRowAction[] => [
    { icon: Pencil, label: "Editar", onClick: () => setExpenseForm({ entry: expense }) },
    {
      icon: Trash2,
      label: "Eliminar",
      variant: "destructive",
      onClick: () => setDeleteTarget({ kind: "expense", expense }),
    },
  ];

  const confirmDelete = async () => {
    if (deleteTarget?.kind === "prize") {
      const deleted = await DeleteActivityPrize.handler(deleteTarget.prize);
      if (deleted) {
        ListActivityPrizes.onRemove(deleted.id);
        refreshBalance();
      }
    }
    if (deleteTarget?.kind === "expense") {
      const deleted = await DeleteActivityExpense.handler(deleteTarget.expense);
      if (deleted) {
        ListActivityExpenses.onRemove(deleted.id);
        refreshBalance();
      }
    }
    setDeleteTarget(null);
  };

  const deleteName =
    deleteTarget?.kind === "prize"
      ? `el premio «${deleteTarget.prize.name}»`
      : deleteTarget?.kind === "expense"
        ? `el gasto «${deleteTarget.expense.concept}»`
        : "";

  const syncButton = (
    <IconButton label="Sincronizar" tone="muted" onClick={() => loadAll()}>
      <RefreshCw className={cn(isSyncing && "animate-spin motion-reduce:animate-none")} />
    </IconButton>
  );

  return (
    <div className="mx-auto w-full max-w-7xl space-y-4 px-4 py-6">
      <div className="space-y-2">
        <Button
          variant="ghost"
          className="-ml-2 gap-1 px-2 font-heading text-sm"
          onClick={() => navigate({ to: "/actividades/$activityId", params: { activityId } })}
        >
          <ChevronLeft className="size-5" />
          {activity ? capitalize(activityItemLabels[activity.type].plural) : "Volver"}
        </Button>

        <PageHeader
          title={activity ? `Resumen · ${activity.name}` : "Resumen"}
          titleAction={syncButton}
          subtitle={
            activity ? `${formatShortDate(activity.eventDate)} · ${formatSoles(activity.defaultPrice)}` : undefined
          }
          isLoadingSubtitle={!activity}
        />
      </div>

      {activity && <ActivityKpis activityType={activity.type} summary={GetActivitySummary.summary} />}

      <div className="grid items-start gap-4 lg:grid-cols-2">
        <ActivityBalance balance={GetActivityBalance.balance} />

        <div className="space-y-4">
          <PrizeList
            prizes={ListActivityPrizes.prizes}
            isLoading={ListActivityPrizes.loading}
            buildActions={buildPrizeActions}
            onCreate={() => setPrizeForm({})}
          />
          <ExpenseList
            expenses={ListActivityExpenses.expenses}
            isLoading={ListActivityExpenses.loading}
            buildActions={buildExpenseActions}
            onCreate={() => setExpenseForm({})}
          />
        </div>
      </div>

      <PrizeFormModal
        open={prizeForm !== null}
        activityId={activityId}
        prize={prizeForm?.entry}
        users={ListUsers.users}
        onUserCreated={ListUsers.onUpsert}
        onSaved={handlePrizeSaved}
        onClose={() => setPrizeForm(null)}
      />

      <ExpenseFormModal
        open={expenseForm !== null}
        activityId={activityId}
        expense={expenseForm?.entry}
        onSaved={handleExpenseSaved}
        onClose={() => setExpenseForm(null)}
      />

      <ConfirmModal
        open={deleteTarget !== null}
        title={`¿Eliminar ${deleteName}?`}
        description="Se quita del balance. Esto no se puede deshacer."
        confirmLabel="Eliminar"
        variant="destructive"
        loading={DeleteActivityPrize.loading || DeleteActivityExpense.loading}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

const capitalize = (text: string): string => text.charAt(0).toUpperCase() + text.slice(1);
