import { IconButton } from "@juveco/ui/components/icon-button";
import { SlidersHorizontal } from "lucide-react";

interface IFilterButtonProps {
  /** Cuántos filtros hay puestos: se ve como globo sobre el ícono. */
  activeCount: number;
  onClick: () => void;
}

/**
 * Botón de filtros al lado del buscador, como en id-pos (acordado 2026-10-13): los filtros
 * no ocupan la pantalla del listado, se abren en una modal. El globo dice cuántos hay.
 */
export default function FilterButton({ activeCount, onClick }: IFilterButtonProps) {
  return (
    <IconButton
      /* El mismo alto que el buscador (`h-13`). */
      size="lg"
      isBordered
      label={activeCount > 0 ? `Filtros (${activeCount} puestos)` : "Filtros"}
      onClick={onClick}
      /* Con filtros puestos, borde de marca como los selects con filtro (Thony, 2026-11-07). */
      className={activeCount > 0 ? "border-primary text-primary" : undefined}
    >
      <SlidersHorizontal className="size-5" />
      {activeCount > 0 && (
        <span className="absolute -top-1.5 -right-1.5 flex size-5 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
          {activeCount}
        </span>
      )}
    </IconButton>
  );
}
