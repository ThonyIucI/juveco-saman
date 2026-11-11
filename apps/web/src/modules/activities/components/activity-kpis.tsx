import { Skeleton } from "@juveco/ui/components/skeleton";
import { cn } from "@juveco/ui/lib/utils";
import { type TActivityType, activityItemLabels } from "@juveco/shared/activities";
import type { IActivityBalance } from "@juveco/shared/activity-expenses";
import type { IActivitySummary } from "@juveco/shared/activity-item-payments";
import { formatSoles } from "@juveco/shared/money";
import { Banknote, HandCoins, type LucideIcon, TrendingUp, Wallet } from "lucide-react";
import type { ReactNode } from "react";

import YapeIcon from "@/common/components/icons/yape-icon";
import { FADE_IN_CLASS } from "@/common/constants/motion";
import { formatSignedSoles } from "@/modules/activities/utils/money";

import ItemStatusBreakdown from "./item-status-breakdown";

interface IActivityKpisProps {
  activityType: TActivityType;
  /** `null` mientras carga. */
  summary: IActivitySummary | null;
  /** `null` mientras carga: de acá sale la ganancia. */
  balance: IActivityBalance | null;
}

/**
 * KPIs del resumen, ordenados como la imagen de ejemplo de Thony (2026-11-11), pero sin
 * «déficit temporal» ni frases que expliquen el número:
 * 1. Ganancia (llena): el monto, cuántas se repartieron y lo que se fue en premios y gastos.
 * 2. Por cobrar, con la ganancia esperada si todos pagan.
 * 3. Recaudado, con el % cobrado y lo que entró por Yape y en efectivo.
 * 4. Estado de las cartillas: barra y un cuadro por estado.
 * En escritorio, la ganancia a la izquierda y 2 y 3 apilados a la derecha; el estado a lo ancho.
 */
export default function ActivityKpis({ activityType, summary, balance }: IActivityKpisProps) {
  const labels = activityItemLabels[activityType];

  if (!summary || !balance) {
    return (
      <div className="grid gap-3 md:grid-cols-2">
        <Skeleton className="h-44 rounded-lg" />
        <div className="space-y-3">
          <Skeleton className="h-20 rounded-lg" />
          <Skeleton className="h-36 rounded-lg" />
        </div>
        <Skeleton className="h-32 rounded-lg md:col-span-2" />
      </div>
    );
  }

  const spending = balance.purchasedPrizes + balance.expenses;
  /* Sin nada que cobrar no hay porcentaje que mostrar. */
  const collectedPercent = summary.expected > 0 ? Math.round((summary.collected / summary.expected) * 100) : null;

  return (
    <div className={cn("grid gap-3 md:grid-cols-2", FADE_IN_CLASS)}>
      {/* 1. Ganancia */}
      <section className="flex flex-col rounded-lg bg-primary p-4 text-primary-foreground">
        <div className="flex items-start justify-between gap-3">
          <KpiLabel icon={TrendingUp} label="Ganancia" isOnFilled />
          {/* «Repartidas» y no «vendidas»: vendida sonaba a ya pagada (Thony, 2026-11-11). */}
          <p className="text-right text-xs text-primary-foreground/80">
            <span className="block font-heading text-lg font-semibold text-primary-foreground tabular-nums">
              {summary.itemCount}
            </span>
            {summary.itemCount === 1 ? `${labels.singular} repartida` : `${labels.plural} repartidas`}
          </p>
        </div>
        <p className="mt-2 font-heading text-3xl font-bold tabular-nums">{formatSignedSoles(balance.currentProfit)}</p>
        <div className="mt-auto flex items-center justify-between gap-3 border-t border-primary-foreground/20 pt-3 text-sm">
          <span className="text-primary-foreground/80">Premios y gastos</span>
          <span className="font-semibold tabular-nums">{formatSoles(spending)}</span>
        </div>
      </section>

      <div className="space-y-3">
        {/* 2. Por cobrar */}
        <section className="flex items-center justify-between gap-3 rounded-lg border border-primary/20 bg-primary/8 p-4">
          <div className="min-w-0 space-y-1">
            <KpiLabel icon={HandCoins} label="Por cobrar" />
            <p className="font-heading text-2xl font-bold text-primary tabular-nums">{formatSoles(summary.pending)}</p>
          </div>
          {/* «Ganancia esperada» y no «Esperada» suelto: no es lo que se espera cobrar. */}
          <div className="flex shrink-0 flex-col items-end gap-1">
            <span className="text-xs text-muted-foreground">Ganancia esperada</span>
            <span className="rounded-md border border-border bg-card px-2 py-0.5 text-sm font-semibold text-foreground tabular-nums">
              {formatSignedSoles(balance.expectedProfit)}
            </span>
          </div>
        </section>

        {/* 3. Recaudado */}
        <section className="space-y-3 rounded-lg border border-border bg-card p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <KpiLabel icon={Wallet} label="Recaudado" />
              <p className="font-heading text-2xl font-bold text-foreground tabular-nums">
                {formatSoles(summary.collected)}
              </p>
            </div>
            {collectedPercent !== null && (
              <span className="shrink-0 rounded-full bg-success/10 px-2.5 py-1 text-xs font-semibold text-success tabular-nums">
                {collectedPercent} % cobrado
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <MethodBox
              icon={<YapeIcon />}
              label="Yape"
              amount={summary.collectedByMethod.YAPE}
              className="border-yape/20 bg-yape/5"
            />
            <MethodBox
              icon={<Banknote aria-hidden className="size-5 shrink-0 text-success" />}
              label="Efectivo"
              amount={summary.collectedByMethod.CASH}
              className="border-success/20 bg-success/5"
            />
          </div>
        </section>
      </div>

      {/* 4. Estado de las cartillas */}
      <div className="md:col-span-2">
        <ItemStatusBreakdown summary={summary} labels={labels} />
      </div>
    </div>
  );
}

interface IKpiLabelProps {
  icon: LucideIcon;
  label: string;
  /** Sobre el fondo lleno de la ganancia. */
  isOnFilled?: boolean;
}

/** El ícono en su cuadrito y el nombre del dato. */
function KpiLabel({ icon: Icon, label, isOnFilled = false }: IKpiLabelProps) {
  return (
    <span className="inline-flex items-center gap-2 text-sm font-medium">
      <span
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-md",
          isOnFilled ? "bg-primary-foreground/15" : "bg-primary/10 text-primary",
        )}
      >
        <Icon aria-hidden className="size-4" />
      </span>
      <span className={isOnFilled ? undefined : "text-muted-foreground"}>{label}</span>
    </span>
  );
}

interface IMethodBoxProps {
  icon: ReactNode;
  label: string;
  amount: number;
  className: string;
}

function MethodBox({ icon, label, amount, className }: IMethodBoxProps) {
  return (
    <div className={cn("flex items-center gap-2.5 rounded-md border px-3 py-2", className)}>
      {icon}
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-semibold text-foreground tabular-nums">{formatSoles(amount)}</p>
      </div>
    </div>
  );
}
