import { EPublicIncomeSource, type IPublicIncomeLine, type TPublicIncomeSource } from "@juveco/shared/public";
import { cn } from "@juveco/ui/lib/utils";

/** Color y nombre de cada origen de ingreso: el mismo en la barra, la leyenda y la lista. */
export const INCOME_SOURCE_STYLES: Record<TPublicIncomeSource, { label: string; swatchClass: string }> = {
  [EPublicIncomeSource.SALES]: { label: "Ventas", swatchClass: "bg-gold" },
  [EPublicIncomeSource.DONATIONS]: { label: "Donaciones y apoyos", swatchClass: "bg-sky-300" },
  [EPublicIncomeSource.OTHER]: { label: "Otros ingresos", swatchClass: "bg-blue-500" },
};

const SOURCE_ORDER: TPublicIncomeSource[] = [
  EPublicIncomeSource.SALES,
  EPublicIncomeSource.OTHER,
  EPublicIncomeSource.DONATIONS,
];

interface ISourceTotal {
  source: TPublicIncomeSource;
  amount: number;
}

const totalsBySource = (incomes: IPublicIncomeLine[]): ISourceTotal[] =>
  SOURCE_ORDER.map((source) => ({
    source,
    amount: incomes.filter((line) => line.source === source).reduce((total, line) => total + line.amount, 0),
  })).filter((total) => total.amount > 0);

/** Barra apilada con un tramo por origen de ingreso y su leyenda de cuadritos de color. */
export default function AccountsBar({ incomes }: { incomes: IPublicIncomeLine[] }) {
  const totals = totalsBySource(incomes);
  const sum = totals.reduce((total, item) => total + item.amount, 0);
  if (sum === 0) {
    return null;
  }

  return (
    <div>
      <div
        role="img"
        aria-label={`Origen de lo que entró: ${totals.map(({ source }) => INCOME_SOURCE_STYLES[source].label).join(", ")}`}
        className="flex h-4 gap-0.5 overflow-hidden rounded-full bg-white/10"
      >
        {totals.map(({ source, amount }) => (
          <div
            key={source}
            style={{ width: `${(amount / sum) * 100}%` }}
            className={cn("h-full", INCOME_SOURCE_STYLES[source].swatchClass)}
          />
        ))}
      </div>
      <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-white/80">
        {totals.map(({ source }) => (
          <li key={source} className="flex items-center gap-2">
            <span aria-hidden className={cn("size-3 rounded-sm", INCOME_SOURCE_STYLES[source].swatchClass)} />
            {INCOME_SOURCE_STYLES[source].label}
          </li>
        ))}
      </ul>
    </div>
  );
}
