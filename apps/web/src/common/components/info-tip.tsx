import { Popover, PopoverContent, PopoverTrigger } from "@juveco/ui/components/popover";
import { Info } from "lucide-react";

const HOVER_OPEN_DELAY_MS = 100;

interface IInfoTipProps {
  /** Lo que hace el ícono, para el lector de pantalla («Ayuda sobre el material»). */
  label: string;
  /** El texto de ayuda. */
  children: string;
}

/**
 * Ícono (i) con ayuda al lado de una etiqueta: se abre al pasar el mouse en escritorio y al
 * tocarlo en el celular.
 */
export default function InfoTip({ label, children }: IInfoTipProps) {
  return (
    <Popover>
      <PopoverTrigger
        openOnHover
        delay={HOVER_OPEN_DELAY_MS}
        aria-label={label}
        className="inline-flex size-5 shrink-0 cursor-pointer items-center justify-center rounded-full text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-4 focus-visible:ring-ring/40"
      >
        <Info aria-hidden className="size-4" />
      </PopoverTrigger>
      <PopoverContent className="max-w-64 rounded-xl p-3 text-sm font-normal" side="top" sideOffset={6}>
        {children}
      </PopoverContent>
    </Popover>
  );
}
