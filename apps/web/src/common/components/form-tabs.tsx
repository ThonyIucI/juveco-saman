import { cn } from "@juveco/ui/lib/utils";

interface IFormTabsProps<TValue extends string> {
  tabs: readonly { value: TValue; label: string; hasError?: boolean }[];
  value: TValue;
  onChange: (value: TValue) => void;
}

/**
 * Pestañas de un formulario en modal («Principales», «Adicionales»), como el de clientes de
 * id-pos: a todo el ancho, con la activa subrayada. Una pestaña con errores se marca en rojo.
 */
export default function FormTabs<TValue extends string>({ tabs, value, onChange }: IFormTabsProps<TValue>) {
  return (
    <div role="tablist" className="-mx-5 mb-5 flex border-b border-border">
      {tabs.map((tab) => {
        const isActive = tab.value === value;
        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.value)}
            className={cn(
              "-mb-px flex-1 cursor-pointer border-b-2 py-3 text-sm font-semibold transition-colors outline-none focus-visible:bg-muted",
              isActive ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground",
              tab.hasError && "text-destructive",
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
