import { Button } from "@juveco/ui/components/button";
import { IconButton } from "@juveco/ui/components/icon-button";
import { Skeleton } from "@juveco/ui/components/skeleton";
import {
  EPaymentMethod,
  type IActivityItemPaymentResource,
  type IPaymentChange,
  type TPaymentMethod,
  paymentMethodLabels,
} from "@juveco/shared/activity-item-payments";
import type { IActivityItemResource } from "@juveco/shared/activity-items";
import { formatSoles } from "@juveco/shared/money";
import { fullName } from "@juveco/shared/people";
import {
  Banknote,
  CalendarDays,
  HandCoins,
  type LucideIcon,
  MapPin,
  MessageSquareText,
  Smartphone,
  Tag,
  Trash2,
  UserRound,
} from "lucide-react";
import { useEffect, useState } from "react";

import ConfirmModal from "@/common/components/confirm-modal";
import { DetailList, DetailRow, DetailSection } from "@/common/components/detail-section";
import NeighborhoodBadge from "@/common/components/neighborhood-badge";
import RowActions, { type IRowAction } from "@/common/components/row-actions";
import SidePanel from "@/common/components/side-panel";
import { formatShortDate } from "@/common/utils/format-date";
import { useDeleteItemPayment } from "@/modules/activities/hooks/use-delete-item-payment";
import { useListItemPayments } from "@/modules/activities/hooks/use-list-item-payments";
import { collectionOf } from "@/modules/activities/utils/activity-items";

import CollectionBadge from "./collection-badge";

const METHOD_ICON: Record<TPaymentMethod, LucideIcon> = {
  [EPaymentMethod.YAPE]: Smartphone,
  [EPaymentMethod.CASH]: Banknote,
};

interface IActivityItemDetailPanelProps {
  /** El ítem abierto; `null` cierra el panel. */
  item: IActivityItemResource | null;
  /** Nombre de la actividad, para volver («Bingo II - 2026»). */
  backLabel: string;
  /** Las mismas acciones del `⋯` de la card. */
  buildActions: (item: IActivityItemResource) => IRowAction[];
  onPay: (item: IActivityItemResource) => void;
  /** Al eliminar un pago, el ítem queda con otro «pagado». */
  onItemChanged: (item: IActivityItemResource) => void;
  onClose: () => void;
}

/**
 * Detalle lateral de lo vendido (en un bingo, una cartilla): sus datos y sus pagos, con
 * «Registrar pago» mientras falte cobrar. Un pago mal puesto se elimina y se vuelve a registrar.
 */
