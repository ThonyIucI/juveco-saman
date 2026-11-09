import { Badge } from "@juveco/ui/components/badge";
import { Skeleton } from "@juveco/ui/components/skeleton";
import { type TActivityType, activityItemLabels } from "@juveco/shared/activities";
import { EPaymentMethod, paymentMethodLabels } from "@juveco/shared/activity-item-payments";
import { formatSoles } from "@juveco/shared/money";
import type { IActivitySummary } from "@juveco/shared/activity-item-payments";
import type { ReactNode } from "react";

import { FADE_IN_CLASS } from "@/common/constants/motion";

import { COLLECTION_BADGE } from "./collection-badge";

const SKELETON_TILES = 4;

export const KPI_TILE_CLASS = "space-y-1 rounded-sm border border-border bg-card p-3";

interface IActivityKpisProps {
  activityType: TActivityType;
  /** `null` mientras carga. */
  summary: IActivitySummary | null;
}

/**
 * KPIs de la actividad (acordado 2026-11-07): cuántos se vendieron, lo recaudado (por Yape y
 * en efectivo), el total a recaudar, lo que falta cobrar y cuántos pagaron todo, una parte o
 * nada. Van en la página de resumen, arriba del balance.
 */
export default function ActivityKpis({ activityType, summary }: IActivityKpisProps) {
  const labels = activityItemLabels[activityType];

  if (!summary) {
    return (
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: SKELETON_TILES }, (_, index) => (
          <Skeleton key={index} className="h-24 rounded-sm" />
        ))}
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${FADE_IN_CLASS}`}>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Tile label={`${capitalize(labels.plural)} vendidas`} value={String(summary.itemCount)} />
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
        <Tile label="Total a recaudar" value={formatSoles(summary.expected)} />
        <Tile label="Por cobrar" value={formatSoles(summary.pending)} />
      </div>

      <div className="rounded-sm border border-border bg-card p-3">
        <p className="pb-2 text-sm font-medium text-muted-foreground">Cómo van los pagos</p>
        <div className="flex flex-wrap gap-2">
          <StatusCount status="PAID" label="Pagaron todo" count={summary.paidCount} />
          <StatusCount status="PARTIAL" label="Pagaron una parte" count={summary.partialCount} />
          <StatusCount status="UNPAID" label="Sin pagar" count={summary.unpaidCount} />
        </div>
      </div>
    </div>
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
    <div className={KPI_TILE_CLASS}>
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
