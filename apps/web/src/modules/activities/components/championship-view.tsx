import { Button } from "@juveco/ui/components/button";
import { IconButton } from "@juveco/ui/components/icon-button";
import { cn } from "@juveco/ui/lib/utils";
import type { IActivityResource } from "@juveco/shared/activities";
import type { IActivityExpenseResource } from "@juveco/shared/activity-expenses";
import type { IActivityTeamResource } from "@juveco/shared/activity-teams";
import { roundSoles } from "@juveco/shared/money";
import { HandCoins, Pencil, Plus, RefreshCw, Shield, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

import ConfirmModal from "@/common/components/confirm-modal";
import EmptyState from "@/common/components/empty-state";
import FloatingActionButton from "@/common/components/floating-action-button";
import Loadable from "@/common/components/loadable";
import PageBox from "@/common/components/page-box";
import PageContainer from "@/common/components/page-container";
import PageHeader from "@/common/components/page-header";
import type { IRowAction } from "@/common/components/row-actions";
import { useBoolean } from "@/common/hooks/use-boolean";
import { useCreateTeamPayment } from "@/modules/activities/hooks/use-create-team-payment";
import { useDeleteActivityMovement } from "@/modules/activities/hooks/use-delete-activity-movement";
import { useDeleteActivityTeam } from "@/modules/activities/hooks/use-delete-activity-team";
import { useListActivityMovements } from "@/modules/activities/hooks/use-list-activity-movements";
import { useListActivityTeams } from "@/modules/activities/hooks/use-list-activity-teams";
import { collectionOf } from "@/modules/activities/utils/activity-items";
import type { TMovementKind } from "@/modules/activities/utils/movements";
import { teamNumbersOf } from "@/modules/activities/utils/teams";
import { useListUsers } from "@/modules/users/hooks/use-list-users";

import ActivityMeta from "./activity-meta";
import ChampionshipKpis, { ChampionshipKpisSkeleton } from "./championship-kpis";
import MovementFormModal from "./movement-form-modal";
import MovementList from "./movement-list";
import PaymentFormModal from "./payment-form-modal";
import TeamCardList from "./team-card-list";
import TeamDetailPanel from "./team-detail-panel";
import TeamFormModal from "./team-form-modal";
import TeamTable from "./team-table";

interface IChampionshipViewProps {
  activity: IActivityResource;
  /** Quien tiene la sesión: viene puesto en «Cobrado por». */
  currentUserId: string;
}

/* Un ingreso o un gasto abierto en el formulario, o a punto de eliminarse. */
type TMovementTarget = { kind: TMovementKind; entry?: IActivityExpenseResource } | null;

const sumAmounts = (movements: IActivityExpenseResource[]) =>
  roundSoles(movements.reduce((sum, movement) => sum + movement.amount, 0));

/**
 * Un campeonato (acordado 2026-11-19, diseño de Stitch corregido): encabezado con «Agregar
 * equipo», KPIs compactos (ingresos y egresos, saldo), los ingresos y gastos, y todos los
 * equipos en una sola lista.
 *
 * Lo que entra al balance de la Chocolatada son los ingresos y gastos (Thony, 2026-11-25): lo
 * cobrado a cada equipo queda solo como control de la inscripción y no suma al balance.
 */
export default function ChampionshipView({ activity, currentUserId }: IChampionshipViewProps) {
  const ListActivityTeams = useListActivityTeams();
  const ListActivityIncomes = useListActivityMovements("income");
  const ListActivityExpenses = useListActivityMovements("expense");
  const DeleteActivityIncome = useDeleteActivityMovement("income");
  const DeleteActivityExpense = useDeleteActivityMovement("expense");
  const ListUsers = useListUsers();
  const CreateTeamPayment = useCreateTeamPayment();
  const DeleteActivityTeam = useDeleteActivityTeam();
  const showForm = useBoolean();

  const [editTarget, setEditTarget] = useState<IActivityTeamResource | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<IActivityTeamResource | null>(null);
  /* Por id y no el objeto: así el detalle y el pago ven el equipo al día tras cada cambio. */
  const [detailId, setDetailId] = useState<string | null>(null);
  const [payId, setPayId] = useState<string | null>(null);
  const [movementForm, setMovementForm] = useState<TMovementTarget>(null);
  const [movementToDelete, setMovementToDelete] = useState<TMovementTarget>(null);

  const movementListOf = (kind: TMovementKind) => (kind === "income" ? ListActivityIncomes : ListActivityExpenses);

  const loadAll = (signal?: AbortSignal) =>
    Promise.all([
      ListActivityTeams.handler(activity.id, signal),
      ListActivityIncomes.handler(activity.id, signal),
      ListActivityExpenses.handler(activity.id, signal),
      ListUsers.handler(signal),
    ]);

  useEffect(() => {
    const controller = new AbortController();
    loadAll(controller.signal);
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activity.id]);

  const { teams } = ListActivityTeams;
  const incomes = ListActivityIncomes.movements;
  const expenses = ListActivityExpenses.movements;
  const isLoading =
    (ListActivityTeams.loading && teams.length === 0) ||
    (ListActivityIncomes.loading && incomes.length === 0) ||
    (ListActivityExpenses.loading && expenses.length === 0);
  const isSyncing =
    ListActivityTeams.loading || ListActivityIncomes.loading || ListActivityExpenses.loading || ListUsers.loading;

  /* Salen de las listas ya cargadas: cada ingreso o gasto los actualiza sin volver a pedir. */
  const collected = sumAmounts(incomes);
  const spending = sumAmounts(expenses);

  const numbers = teamNumbersOf(teams);

  const detailTeam = teams.find((team) => team.id === detailId) ?? null;
  const payTeam = teams.find((team) => team.id === payId) ?? null;

  const openCreate = () => {
    setEditTarget(undefined);
    showForm.on();
  };

  const openEdit = (team: IActivityTeamResource) => {
    setEditTarget(team);
    showForm.on();
  };

  const confirmDelete = async () => {
    if (!deleteTarget) {
      return;
    }
    const deleted = await DeleteActivityTeam.handler(deleteTarget);
    if (deleted) {
      ListActivityTeams.onRemove(deleted.id);
      setDetailId(null);
    }
    setDeleteTarget(null);
  };

  const confirmDeleteMovement = async () => {
    if (!movementToDelete?.entry) {
      return;
    }
    const remove = movementToDelete.kind === "income" ? DeleteActivityIncome : DeleteActivityExpense;
    const deleted = await remove.handler(movementToDelete.entry);
    if (deleted) {
      movementListOf(movementToDelete.kind).onRemove(deleted.id);
    }
    setMovementToDelete(null);
  };

  const buildMovementActions =
    (kind: TMovementKind) =>
    (movement: IActivityExpenseResource): IRowAction[] => [
      { icon: Pencil, label: "Editar", onClick: () => setMovementForm({ kind, entry: movement }) },
      {
        icon: Trash2,
        label: "Eliminar",
        variant: "destructive",
        onClick: () => setMovementToDelete({ kind, entry: movement }),
      },
    ];

  const movementLists = (isSkeleton: boolean) => (
    <div className="grid items-start gap-4 lg:grid-cols-2">
      {(["income", "expense"] as const).map((kind) => (
        <MovementList
          key={kind}
          kind={kind}
          movements={isSkeleton ? [] : movementListOf(kind).movements}
          isLoading={isSkeleton}
          buildActions={buildMovementActions(kind)}
          onCreate={() => setMovementForm({ kind })}
        />
      ))}
    </div>
  );

  /* Mientras falte cobrar, cobrar va directo; editar y eliminar, en el `⋯`. */
  const buildActions = (team: IActivityTeamResource): IRowAction[] => [
    ...(collectionOf(team).pending > 0
      ? [{ icon: HandCoins, label: "Registrar pago", inline: true, onClick: () => setPayId(team.id) }]
      : []),
    { icon: Pencil, label: "Editar", onClick: () => openEdit(team) },
    { icon: Trash2, label: "Eliminar", variant: "destructive", onClick: () => setDeleteTarget(team) },
  ];

  const syncButton = (
    <IconButton label="Sincronizar" tone="muted" onClick={() => loadAll()}>
      <RefreshCw className={cn(isSyncing && "animate-spin motion-reduce:animate-none")} />
    </IconButton>
  );

  return (
    <PageContainer>
      <PageBox>
        <div className="space-y-4">
          <PageHeader
            title={activity.name}
            titleAction={syncButton}
            subtitle={<ActivityMeta activity={activity} />}
            action={
              <Button type="button" size="lg" className="hidden md:inline-flex" onClick={openCreate}>
                <Plus />
                Agregar equipo
              </Button>
            }
          />
          <Loadable isLoading={isLoading} skeleton={<ChampionshipKpisSkeleton />}>
            <ChampionshipKpis income={collected} spending={spending} />
          </Loadable>
        </div>
      </PageBox>

      <PageBox isFill>
        <Loadable
          isLoading={isLoading}
          className="space-y-4"
          skeleton={
            <>
              {movementLists(true)}
              <TeamTable teams={[]} isLoading numbers={numbers} buildActions={buildActions} onOpen={() => undefined} />
              <TeamCardList teams={[]} isLoading numbers={numbers} buildActions={buildActions} onOpen={() => undefined} />
            </>
          }
        >
          {movementLists(false)}
          {teams.length === 0 ? (
            <EmptyState
              icon={Shield}
              title="Todavía no hay equipos"
              description="Inscribe cada equipo con su delegado y sus jugadores."
              action={
                <Button type="button" variant="link" onClick={openCreate}>
                  Agregar el primero
                </Button>
              }
            />
          ) : (
            /* Son pocos equipos (Thony, 2026-11-19): todos juntos, sin tabs de pago. */
            <div>
              <TeamTable
                teams={teams}
                isLoading={false}
                numbers={numbers}
                buildActions={buildActions}
                onOpen={(team) => setDetailId(team.id)}
              />
              <TeamCardList
                teams={teams}
                isLoading={false}
                numbers={numbers}
                buildActions={buildActions}
                onOpen={(team) => setDetailId(team.id)}
              />
            </div>
          )}
        </Loadable>
      </PageBox>

      <FloatingActionButton label="Agregar equipo" icon={Plus} onClick={openCreate} />

      <TeamFormModal
        open={showForm.active}
        activity={activity}
        team={editTarget}
        teams={teams}
        users={ListUsers.users}
        onUserCreated={ListUsers.onUpsert}
        onSaved={ListActivityTeams.onUpsert}
        onClose={showForm.off}
      />

      <TeamDetailPanel
        team={detailTeam}
        number={detailTeam ? numbers.get(detailTeam.id) : undefined}
        backLabel={activity.name}
        buildActions={buildActions}
        onPay={(team) => setPayId(team.id)}
        onTeamChanged={ListActivityTeams.onUpsert}
        onClose={() => setDetailId(null)}
      />

      <PaymentFormModal
        open={payTeam !== null}
        subtitle={payTeam ? `${payTeam.name} · inscripción` : undefined}
        pending={payTeam ? collectionOf(payTeam).pending : 0}
        currentUserId={currentUserId}
        users={ListUsers.users}
        onSubmit={async (payload) => {
          if (!payTeam) {
            return false;
          }
          const change = await CreateTeamPayment.handler(payTeam, payload);
          if (change) {
            ListActivityTeams.onUpsert(change.item);
          }
          return change !== null;
        }}
        onClose={() => setPayId(null)}
      />

      <MovementFormModal
        open={movementForm !== null}
        kind={movementForm?.kind ?? "income"}
        activityId={activity.id}
        movement={movementForm?.entry}
        onSaved={(movement) => movementListOf(movementForm?.kind ?? "income").onUpsert(movement)}
        onClose={() => setMovementForm(null)}
      />

      <ConfirmModal
        open={movementToDelete !== null}
        title={`¿Eliminar el ${movementToDelete?.kind === "income" ? "ingreso" : "gasto"} «${movementToDelete?.entry?.concept ?? ""}»?`}
        description="Se quita del balance de la Chocolatada. Esto no se puede deshacer."
        confirmLabel="Eliminar"
        variant="destructive"
        loading={DeleteActivityIncome.loading || DeleteActivityExpense.loading}
        onConfirm={confirmDeleteMovement}
        onCancel={() => setMovementToDelete(null)}
      />

      <ConfirmModal
        open={deleteTarget !== null}
        title={`¿Eliminar «${deleteTarget?.name ?? ""}»?`}
        description={`Se borra de ${activity.name} con su lista de jugadores. Esto no se puede deshacer.`}
        confirmLabel="Eliminar"
        variant="destructive"
        loading={DeleteActivityTeam.loading}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </PageContainer>
  );
}
