import { cn } from "@juveco/ui/lib/utils";
import type { LucideIcon } from "lucide-react";

import { useChromeHidden } from "@/common/hooks/use-chrome-hidden";

interface IFloatingActionButtonProps {
  /** Lo que hace, para el lector de pantalla y el tooltip («Alquilar»). */
  label: string;
  icon: LucideIcon;
  onClick: () => void;
  className?: string;
}

/**
 * El botón flotante de crear, como el «+» de id-pos (acordado 2026-11-04). Solo en celular:
 * en escritorio la acción va en el encabezado. Va sobre la barra de navegación y, cuando
 * esa barra se esconde al bajar, baja con ella para no quedar flotando en el aire.
 */
export default function FloatingActionButton({ label, icon: Icon, onClick, className }: IFloatingActionButtonProps) {
  const isChromeHidden = useChromeHidden();

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={cn(
        "fixed right-4 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-30 flex size-14 cursor-pointer items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sheet sm:bottom-6 md:hidden",
        "transition-transform duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-95 motion-reduce:transition-none",
        /* La barra mide ~4 rem: al esconderse, el botón baja lo mismo. */
        isChromeHidden && "translate-y-16 sm:translate-y-0",
        className,
      )}
    >
      <Icon className="size-6" />
    </button>
  );
}
