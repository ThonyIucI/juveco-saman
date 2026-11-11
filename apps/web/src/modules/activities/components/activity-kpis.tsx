import { Badge } from "@juveco/ui/components/badge";
import { Skeleton } from "@juveco/ui/components/skeleton";
import { cn } from "@juveco/ui/lib/utils";
import { type TActivityType, activityItemLabels } from "@juveco/shared/activities";
import type { IActivityBalance } from "@juveco/shared/activity-expenses";
import type { IActivitySummary } from "@juveco/shared/activity-item-payments";
import { formatSoles } from "@juveco/shared/money";
import { Banknote, HandCoins, type LucideIcon, TrendingUp } from "lucide-react";
import type { ReactNode } from "react";

import YapeIcon from "@/common/components/icons/yape-icon";
import { FADE_IN_CLASS } from "@/common/constants/motion";

import { COLLECTION_BADGE } from "./collection-badge";

interface IActivityKpisProps {
  activityType: TActivityType;
  /** `null` mientras carga. */
  summary: IActivitySummary | null;
  /** `null` mientras carga: de acá sale la ganancia. */
  balance: IActivityBalance | null;
}

/** Con «−» delante y no «S/ -20.00»: al inicio, con premios ya comprados, es lo normal. */
const formatSignedSoles = (value: number): string =>
  value < 0 ? `− ${formatSoles(Math.abs(value))}` : formatSoles(value);

/**
 * KPIs del resumen, como los de cuentas bancarias de domus (Thony, 2026-11-11): al entrar se
 * ve cuánto se va ganando. Dos banners: la ganancia (lleno, con cuántas se repartieron) y lo
 * que falta cobrar (suave, con la ganancia esperada). Debajo, lo recaudado por Yape y en
 * efectivo, y cómo van los pagos.
 */
export default function ActivityKpis({ activityType, summary, balance }: IActivityKpisProps) {
  const labels = activityItemLabels[activityType];

  if (!summary || !balance) {
    return (
      <div className="space-y-3">
        <div className="grid gap-3 md:grid-cols-2">
          <Skeleton className="h-20 rounded-lg" />
          <Skeleton className="h-20 rounded-lg" />
        </div>
        <Skeleton className="h-14 rounded-sm" />
      </div>
    );
  }

  /* «Repartidas» y no «vendidas»: vendida sonaba a ya pagada (Thony, 2026-11-11). */
  const distributedLabel =
    summary.itemCount === 1 ? `1 ${labels.singular} repartida` : `${summary.itemCount} ${labels.plural} repartidas`;

  return (
    <div className={`space-y-3 ${FADE_IN_CLASS}`}>
      <div className="grid gap-3 md:grid-cols-2">
        <KpiBanner
          isFilled
          icon={TrendingUp}
          label="Ganancia"
          value={formatSignedSoles(balance.currentProfit)}
          caption={distributedLabel}
        />
        <KpiBanner
          icon={HandCoins}
          label="Por cobrar"
          value={formatSoles(summary.pending)}
          caption={`Esperada ${formatSignedSoles(balance.expectedProfit)}`}
        />
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-sm border border-border bg-card p-3">
          <p className="text-sm font-medium text-muted-foreground">
            Recaudado <span className="font-semibold text-foreground tabular-nums">{formatSoles(summary.collected)}</span>
          </p>
          <MethodAmount icon={<YapeIcon />} label="Yape" amount={summary.collectedByMethod.YAPE} />
          <MethodAmount
            icon={<Banknote aria-hidden className="size-4 shrink-0 text-success" />}
            label="Efectivo"
            amount={summary.collectedByMethod.CASH}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 rounded-sm border border-border bg-card p-3">
          <StatusCount status="PAID" label="Pagaron todo" count={summary.paidCount} />
          <StatusCount status="PARTIAL" label="Una parte" count={summary.partialCount} />
          <StatusCount status="UNPAID" label="Sin pagar" count={summary.unpaidCount} />
        </div>
      </div>
    </div>
  );
}

interface IKpiBannerProps {
  icon: LucideIcon;
  label: string;
  value: string;
  caption: string;
  /** Lleno en el color de marca: el dato principal. Sin esto, el fondo suave. */
  isFilled?: boolean;
}

/** Como `BankAccountKpi` de domus: ícono y etiqueta a la izquierda; monto y detalle a la derecha. */
function KpiBanner({ icon: Icon, label, value, caption, isFilled = false }: IKpiBannerProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 rounded-lg border px-4 py-3.5",
        isFilled ? "border-primary bg-primary text-primary-foreground" : "border-primary/20 bg-primary/8 text-foreground",
      )}
    >
      <div className="flex min-w-0 flex-col gap-1">
        <Icon aria-hidden className={cn("size-5", !isFilled && "text-primary")} />
        <span className="text-sm font-medium">{label}</span>
      </div>
      <div className="flex min-w-0 flex-col items-end gap-0.5 text-right">
        <span className={cn("font-heading text-2xl font-bold tabular-nums", !isFilled && "text-primary")}>
          {value}
        </span>
        <span className={cn("text-xs tabular-nums", isFilled ? "text-primary-foreground/85" : "text-muted-foreground")}>
          {caption}
        </span>
      </div>
    </div>
  );
}

interface IMethodAmountProps {
  icon: ReactNode;
  label: string;
  amount: number;
}

function MethodAmount({ icon, label, amount }: IMethodAmountProps) {
  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-foreground tabular-nums" title={label}>
      {icon}
      <span className="sr-only">{label}</span>
      {formatSoles(amount)}
    </span>
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