export default function ActivityItemDetailPanel({
  item,
  backLabel,
  buildActions,
  onPay,
  onItemChanged,
  onClose,
}: IActivityItemDetailPanelProps) {
  const ListItemPayments = useListItemPayments();
  const DeleteItemPayment = useDeleteItemPayment();
  const [deleteTarget, setDeleteTarget] = useState<IActivityItemPaymentResource | null>(null);

  /* El panel se queda con el último ítem mientras se anima al cerrarse. */
  const [shown, setShown] = useState<IActivityItemResource | null>(item);
  useEffect(() => {
    if (item) {
      setShown(item);
    }
  }, [item]);
  const current = item ?? shown;

  /* Se vuelven a traer los pagos cuando cambia lo pagado (un pago nuevo desde la card o desde acá). */
  useEffect(() => {
    if (!item) {
      return;
    }
    const controller = new AbortController();
    ListItemPayments.handler(item.activityId, item.id, controller.signal);
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item?.id, item?.paidAmount]);

  const confirmDeletePayment = async () => {
    if (!current || !deleteTarget) {
      return;
    }
    const change: IPaymentChange<IActivityItemResource> | null = await DeleteItemPayment.handler(
      current,
      deleteTarget,
    );
    if (change) {
      ListItemPayments.onRemove(change.payment.id);
      onItemChanged(change.item);
    }
    setDeleteTarget(null);
  };

  const collection = current ? collectionOf(current) : null;
  const { payments } = ListItemPayments;
  /* Al abrir otro ítem no se muestran, ni por un instante, los pagos del anterior. */
  const isOtherItemsPayments = payments.length > 0 && payments[0]?.itemId !== current?.id;
  const isLoadingPayments = ListItemPayments.loading && (payments.length === 0 || isOtherItemsPayments);

  return (
    <>
    <SidePanel
      open={item !== null}
      label={current ? `Serie ${current.serial}` : "Detalle"}
      backLabel={backLabel}
      onClose={onClose}
      actions={current && <RowActions actions={buildActions(current)} isBordered />}
    >
      {current && collection && (
        <div className="space-y-4">
          <div>
            <p className="font-mono text-sm font-semibold text-primary tabular-nums">N.º {current.serial}</p>
            <h2 className="truncate font-heading text-xl font-bold text-foreground">{fullName(current.buyer)}</h2>
          </div>

          <DetailSection title="Datos" isBordered>
            <DetailList>
              <DetailRow icon={MapPin} label="Barrio">
                {current.buyer.neighborhood && <NeighborhoodBadge neighborhood={current.buyer.neighborhood} />}
              </DetailRow>
              <DetailRow icon={Tag} label="Precio">
                <span className="tabular-nums">{formatSoles(current.price)}</span>
              </DetailRow>
              <DetailRow icon={UserRound} label="Vendió">
                {fullName(current.seller)}
              </DetailRow>
              <DetailRow icon={CalendarDays} label="Fecha">
                {formatShortDate(current.createdAt)}
              </DetailRow>
              <DetailRow icon={MessageSquareText} label="Nota">
                {current.note}
              </DetailRow>
            </DetailList>
          </DetailSection>

          <DetailSection
            title="Pagos"
            isBordered
            action={
              collection.pending > 0 && (
                <Button type="button" size="sm" variant="outline" onClick={() => onPay(current)}>
                  <HandCoins />
                  Registrar pago
                </Button>
              )
            }
          >
            <div className="flex items-center justify-between gap-2 pb-3">
              <p className="text-sm text-muted-foreground">
                Pagado: <span className="font-semibold text-foreground tabular-nums">{formatSoles(current.paidAmount)}</span>
              </p>
              <CollectionBadge item={current} label="Por cobrar" />
            </div>

            {isLoadingPayments && (
              <div className="space-y-2 border-t border-border pt-3">
                <Skeleton className="h-10 w-full rounded-md" />
                <Skeleton className="h-10 w-full rounded-md" />
              </div>
            )}

            {!isLoadingPayments && payments.length === 0 && (
              <p className="border-t border-border pt-3 text-sm text-muted-foreground">Todavía no hay pagos.</p>
            )}

            {!isLoadingPayments && payments.length > 0 && (
              <ul className="divide-y divide-border border-t border-border">
                {payments.map((payment) => {
                  const MethodIcon = METHOD_ICON[payment.method];
                  return (
                    <li key={payment.id} className="flex items-center gap-3 py-2.5">
                      <MethodIcon aria-hidden className="size-5 shrink-0 text-muted-foreground" />
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-foreground tabular-nums">
                          {formatSoles(payment.amount)}
                          <span className="font-normal text-muted-foreground"> · {paymentMethodLabels[payment.method]}</span>
                        </p>
                        <p className="truncate text-sm text-muted-foreground">
                          {formatShortDate(payment.createdAt)} · cobró {fullName(payment.collector)}
                        </p>
                      </div>
                      <IconButton
                        label="Eliminar pago"
                        tone="destructive"
                        isBordered
                        onClick={() => setDeleteTarget(payment)}
                      >
                        <Trash2 />
                      </IconButton>
                    </li>
                  );
                })}
              </ul>
            )}
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
        loading={DeleteItemPayment.loading}
        onConfirm={confirmDeletePayment}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}
