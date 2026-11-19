import { Button } from "@juveco/ui/components/button";
import type { IActivityTeamPaymentResource, IActivityTeamResource } from "@juveco/shared/activity-teams";
import { formatSoles } from "@juveco/shared/money";
import { fullName } from "@juveco/shared/people";
import { CalendarDays, HandCoins, MessageSquareText, Tag, UserRound } from "lucide-react";
import { useEffect, useState } from "react";

import ConfirmModal from "@/common/components/confirm-modal";
import { DetailList, DetailRow, DetailSection } from "@/common/components/detail-section";
import InitialsAvatar, { avatarColorOf } from "@/common/components/initials-avatar";
import NeighborhoodBadge from "@/common/components/neighborhood-badge";
import RowActions, { type IRowAction } from "@/common/components/row-actions";
import SidePanel from "@/common/components/side-panel";
import { formatShortDate } from "@/common/utils/format-date";
import { useDeleteTeamPayment } from "@/modules/activities/hooks/use-delete-team-payment";
import { useListTeamPayments } from "@/modules/activities/hooks/use-list-team-payments";
import { collectionOf } from "@/modules/activities/utils/activity-items";
import { formatTeamNumber, playerCountLabel } from "@/modules/activities/utils/teams";

import CollectionBadge from "./collection-badge";
import PaymentList from "./payment-list";

/* En el detalle, editar y eliminar van directo como íconos, sin menú (como en las cartillas). */
const toInlineActions = (actions: IRowAction[]): IRowAction[] =>
  actions.filter((action) => action.label !== "Registrar pago").map((action) => ({ ...action, inline: true }));

interface ITeamDetailPanelProps {
  /** El equipo abierto; `null` cierra el panel. */
  team: IActivityTeamResource | null;
  /** Su número de inscripción. */
  number: number | undefined;
  /** Nombre del campeonato, para volver. */
  backLabel: string;
  /** Las mismas acciones del `⋯` de la fila. */
  buildActions: (team: IActivityTeamResource) => IRowAction[];
  onPay: (team: IActivityTeamResource) => void;
  /** Al eliminar un pago, el equipo queda con otro «pagado». */
  onTeamChanged: (team: IActivityTeamResource) => void;
  onClose: () => void;
}

/**
 * Detalle lateral de un equipo: los pagos de su inscripción, sus jugadores y sus datos. Un pago
 * mal puesto se elimina y se vuelve a registrar, igual que en las cartillas.
 */
export default function TeamDetailPanel({
  team,
  number,
  backLabel,
  buildActions,
  onPay,
  onTeamChanged,
  onClose,
}: ITeamDetailPanelProps) {
  const ListTeamPayments = useListTeamPayments();
  const DeleteTeamPayment = useDeleteTeamPayment();
  const [deleteTarget, setDeleteTarget] = useState<IActivityTeamPaymentResource | null>(null);

  /* El panel se queda con el último equipo mientras se anima al cerrarse. */
  const [shown, setShown] = useState<IActivityTeamResource | null>(team);
  useEffect(() => {
    if (team) {
      setShown(team);
    }
  }, [team]);
  const current = team ?? shown;

  /* Se vuelven a traer los pagos cuando cambia lo pagado. */
  useEffect(() => {
    if (!team) {
      return;
    }
    const controller = new AbortController();
    ListTeamPayments.handler(team.activityId, team.id, controller.signal);
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [team?.id, team?.paidAmount]);

  const confirmDeletePayment = async () => {
    if (!current || !deleteTarget) {
      return;
    }
    const change = await DeleteTeamPayment.handler(current, deleteTarget);
    if (change) {
      ListTeamPayments.onRemove(change.payment.id);
      onTeamChanged(change.item);
    }
    setDeleteTarget(null);
  };

  const { payments } = ListTeamPayments;
  /* Al abrir otro equipo no se muestran, ni por un instante, los pagos del anterior. */
  const isOtherTeamsPayments = payments.length > 0 && payments[0]?.teamId !== current?.id;
  const isLoadingPayments = ListTeamPayments.loading && (payments.length === 0 || isOtherTeamsPayments);

  return (
    <>
      <SidePanel
        open={team !== null}
        label={current ? current.name : "Detalle"}
        backLabel={backLabel}
        onClose={onClose}
        actions={current && <RowActions actions={toInlineActions(buildActions(current))} isBordered />}
      >
        {current && (
          <div className="space-y-4">
            <div>
              {number !== undefined && (
                <p className="font-mono text-sm font-semibold text-primary tabular-nums">
                  N.º {formatTeamNumber(number)}
                </p>
              )}
              <h2 className="font-heading text-xl font-bold wrap-anywhere text-foreground">{current.name}</h2>
            </div>

            <DetailSection
              title="Inscripción"
              isBordered
              action={
                collectionOf(current).pending > 0 && (
                  <Button type="button" size="sm" variant="outline" onClick={() => onPay(current)}>
                    <HandCoins />
                    Registrar pago
                  </Button>
                )
              }
            >
              <div className="flex items-center justify-between gap-2 pb-3">
                <p className="text-sm text-muted-foreground">
                  Pagado:{" "}
                  <span className="font-semibold text-foreground tabular-nums">{formatSoles(current.paidAmount)}</span>
                </p>
                <CollectionBadge item={current} label="Por cobrar" />
              </div>
              <PaymentList payments={payments} isLoading={isLoadingPayments} onDelete={setDeleteTarget} />
            </DetailSection>

            <DetailSection title={`Jugadores · ${playerCountLabel(current.players.length)}`} isBordered>
              {current.players.length === 0 ? (
                <p className="text-sm text-muted-foreground">Todavía no hay jugadores.</p>
              ) : (
                <ul className="divide-y divide-border">
                  {current.players.map((player) => {
                    const name = fullName(player);
                    return (
                      <li key={player.id} className="flex items-center gap-3 py-2">
                        <InitialsAvatar name={name} color={avatarColorOf(name)} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium text-foreground">
                            {name}
                            {player.id === current.delegate.id && (
                              <span className="font-normal text-muted-foreground"> · delegado</span>
                            )}
                          </p>
                        </div>
                        {player.neighborhood && <NeighborhoodBadge neighborhood={player.neighborhood} hasIcon={false} />}
                      </li>
                    );
                  })}
                </ul>
              )}
            </DetailSection>

            <DetailSection title="Datos" isBordered>
              <DetailList>
                <DetailRow icon={UserRound} label="Delegado">
                  {fullName(current.delegate)}
                </DetailRow>
                <DetailRow icon={Tag} label="Inscripción">
                  <span className="tabular-nums">{formatSoles(current.price)}</span>
                </DetailRow>
                <DetailRow icon={CalendarDays} label="Inscrito">
                  {formatShortDate(current.createdAt)}
                </DetailRow>
                <DetailRow icon={MessageSquareText} label="Nota">
                  {current.note}
                </DetailRow>
              </DetailList>
            </DetailSection>
          </div>
        )}
      </SidePanel>

      {/* Fuera del panel: su animación usa `transform` y recortaría una modal de adentro. */}
      <ConfirmModal
        open={deleteTarget !== null}
        title={`¿Eliminar el pago de ${deleteTarget ? formatSoles(deleteTarget.amount) : ""}?`}
        description="Vuelve a quedar por cobrar. Esto no se puede deshacer."
        confirmLabel="Eliminar"
        variant="destructive"
        loading={DeleteTeamPayment.loading}
        onConfirm={confirmDeletePayment}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}
