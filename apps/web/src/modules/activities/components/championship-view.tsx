import { Button } from "@juveco/ui/components/button";
import { IconButton } from "@juveco/ui/components/icon-button";
import { cn } from "@juveco/ui/lib/utils";
import type { IActivityResource } from "@juveco/shared/activities";
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
import { useDeleteActivityTeam } from "@/modules/activities/hooks/use-delete-activity-team";
import { useGetActivityBalance } from "@/modules/activities/hooks/use-get-activity-balance";
import { useListActivityTeams } from "@/modules/activities/hooks/use-list-activity-teams";
import { collectionOf } from "@/modules/activities/utils/activity-items";
import { teamNumbersOf } from "@/modules/activities/utils/teams";
import { useListUsers } from "@/modules/users/hooks/use-list-users";

import ActivityMeta from "./activity-meta";
import ChampionshipKpis, { ChampionshipKpisSkeleton } from "./championship-kpis";
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

/**
 * Un campeonato (acordado 2026-11-19, diseño de Stitch corregido): encabezado con «Agregar
 * equipo», KPIs compactos (ingresos y egresos, saldo) y todos los equipos en una sola lista.
 * Cobrar va directo en la fila mientras falte; editar y eliminar, en el `⋯`. Los
 * tabs Partidos, Posiciones y Movimientos llegan con las fases 2 y 3.
 */
export default function ChampionshipView({ activity, currentUserId }: IChampionshipViewProps) {
  const ListActivityTeams = useListActivityTeams();
  const GetActivityBalance = useGetActivityBalance();
  const ListUsers = useListUsers();
  const CreateTeamPayment = useCreateTeamPayment();
  const DeleteActivityTeam = useDeleteActivityTeam();
  const showForm = useBoolean();

  const [editTarget, setEditTarget] = useState<IActivityTeamResource | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<IActivityTeamResource | null>(null);
  /* Por id y no el objeto: así el detalle y el pago ven el equipo al día tras cada cambio. */
  const [detailId, setDetailId] = useState<string | null>(null);
  const [payId, setPayId] = useState<string | null>(null);

  const loadAll = (signal?: AbortSignal) =>
    Promise.all([
      ListActivityTeams.handler(activity.id, signal),
      GetActivityBalance.handler(activity.id, signal),
      ListUsers.handler(signal),
    ]);

  useEffect(() => {
    const controller = new AbortController();
    loadAll(controller.signal);
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activity.id]);

  const { teams } = ListActivityTeams;
  const { balance } = GetActivityBalance;
  const isLoading = (ListActivityTeams.loading && teams.length === 0) || !balance;
  const isSyncing = ListActivityTeams.loading || GetActivityBalance.loading || ListUsers.loading;

  /*
    Lo cobrado sale de los equipos ya cargados, así cada pago lo actualiza sin volver a pedir
    nada; del balance solo se toman los gastos, que no cambian en esta página.
  */
  const collected = roundSoles(teams.reduce((sum, team) => sum + team.paidAmount, 0));
  const spending = balance ? roundSoles(balance.purchasedPrizes + balance.expenses) : 0;

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
              <TeamTable teams={[]} isLoading numbers={numbers} buildActions={buildActions} onOpen={() => undefined} />
              <TeamCardList teams={[]} isLoading numbers={numbers} buildActions={buildActions} onOpen={() => undefined} />
            </>
          }
        >
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
