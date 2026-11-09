import { Skeleton } from "@juveco/ui/components/skeleton";
import { cn } from "@juveco/ui/lib/utils";
import type { IActivityBalance } from "@juveco/shared/activity-expenses";
import { formatSoles } from "@juveco/shared/money";

import { DetailSection } from "@/common/components/detail-section";
import { FADE_IN_CLASS } from "@/common/constants/motion";

interface IActivityBalanceProps {
  /** `null` mientras carga. */
  balance: IActivityBalance | null;
}

interface IBalanceLine {
  label: string;
  current: number;
  expected: number;
  /** Se resta: va con «−». */
  isDeduction?: boolean;
}

const SKELETON_ROWS = 4;

/**
 * Balance de la actividad (acordado 2026-11-07): ingresos menos premios comprados y gastos,
 * con lo ya cobrado («Actual») y con lo que entraría si todos pagan. Los premios donados no
 * restan: solo se cuentan.
 */
export default function ActivityBalance({ balance }: IActivityBalanceProps) {
  if (!balance) {
    return (
      <DetailSection title="Balance" isBordered>
        <div className="space-y-2">
          {Array.from({ length: SKELETON_ROWS }, (_, index) => (
            <Skeleton key={index} className="h-6 w-full rounded-md" />
          ))}
        </div>
      </DetailSection>
    );
  }

  const lines: IBalanceLine[] = [
    { label: "Ingresos", current: balance.collected, expected: balance.expected },
    {
      label: "Premios",
      current: balance.purchasedPrizes,
      expected: balance.purchasedPrizes,
      isDeduction: true,
    },
    { label: "Gastos", current: balance.expenses, expected: balance.expenses, isDeduction: true },
  ];

  return (
    <DetailSection title="Balance" isBordered>
      <table className={`w-full text-sm tabular-nums ${FADE_IN_CLASS}`}>
        <thead>
          <tr className="text-muted-foreground">
            <th className="pb-2 text-left font-medium" />
            <th className="pb-2 text-right font-medium">Actual</th>
            <th className="pb-2 text-right font-medium">Esperado</th>
          </tr>
        </thead>
        <tbody>
          {lines.map(({ label, current, expected, isDeduction }) => (
            <tr key={label}>
              <td className="py-1.5 text-foreground">
                {isDeduction && <span className="text-muted-foreground">− </span>}
                {label}
              </td>
              <td className="py-1.5 text-right text-foreground">{formatSoles(current)}</td>
              <td className="py-1.5 text-right text-foreground">{formatSoles(expected)}</td>
            </tr>
          ))}
          <tr className="border-t border-border font-heading text-base font-bold">
            <td className="pt-2.5 text-foreground">Ganancia</td>
            <ProfitCell value={balance.currentProfit} />
            <ProfitCell value={balance.expectedProfit} />
          </tr>
        </tbody>
      </table>

      {balance.donatedPrizeCount > 0 && (
        <p className="pt-3 text-sm text-muted-foreground">
          Además, {balance.donatedPrizeCount === 1 ? "1 premio donado" : `${balance.donatedPrizeCount} premios donados`}{" "}
          que no restan.
        </p>
      )}
    </DetailSection>
  );
}

/* En rojo si se pierde plata: el color no es lo único, el signo también lo dice. */
function ProfitCell({ value }: { value: number }) {
  return (
    <td className={cn("pt-2.5 text-right", value < 0 ? "text-destructive" : "text-foreground")}>
      {value < 0 ? `− ${formatSoles(Math.abs(value))}` : formatSoles(value)}
    </td>
  );
}
