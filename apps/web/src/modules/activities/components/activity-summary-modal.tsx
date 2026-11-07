import { Badge } from "@juveco/ui/components/badge";
import { Skeleton } from "@juveco/ui/components/skeleton";
import { type IActivityResource, activityItemLabels } from "@juveco/shared/activities";
import { EPaymentMethod, paymentMethodLabels } from "@juveco/shared/activity-item-payments";
import { formatSoles } from "@juveco/shared/money";
import type { ReactNode } from "react";
import { useEffect } from "react";

import Modal from "@/common/components/modal";
import { useGetActivitySummary } from "@/modules/activities/hooks/use-get-activity-summary";

import { COLLECTION_BADGE } from "./activity-item-card";

const SKELETON_TILES = 4;

interface IActivitySummaryModalProps {
  open: boolean;
  activity: IActivityResource;
  onClose: () => void;
}

/**
 * KPIs de la actividad (acordado 2026-11-07): cuántos se vendieron, lo recaudado (por Yape y
 * en efectivo), lo que falta cobrar y cuántos pagaron todo, una parte o nada. Se piden al
 * abrir, así siempre están al día.
 */
export default function ActivitySummaryModal({ open, activity, onClose }: IActivitySummaryModalProps) {
  const GetActivitySummary = useGetActivitySummary();
  const { summary } = GetActivitySummary;
  const labels = activityItemLabels[activity.type];

  useEffect(() => {
    if (!open) {
      return;
    }
    const controller = new AbortController();
    GetActivitySummary.handler(activity.id, controller.signal);
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, activity.id]);

  return (
    <Modal open={open} title="Resumen" subtitle={activity.name} onClose={onClose}>
      {GetActivitySummary.loading || !summary ? (
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: SKELETON_TILES }, (_, index) => (
            <Skeleton key={index} className="h-20 rounded-sm" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Tile label={`${capitalize(labels.plural)} vendidas`} value={String(summary.itemCount)} />
            <Tile label="Total a recaudar" value={formatSoles(summary.expected)} />
            <Tile
              label="Recaudado"
              value={formatSoles(summary.collected)}
              detail={
                <>
                  {paymentMethodLabels[EPaymentMethod.YAPE]} {formatSoles(summary.collectedByMethod.YAPE)}
                  <br />
                  {paymentMethodLabels[EPaymentMethod.CASH]} {formatSoles(summary.collectedByMethod.CASH)}
                </>
              }
            />
            <Tile label="Por cobrar" value={formatSoles(summary.pending)} />
          </div>

          <div className="rounded-sm border border-border p-3">
            <p className="pb-2 text-sm font-medium text-muted-foreground">Cómo van los pagos</p>
            <div className="flex flex-wrap gap-2">
              <StatusCount status="PAID" label="Pagaron todo" count={summary.paidCount} />
              <StatusCount status="PARTIAL" label="Pagaron una parte" count={summary.partialCount} />
              <StatusCount status="UNPAID" label="Sin pagar" count={summary.unpaidCount} />
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}

const capitalize = (text: string): string => text.charAt(0).toUpperCase() + text.slice(1);

interface ITileProps {
  label: string;
  value: string;
  detail?: ReactNode;
}

function Tile({ label, value, detail }: ITileProps) {
  return (
    <div className="space-y-1 rounded-sm border border-border p-3">
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p className="font-heading text-xl font-bold text-foreground tabular-nums">{value}</p>
      {detail && <p className="text-xs text-muted-foreground tabular-nums">{detail}</p>}
    </div>
  );
}

interface IStatusCountProps {
  status: keyof typeof COLLECTION_BADGE;
  label: string;
  count: number;
}

function StatusCount({ status, label, count }: IStatusCountProps) {
  const { color, icon: Icon } = COLLECTION_BADGE[status];
  return (
    <Badge color={color} size="lg" className="rounded-md">
      <Icon aria-hidden />
      {label}: {count}
    </Badge>
  );
}
