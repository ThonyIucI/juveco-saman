import { Input } from "@juveco/ui/components/input";
import { cn } from "@juveco/ui/lib/utils";
import { type LucideIcon, Search } from "lucide-react";
import type { ComponentProps } from "react";

interface ISearchInputProps extends ComponentProps<typeof Input> {
  /**
   * El ícono de la izquierda: la lupa en un listado; lo que se busca cuando es una cosa
   * concreta (la persona en el buscador de usuarios, como en id-pos).
   */
  icon?: LucideIcon;
  /** Más bajo (44 px), para buscadores dentro de un panel, como el del carrito. */
  isCompact?: boolean;
}

/** Campo de búsqueda: el `Input` de siempre con un ícono a la izquierda. */
export default function SearchInput({ icon: Icon = Search, isCompact = false, className, ...props }: ISearchInputProps) {
  return (
    <div className="relative">
      <Icon
        aria-hidden
        className={cn(
          "pointer-events-none absolute top-1/2 -translate-y-1/2 text-muted-foreground",
          isCompact ? "left-3.5 size-4.5" : "left-4 size-5",
        )}
      />
      <Input type="search" className={cn(isCompact ? "h-11 pl-10" : "pl-12", className)} {...props} />
    </div>
  );
}
