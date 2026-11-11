import { cn } from "@juveco/ui/lib/utils";

export interface ICountTabOption<TValue extends string> {
  value: TValue;
  label: string;
  /** Cuántos hay en ese tab: va al lado del texto, en un globo gris. */
  count: number;
}

interface ICountTabsProps<TValue extends string> {
  options: ICountTabOption<TValue>[];
  value: TValue;
  onChange: (value: TValue) => void;
  /** Nombre del grupo para el lector de pantalla. */
  label: string;
  /** El alto lo pone quien lo usa (`h-control`, `h-control-lg`): los tabs lo llenan. */
  className?: string;
}

/**
 * Tabs subrayados con contador (Thony, 2026-11-11): el activo en el color de marca con su
 * raya debajo; los demás en gris sobre una línea fina. El contador reemplaza al «N de M» de
 * encima del listado.
 */
export default function CountTabs<TValue extends string>({
  options,
  value,
  onChange,
  label,
  className,
}: ICountTabsProps<TValue>) {
  return (
    <div role="tablist" aria-label={label} className={cn("flex h-control border-b border-border", className)}>
      {options.map((option) => {
        const isActive = option.value === value;

        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(option.value)}
            className={cn(
              /* `-mb-px`: la raya del activo tapa la línea del grupo en vez de sumarse debajo. */
              "-mb-px flex h-full flex-1 cursor-pointer items-center justify-center gap-2 border-b-2 px-3 text-sm whitespace-nowrap transition-colors duration-150 ease-out outline-none focus-visible:bg-muted",
              isActive
                ? "border-primary font-semibold text-primary"
                : "border-transparent font-medium text-muted-foreground hover:text-foreground",
            )}
          >
            {option.label}
            <span
              className={cn(
                "inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-muted px-1.5 text-xs leading-none font-semibold tabular-nums",
                isActive ? "text-foreground" : "text-muted-foreground",
              )}
            >
              {option.count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
