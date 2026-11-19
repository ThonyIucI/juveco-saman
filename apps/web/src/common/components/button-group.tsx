import { cn } from "@juveco/ui/lib/utils";
import type { LucideIcon } from "lucide-react";

export interface IButtonGroupOption<TValue extends string> {
  value: TValue;
  label: string;
  icon?: LucideIcon;
}

interface IButtonGroupProps<TValue extends string> {
  /** El id del `Label` que nombra al grupo. */
  labelledBy: string;
  options: IButtonGroupOption<TValue>[];
  value: TValue;
  onChange: (value: TValue) => void;
  className?: string;
}

/**
 * Botones pegados para elegir una entre dos o tres opciones cortas, del alto de los campos
 * (Thony, 2026-11-19: Yape o Efectivo al lado del monto). Cada uno se ve como un botón con
 * borde; el elegido, en primario suave. No es un tab: no cambia de vista, llena un dato.
 */
export default function ButtonGroup<TValue extends string>({
  labelledBy,
  options,
  value,
  onChange,
  className,
}: IButtonGroupProps<TValue>) {
  return (
    <div role="radiogroup" aria-labelledby={labelledBy} className={cn("flex h-control", className)}>
      {options.map(({ value: optionValue, label, icon: Icon }) => {
        const isSelected = optionValue === value;
        return (
          <button
            key={optionValue}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => onChange(optionValue)}
            className={cn(
              /* `-ml-px`: los bordes vecinos se pisan y queda una sola línea entre botones. */
              "relative flex min-w-0 flex-1 items-center justify-center gap-1.5 border px-3 font-heading text-sm font-semibold transition-colors duration-150 ease-out outline-none not-first:-ml-px first:rounded-l-lg last:rounded-r-lg focus-visible:z-20 focus-visible:ring-4 focus-visible:ring-ring/30",
              isSelected
                ? "z-10 border-primary bg-primary/10 text-primary"
                : "border-field-border bg-card text-foreground hover:bg-accent hover:text-accent-foreground",
            )}
          >
            {/* En celular, a media fila, solo entra el texto. */}
            {Icon && <Icon aria-hidden className="hidden size-4 shrink-0 sm:block" />}
            <span className="truncate">{label}</span>
          </button>
        );
      })}
    </div>
  );
}
