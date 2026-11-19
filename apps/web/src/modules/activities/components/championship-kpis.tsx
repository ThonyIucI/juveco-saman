import { Skeleton } from "@juveco/ui/components/skeleton";
import { cn } from "@juveco/ui/lib/utils";
import { formatSoles, roundSoles } from "@juveco/shared/money";

import { FADE_IN_CLASS } from "@/common/constants/motion";
import { formatSignedSoles } from "@/modules/activities/utils/money";

interface IChampionshipKpisProps {
  /** Lo que entró: por ahora, lo cobrado de las inscripciones. */
  income: number;
  /** Arbitrajes y demás gastos de la actividad, con los premios comprados. */
  spending: number;
}

/**
 * KPIs del campeonato, compactos (Thony, 2026-11-19): una card con ingresos y egresos lado a
 * lado y otra llena con el saldo. Sin barras ni frases: lo que falta cobrar se ve en la tabla.
 */
export default function ChampionshipKpis({ income, spending }: IChampionshipKpisProps) {
  return (
    <div className={cn("grid grid-cols-2 gap-3 sm:grid-cols-3", FADE_IN_CLASS)}>
      <section className="col-span-2 flex divide-x divide-border rounded-lg border border-border bg-card px-4 py-3 *:flex-1 *:px-4 *:first:pl-0 *:last:pr-0">
        <Kpi label="Ingresos" value={formatSoles(income)} valueClassName="text-success" />
        <Kpi label="Egresos" value={formatSoles(spending)} valueClassName="text-destructive" />
      </section>
      <section className="col-span-2 rounded-lg bg-primary px-4 py-3 text-primary-foreground sm:col-span-1">
        <Kpi label="Saldo" value={formatSignedSoles(roundSoles(income - spending))} isOnFilled />
      </section>
    </div>
  );
}

export function ChampionshipKpisSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      <Skeleton className="col-span-2 h-17 rounded-lg" />
      <Skeleton className="col-span-2 h-17 rounded-lg sm:col-span-1" />
    </div>
  );
}

interface IKpiProps {
  label: string;
  value: string;
  valueClassName?: string;
  /** Sobre el fondo lleno del saldo. */
  isOnFilled?: boolean;
}

function Kpi({ label, value, valueClassName, isOnFilled = false }: IKpiProps) {
  return (
    <div className="min-w-0">
      <p className={cn("text-sm", isOnFilled ? "text-primary-foreground/85" : "text-muted-foreground")}>{label}</p>
      <p className={cn("truncate font-heading text-xl font-bold tabular-nums", valueClassName)}>{value}</p>
    </div>
  );
}
