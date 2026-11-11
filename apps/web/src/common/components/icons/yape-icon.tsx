import { cn } from "@juveco/ui/lib/utils";

interface IYapeIconProps {
  className?: string;
}

/**
 * Marca de Yape para lo cobrado por Yape (Thony, 2026-11-11): el cuadrado redondeado en el
 * magenta de `--yape` con la «y». No es el logo oficial: si se quiere ese, se cambia el SVG
 * por el del kit de marca y este componente sigue igual para quien lo usa.
 */
export default function YapeIcon({ className }: IYapeIconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={cn("size-4 shrink-0", className)}>
      <rect width="24" height="24" rx="7" className="fill-yape" />
      <text
        x="12"
        y="16.5"
        textAnchor="middle"
        fontSize="15"
        fontWeight="800"
        fontFamily="ui-sans-serif, system-ui, sans-serif"
        className="fill-yape-foreground"
      >
        y
      </text>
    </svg>
  );
}
