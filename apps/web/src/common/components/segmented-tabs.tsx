import { cn } from "@juveco/ui/lib/utils";
import type { LucideIcon } from "lucide-react";

export interface ISegmentedTabOption<TValue extends string> {
  value: TValue;
  icon: LucideIcon;
  /** Lo que lee el lector de pantalla y el tooltip: el tab solo muestra el ícono. */
  label: string;
  /** Un puntito sobre el ícono: esa opción tiene algo guardado aunque no se vea. */
  hasValue?: boolean;
}

interface ISegmentedTabsProps<TValue extends string> {
  options: ISegmentedTabOption<TValue>[];
  value: TValue;
  onChange: (value: TValue) => void;
  /** Nombre del grupo para el lector de pantalla. */
  label: string;
  className?: string;
}

/**
 * Tabs de solo ícono, como el selector de id-pos: el activo queda en blanco sobre el fondo
 * apagado del grupo. Para alternar entre dos formas de llenar un mismo dato.
 */
export default function SegmentedTabs<TValue extends string>({
  options,
  value,
  onChange,
  label,
  className,
}: ISegmentedTabsProps<TValue>) {
  return (
    <div role="tablist" aria-label={label} className={cn("inline-flex gap-0.5 rounded-lg bg-muted p-0.5", className)}>
      {options.map((option) => {
        const isActive = option.value === value;
        const Icon = option.icon;

        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-label={option.label}
            title={option.label}
            onClick={() => onChange(option.value)}
            className={cn(
              "relative flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors duration-150 ease-out outline-none focus-visible:ring-4 focus-visible:ring-ring/30",
              isActive && "bg-card text-foreground shadow-sm",
            )}
          >
            <Icon aria-hidden className="size-4" />
            {option.hasValue && !isActive && (
              <span aria-hidden className="absolute top-0.5 right-0.5 size-1.5 rounded-full bg-primary" />
            )}
          </button>
        );
      })}
    </div>
  );
}
