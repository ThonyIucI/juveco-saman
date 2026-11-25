import { IconButton } from "@juveco/ui/components/icon-button";
import { cn } from "@juveco/ui/lib/utils";
import { activityItemLabels } from "@juveco/shared/activities";
import type { IActivityExpenseResource } from "@juveco/shared/activity-expenses";
import type { IActivityPrizeResource } from "@juveco/shared/activity-prizes";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Pencil, RefreshCw, Trash2, Trophy } from "lucide-react";
import { useEffect, useState } from "react";

import ConfirmModal from "@/common/components/confirm-modal";
import Loadable from "@/common/components/loadable";
import PageBox from "@/common/components/page-box";
import PageContainer from "@/common/components/page-container";
import PageHeader from "@/common/components/page-header";
import type { IRowAction } from "@/common/components/row-actions";
import ActivityBalance from "@/modules/activities/components/activity-balance";
import ActivityKpis from "@/modules/activities/components/activity-kpis";
import ActivityMeta from "@/modules/activities/components/activity-meta";
import MovementFormModal from "@/modules/activities/components/movement-form-modal";
import MovementList from "@/modules/activities/components/movement-list";
import PrizeFormModal from "@/modules/activities/components/prize-form-modal";
import PrizeList from "@/modules/activities/components/prize-list";
import PrizeWinnerModal from "@/modules/activities/components/prize-winner-modal";
import { useDeleteActivityMovement } from "@/modules/activities/hooks/use-delete-activity-movement";
import { useDeleteActivityPrize } from "@/modules/activities/hooks/use-delete-activity-prize";
import { useGetActivity } from "@/modules/activities/hooks/use-get-activity";
import { useGetActivityBalance } from "@/modules/activities/hooks/use-get-activity-balance";
import { useGetActivitySummary } from "@/modules/activities/hooks/use-get-activity-summary";
import { useListActivityItems } from "@/modules/activities/hooks/use-list-activity-items";
import { useListActivityMovements } from "@/modules/activities/hooks/use-list-activity-movements";
import { useListActivityPrizes } from "@/modules/activities/hooks/use-list-activity-prizes";
import { useSetPrizeWinner } from "@/modules/activities/hooks/use-set-prize-winner";
import type { TMovementKind } from "@/modules/activities/utils/movements";
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
  | { kind: TMovementKind; movement: IActivityExpenseResource }
  | null;

