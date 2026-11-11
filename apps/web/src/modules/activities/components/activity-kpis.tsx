import { Skeleton } from "@juveco/ui/components/skeleton";
import { cn } from "@juveco/ui/lib/utils";
import type { IActivityBalance } from "@juveco/shared/activity-expenses";
import type { IActivitySummary } from "@juveco/shared/activity-item-payments";
import { formatSoles } from "@juveco/shared/money";
import { Banknote, HandCoins, type LucideIcon, TrendingUp, Wallet } from "lucide-react";
import type { ReactNode } from "react";

import YapeIcon from "@/common/components/icons/yape-icon";
import { FADE_IN_CLASS } from "@/common/constants/motion";
import { formatSignedSoles } from "@/modules/activities/utils/money";

/* Los dos datos a la derecha del monto, con una raya vertical entre ellos. */
const STAT_GROUP_CLASS = "flex shrink-0 divide-x *:px-3 *:first:pl-0 *:last:pr-0";
/* La línea de abajo de cada card, sin raya horizontal encima (Thony, 2026-11-11). */
const FOOTER_CLASS = "mt-auto flex items-center justify-between gap-3 text-sm";

interface IActivityKpisProps {
  /** `null` mientras carga. */
  summary: IActivitySummary | null;
  /** `null` mientras carga: de acá sale la ganancia. */
  balance: IActivityBalance | null;
}

/**
 * KPIs del resumen, ordenados como la imagen de ejemplo de Thony (2026-11-11), sin «déficit
 * temporal» ni frases que expliquen el número:
 * 1. Ganancia (llena): el monto, cuántas se repartieron y cuántas se pagaron, y lo que se fue
 *    en premios y gastos.
 * 2. Por cobrar, con la ganancia esperada si todos pagan.
 * 3. Recaudado, con el % cobrado y lo que entró por Yape y en efectivo.
 * En escritorio, las tres en una fila del mismo ancho. El estado de las cartillas (barra y
 * cuadros) se quitó: ya no hacía falta (Thony, 2026-11-11).
 */
