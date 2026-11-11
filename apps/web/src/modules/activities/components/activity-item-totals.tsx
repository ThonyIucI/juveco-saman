import { Skeleton } from "@juveco/ui/components/skeleton";
import { cn } from "@juveco/ui/lib/utils";
import { formatSoles } from "@juveco/shared/money";
import { type LucideIcon, TrendingUp, Wallet } from "lucide-react";

import { FADE_IN_CLASS } from "@/common/constants/motion";
import { formatSignedSoles } from "@/modules/activities/utils/money";

interface IActivityItemTotalsProps {
  collected: number;
  /** Lo cobrado menos premios y gastos; `null` mientras carga el balance. */
  profit: number | null;
}

/**
 * Lo cobrado y la ganancia encima del listado, para no tener que ir al resumen (Thony,
 * 2026-11-11). Van sobre la barra del buscador y los tabs: al bajar se van con el scroll y la
 * barra sigue fija.
 */
export default function ActivityItemTotals({ collected, profit }: IActivityItemTotalsProps) {
  return (
    <div className="grid grid-cols-2 gap-3 md:max-w-2xl">
      <TotalCard icon={Wallet} label="Cobrado" value={formatSoles(collected)} />
      {profit === null ? (
        <Skeleton className="h-full min-h-16 rounded-lg" />
      ) : (
        <TotalCard icon={TrendingUp} label="Ganancia" value={formatSignedSoles(profit)} isFilled />
      )}
    </div>
  );
}

interface ITotalCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  /** Lleno en el color de marca, como la ganancia del resumen. */
  isFilled?: boolean;
}

function TotalCard({ icon: Icon, label, value, isFilled = false }: ITotalCardProps) {
  return (
    <div
      className={cn(
        "min-w-0 rounded-lg border px-3 py-2.5",
        FADE_IN_CLASS,
        isFilled ? "border-primary bg-primary text-primary-foreground" : "border-primary/20 bg-primary/8",
      )}
    >
      <p
        className={cn(
          "flex items-center gap-1.5 text-sm font-medium",
          isFilled ? "text-primary-foreground/85" : "text-muted-foreground",
        )}
      >
        <Icon aria-hidden className={cn("size-4 shrink-0", !isFilled && "text-primary")} />
        {label}
      </p>
      <p
        className={cn(
          "mt-0.5 truncate font-heading text-xl font-bold tabular-nums",
          !isFilled && "text-primary",
        )}
      >
        {value}
      </p>
    </div>
  );
}
