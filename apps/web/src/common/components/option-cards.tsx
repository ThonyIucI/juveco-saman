import { cn } from "@juveco/ui/lib/utils";
import type { LucideIcon } from "lucide-react";

export interface IOptionCard<TValue extends string> {
  value: TValue;
  label: string;
  icon: LucideIcon;
}

interface IOptionCardsProps<TValue extends string> {
  /** El id del `Label` que nombra al grupo. */
  labelledBy: string;
  options: IOptionCard<TValue>[];
  value: TValue;
  onChange: (value: TValue) => void;
}

/**
 * Elegir una entre pocas opciones con ícono y texto, una al lado de la otra y del alto de los
 * campos (p. ej. Yape o Efectivo; Donado o Comprado). La elegida va con el borde de marca.
 */
export default function OptionCards<TValue extends string>({
  labelledBy,
  options,
  value,
  onChange,
}: IOptionCardsProps<TValue>) {
  return (
    <div
      role="radiogroup"
      aria-labelledby={labelledBy}
      className="grid gap-2"
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
    >
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
              "flex h-13 cursor-pointer items-center justify-center gap-2 rounded-xl border-2 text-sm font-semibold transition-colors outline-none focus-visible:ring-4 focus-visible:ring-ring/30",
              isSelected
                ? "border-primary bg-primary/10 text-primary"
                : "border-input bg-field text-foreground hover:bg-muted",
            )}
          >
            <Icon aria-hidden className="size-5" />
            {label}
          </button>
        );
      })}
    </div>
  );
}