export default function ActivityKpis({ summary, balance }: IActivityKpisProps) {
  if (!summary || !balance) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Skeleton className="h-32 rounded-lg" />
        <Skeleton className="h-32 rounded-lg" />
        <Skeleton className="h-32 rounded-lg sm:col-span-2 lg:col-span-1" />
      </div>
    );
  }

  const spending = balance.purchasedPrizes + balance.expenses;
  /* Sin nada que cobrar no hay porcentaje que mostrar. */
  const collectedPercent = summary.expected > 0 ? Math.round((summary.collected / summary.expected) * 100) : null;

  return (
    <div className={cn("grid gap-3 sm:grid-cols-2 lg:grid-cols-3", FADE_IN_CLASS)}>
      {/* 1. Ganancia */}
      <section className="flex flex-col gap-3 rounded-lg bg-primary p-4 text-primary-foreground">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <KpiLabel icon={TrendingUp} label="Ganancia" isOnFilled />
            <p className="font-heading text-2xl font-bold tabular-nums">{formatSignedSoles(balance.currentProfit)}</p>
          </div>
          {/*
            A la derecha del monto, sin «Cartillas» encima (Thony, 2026-11-11). «Repartidas» y no
            «vendidas»: vendida sonaba a ya pagada.
          */}
          <div className={cn(STAT_GROUP_CLASS, "divide-primary-foreground/25")}>
            <StatCell label="Repartidas" value={summary.itemCount} isOnFilled />
            <StatCell label="Pagadas" value={summary.paidCount} isOnFilled />
          </div>
        </div>
        <div className={FOOTER_CLASS}>
          <span className="text-primary-foreground/80">Premios y gastos</span>
          <span className="font-semibold tabular-nums">{formatSoles(spending)}</span>
        </div>
      </section>

      {/* 2. Por cobrar */}
      <section className="flex flex-col gap-3 rounded-lg border border-primary/20 bg-primary/8 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <KpiLabel icon={HandCoins} label="Por cobrar" />
            <p className="font-heading text-2xl font-bold text-primary tabular-nums">{formatSoles(summary.pending)}</p>
          </div>
          {/*
            Cuántas deben, como «Repartidas | Pagadas» de la ganancia (Thony, 2026-11-11):
            parciales, las que pagaron una parte; totales, las que deben todo.
          */}
          <div className={cn(STAT_GROUP_CLASS, "divide-primary/20")}>
            <StatCell label="Parciales" value={summary.partialCount} />
            <StatCell label="Totales" value={summary.unpaidCount} />
          </div>
        </div>
        {/* «Ganancia esperada» y no «Esperada» suelto: no es lo que se espera cobrar. */}
        <div className={FOOTER_CLASS}>
          <span className="text-muted-foreground">Ganancia esperada</span>
          <span className="font-semibold text-foreground tabular-nums">
            {formatSignedSoles(balance.expectedProfit)}
          </span>
        </div>
      </section>

      {/* 3. Recaudado */}
      <section className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 sm:col-span-2 lg:col-span-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <KpiLabel icon={Wallet} label="Recaudado" />
            <p className="font-heading text-2xl font-bold text-foreground tabular-nums">
              {formatSoles(summary.collected)}
            </p>
          </div>
          {/*
            Yape y efectivo a la derecha del monto, cada uno con el ícono arriba, el nombre y el
            monto: sin las cajitas de abajo la card baja de alto (Thony, 2026-11-11).
          */}
          <div className={cn(STAT_GROUP_CLASS, "divide-border")}>
            <StatCell
              icon={<YapeIcon className="h-4" />}
              label="Yape"
              value={formatSoles(summary.collectedByMethod.YAPE)}
            />
            <StatCell
              icon={<Banknote aria-hidden className="size-4 shrink-0 text-success" />}
              label="Efectivo"
              value={formatSoles(summary.collectedByMethod.CASH)}
            />
          </div>
        </div>
        {/* El % cobrado pasa del pill a la línea de abajo, como en las otras dos cards. */}
        {collectedPercent !== null && (
          <div className={FOOTER_CLASS}>
            <span className="text-muted-foreground">Avance del cobro</span>
            <span className="font-semibold text-success tabular-nums">{collectedPercent} %</span>
          </div>
        )}
      </section>
    </div>
  );
}

interface IKpiLabelProps {
  icon: LucideIcon;
  label: string;
  /** Sobre el fondo lleno de la ganancia. */
  isOnFilled?: boolean;
}

/** El nombre del dato con su ícono suelto: sin cuadrito, para que no parezca botón (Thony, 2026-11-11). */
function KpiLabel({ icon: Icon, label, isOnFilled = false }: IKpiLabelProps) {
  return (
    <p
      className={cn(
        "flex items-center gap-1.5 text-sm font-medium",
        isOnFilled ? "text-primary-foreground/85" : "text-muted-foreground",
      )}
    >
      <Icon aria-hidden className={cn("size-4 shrink-0", !isOnFilled && "text-primary")} />
      {label}
    </p>
  );
}

interface IStatCellProps {
  label: string;
  value: number | string;
  /** A la derecha del nombre (Yape, efectivo). */
  icon?: ReactNode;
  /** Sobre el fondo lleno de la ganancia. */
  isOnFilled?: boolean;
  className?: string;
}

/**
 * Los datos chicos a la derecha del monto de cada card («Repartidas | Pagadas»,
 * «Parciales | Totales», «Yape | Efectivo»): el nombre y el valor debajo, a la derecha.
 */
function StatCell({ label, value, icon, isOnFilled = false, className }: IStatCellProps) {
  return (
    <div className={cn("flex min-w-0 flex-col items-end text-right", className)}>
      {/* El nombre a la izquierda y el ícono a la derecha, en la misma línea (Thony, 2026-11-11). */}
      <p
        className={cn(
          "flex items-center gap-1 text-xs",
          isOnFilled ? "text-primary-foreground/80" : "text-muted-foreground",
        )}
      >
        {label}
        {icon}
      </p>
      <p className={cn("font-heading text-lg font-semibold tabular-nums", !isOnFilled && "text-foreground")}>
        {value}
      </p>
    </div>
  );
}
