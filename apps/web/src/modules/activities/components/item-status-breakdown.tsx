import type { TActivityType, activityItemLabels } from "@juveco/shared/activities";
import type { IActivitySummary } from "@juveco/shared/activity-item-payments";
import { cn } from "@juveco/ui/lib/utils";
import type { LucideIcon } from "lucide-react";

import type { TCollectionStatus } from "@/modules/activities/utils/activity-items";

import { COLLECTION_BADGE } from "./collection-badge";

/* Los colores de cada estado, los mismos del badge de «Por cobrar». */
const STATUS_STYLE: Record<TCollectionStatus, { bar: string; tile: string }> = {
  PAID: { bar: "bg-success", tile: "border-success/25 bg-success/8 text-success" },
  PARTIAL: { bar: "bg-yellow", tile: "border-yellow/25 bg-yellow/8 text-yellow" },
  UNPAID: { bar: "bg-destructive", tile: "border-destructive/25 bg-destructive/8 text-destructive" },
};

const STATUS_LABEL: Record<TCollectionStatus, string> = {
  PAID: "Pagaron todo",
  PARTIAL: "Una parte",
  UNPAID: "Sin pagar",
};

const STATUS_ORDER: TCollectionStatus[] = ["PAID", "PARTIAL", "UNPAID"];

interface IItemStatusBreakdownProps {
  summary: IActivitySummary;
  labels: (typeof activityItemLabels)[TActivityType];
}

/**
 * Cómo van los pagos (como la imagen de ejemplo de Thony, 2026-11-11): una barra con la
 * proporción de cada estado y, debajo, un cuadro por estado con cuántas son.
 */
export default function ItemStatusBreakdown({ summary, labels }: IItemStatusBreakdownProps) {
  const counts: Record<TCollectionStatus, number> = {
    PAID: summary.paidCount,
    PARTIAL: summary.partialCount,
    UNPAID: summary.unpaidCount,
  };
  const total = summary.itemCount;

  return (
    <section className="space-y-3 rounded-lg border border-border bg-card p-4">
      <h2 className="text-sm font-medium text-muted-foreground">
        Estado de {total === 1 ? `1 ${labels.singular}` : `las ${total} ${labels.plural}`}
      </h2>

      {/* Solo visual: los números van en los cuadros de abajo. */}
      <div aria-hidden className="flex h-2 overflow-hidden rounded-full bg-muted">
        {total > 0 &&
          STATUS_ORDER.map((status) => (
            <div
              key={status}
              className={STATUS_STYLE[status].bar}
              style={{ width: `${(counts[status] / total) * 100}%` }}
            />
          ))}
      </div>

      <div className="grid grid-cols-3 gap-2">
        {STATUS_ORDER.map((status) => (
          <StatusTile
            key={status}
            icon={COLLECTION_BADGE[status].icon}
            label={STATUS_LABEL[status]}
            count={counts[status]}
            className={STATUS_STYLE[status].tile}
          />
        ))}
      </div>
    </section>
  );
}

interface IStatusTileProps {
  icon: LucideIcon;
  label: string;
  count: number;
  className: string;
}

function StatusTile({ icon: Icon, label, count, className }: IStatusTileProps) {
  return (
    <div className={cn("flex flex-col items-center gap-0.5 rounded-md border px-2 py-2.5 text-center", className)}>
      <span className="inline-flex items-center gap-1 text-base font-semibold tabular-nums">
        <Icon aria-hidden className="size-4 shrink-0" />
        {count}
      </span>
      <span className="text-xs font-medium">{label}</span>
    </div>
  );
}