/* Un ingreso o un gasto abierto en el formulario. */
type TMovementForm = { kind: TMovementKind; entry?: IActivityExpenseResource } | null;

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
  const ListActivityIncomes = useListActivityMovements("income");
  const ListActivityExpenses = useListActivityMovements("expense");
  const ListActivityItems = useListActivityItems();
  const ListUsers = useListUsers();
  const DeleteActivityPrize = useDeleteActivityPrize();
  const DeleteActivityIncome = useDeleteActivityMovement("income");
  const DeleteActivityExpense = useDeleteActivityMovement("expense");
  const SetPrizeWinner = useSetPrizeWinner();

  const [prizeForm, setPrizeForm] = useState<TFormTarget<IActivityPrizeResource>>(null);
  const [movementForm, setMovementForm] = useState<TMovementForm>(null);
  const [deleteTarget, setDeleteTarget] = useState<TDeleteTarget>(null);
  /* Por id: así el modal ve el premio al día tras marcar o quitar el ganador. */
  const [winnerPrizeId, setWinnerPrizeId] = useState<string | null>(null);

  const movementListOf = (kind: TMovementKind) => (kind === "income" ? ListActivityIncomes : ListActivityExpenses);

  /* Las personas también: el donante se elige de ahí. */
  const loadAll = (signal?: AbortSignal) =>
    Promise.all([
      GetActivity.handler(activityId, signal),
      GetActivitySummary.handler(activityId, signal),
      GetActivityBalance.handler(activityId, signal),
      ListActivityPrizes.handler(activityId, signal),
      ListActivityIncomes.handler(activityId, signal),
      ListActivityExpenses.handler(activityId, signal),
      /* Las cartillas, para buscar la ganadora de cada premio. */
      ListActivityItems.handler(activityId, signal),
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
  /* Solo la primera carga: al sincronizar, los datos anteriores siguen a la vista. */
  const isLoadingSummary = !activity || !GetActivitySummary.summary || !GetActivityBalance.balance;
  const isSyncing =
    GetActivity.loading ||
    GetActivitySummary.loading ||
    GetActivityBalance.loading ||
    ListActivityPrizes.loading ||
    ListActivityIncomes.loading ||
    ListActivityExpenses.loading;

  const handlePrizeSaved = (prize: IActivityPrizeResource) => {
    ListActivityPrizes.onUpsert(prize);
    refreshBalance();
  };

  const handleMovementSaved = (kind: TMovementKind, movement: IActivityExpenseResource) => {
    movementListOf(kind).onUpsert(movement);
    refreshBalance();
  };

  const pickWinner = async (prize: IActivityPrizeResource, itemId: string | null) => {
    const updated = await SetPrizeWinner.handler(prize, itemId);
    if (updated) {
      ListActivityPrizes.onUpsert(updated);
    }
    return updated !== null;
  };

  /* Marcar al ganador va directo: es lo que se hace en vivo el día del sorteo. */
  const buildPrizeActions = (prize: IActivityPrizeResource): IRowAction[] => [
    { icon: Trophy, label: "Ganador", inline: true, onClick: () => setWinnerPrizeId(prize.id) },
    { icon: Pencil, label: "Editar", onClick: () => setPrizeForm({ entry: prize }) },
    {
      icon: Trash2,
      label: "Eliminar",
      variant: "destructive",
      onClick: () => setDeleteTarget({ kind: "prize", prize }),
    },
  ];

  const buildMovementActions =
    (kind: TMovementKind) =>
    (movement: IActivityExpenseResource): IRowAction[] => [
      { icon: Pencil, label: "Editar", onClick: () => setMovementForm({ kind, entry: movement }) },
      {
        icon: Trash2,
        label: "Eliminar",
        variant: "destructive",
        onClick: () => setDeleteTarget({ kind, movement }),
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
    if (deleteTarget && deleteTarget.kind !== "prize") {
      const remove = deleteTarget.kind === "income" ? DeleteActivityIncome : DeleteActivityExpense;
      const deleted = await remove.handler(deleteTarget.movement);
      if (deleted) {
        movementListOf(deleteTarget.kind).onRemove(deleted.id);
        refreshBalance();
      }
    }
    setDeleteTarget(null);
  };

  const deleteName =
    deleteTarget?.kind === "prize"
      ? `el premio «${deleteTarget.prize.name}»`
      : deleteTarget
        ? `el ${deleteTarget.kind === "income" ? "ingreso" : "gasto"} «${deleteTarget.movement.concept}»`
        : "";

  const syncButton = (
    <IconButton label="Sincronizar" tone="muted" onClick={() => loadAll()}>
      <RefreshCw className={cn(isSyncing && "animate-spin motion-reduce:animate-none")} />
    </IconButton>
  );

  return (
    <PageContainer>
      {/* Encabezado y cuerpo en cajas blancas sobre el fondo gris, como cartillas (Thony, 2026-11-09). */}
      <PageBox>
        {/* Volver: solo el chevron a la izquierda del título, en celular y escritorio (Thony, 2026-11-11). */}
        <PageHeader
          title={activity ? `Resumen · ${activity.name}` : "Resumen"}
          back={{
            label: `Volver a ${activity ? activityItemLabels[activity.type].plural : "la actividad"}`,
            onClick: () => navigate({ to: "/actividades/$activityId", params: { activityId } }),
          }}
          titleAction={syncButton}
          subtitle={activity ? <ActivityMeta activity={activity} /> : undefined}
          isLoadingSubtitle={!activity}
        />
      </PageBox>

      <PageBox isFill>
      {/*
        Esperan los KPIs y el balance, que son lo primero que se ve; premios y gastos llegan en
        la misma tanda y, si tardan, muestran su propio esqueleto.
      */}
      <Loadable
        isLoading={isLoadingSummary}
        className="space-y-4"
        skeleton={
          <div className="space-y-4">
            <ActivityKpis summary={null} balance={null} />
            <div className="grid items-start gap-4 lg:grid-cols-2">
              <ActivityBalance balance={null} />
              <div className="space-y-4">
                <PrizeList prizes={[]} isLoading buildActions={buildPrizeActions} onCreate={() => undefined} />
                <MovementList
                  kind="expense"
                  movements={[]}
                  isLoading
                  buildActions={buildMovementActions("expense")}
                  onCreate={() => undefined}
                />
              </div>
            </div>
          </div>
        }
      >
      <ActivityKpis summary={GetActivitySummary.summary} balance={GetActivityBalance.balance} />

      <div className="grid items-start gap-4 lg:grid-cols-2">
        <ActivityBalance balance={GetActivityBalance.balance} />

        <div className="space-y-4">
          <PrizeList
            prizes={ListActivityPrizes.prizes}
            isLoading={ListActivityPrizes.loading}
            buildActions={buildPrizeActions}
            onCreate={() => setPrizeForm({})}
          />
          <MovementList
            kind="income"
            movements={ListActivityIncomes.movements}
            isLoading={ListActivityIncomes.loading}
            buildActions={buildMovementActions("income")}
            onCreate={() => setMovementForm({ kind: "income" })}
          />
          <MovementList
            kind="expense"
            movements={ListActivityExpenses.movements}
            isLoading={ListActivityExpenses.loading}
            buildActions={buildMovementActions("expense")}
            onCreate={() => setMovementForm({ kind: "expense" })}
          />
        </div>
      </div>
      </Loadable>
      </PageBox>

      <PrizeFormModal
        open={prizeForm !== null}
        activityId={activityId}
        prize={prizeForm?.entry}
        users={ListUsers.users}
        onUserCreated={ListUsers.onUpsert}
        onSaved={handlePrizeSaved}
        onClose={() => setPrizeForm(null)}
      />

      <MovementFormModal
        open={movementForm !== null}
        kind={movementForm?.kind ?? "expense"}
        activityId={activityId}
        movement={movementForm?.entry}
        onSaved={(movement) => handleMovementSaved(movementForm?.kind ?? "expense", movement)}
        onClose={() => setMovementForm(null)}
      />

      <PrizeWinnerModal
        prize={ListActivityPrizes.prizes.find((prize) => prize.id === winnerPrizeId) ?? null}
        items={ListActivityItems.items}
        isSaving={SetPrizeWinner.loading}
        onPick={pickWinner}
        onClose={() => setWinnerPrizeId(null)}
      />

      <ConfirmModal
        open={deleteTarget !== null}
        title={`¿Eliminar ${deleteName}?`}
        description="Se quita del balance. Esto no se puede deshacer."
        confirmLabel="Eliminar"
        variant="destructive"
        loading={DeleteActivityPrize.loading || DeleteActivityIncome.loading || DeleteActivityExpense.loading}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </PageContainer>
  );
}

