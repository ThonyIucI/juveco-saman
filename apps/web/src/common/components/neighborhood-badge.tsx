import { Badge } from "@juveco/ui/components/badge";
import { cn } from "@juveco/ui/lib/utils";
import { type INeighborhood, NEIGHBORHOOD_IDS } from "@juveco/shared/neighborhoods";
import { MapPin } from "lucide-react";

/*
  Un color por barrio (acordado 2026-11-07), con la paleta de los segmentos de id-pos: fondo
  pastel y texto oscuro del mismo tono. En modo oscuro, el fondo apagado y el texto claro.
*/
const NEIGHBORHOOD_COLOR_CLASS: Record<string, string> = {
  /* Verde. */
  [NEIGHBORHOOD_IDS.NUEVA_ESPERANZA]: "bg-[#D5F4E2] text-[#1B7943] dark:bg-[#1B7943]/30 dark:text-[#8FE0B0]",
  /* Rojizo ladrillo. */
  [NEIGHBORHOOD_IDS.EL_PATIO]: "bg-[#F8DDD2] text-[#8A3A1C] dark:bg-[#8A3A1C]/35 dark:text-[#F2B39A]",
  /* Dorado. */
  [NEIGHBORHOOD_IDS.RAMON_CASTILLA]: "bg-[#FFEBCC] text-[#663E00] dark:bg-[#8A5A00]/35 dark:text-[#F5CF85]",
  /* Celeste. */
  [NEIGHBORHOOD_IDS.MARIA_AUXILIADORA]: "bg-[#DCEFFB] text-[#1D5E85] dark:bg-[#1D5E85]/35 dark:text-[#9BD3F5]",
  /* Rosado. */
  [NEIGHBORHOOD_IDS.SANTA_ROSA]: "bg-[#FFE6EF] text-[#994E69] dark:bg-[#994E69]/35 dark:text-[#F5B3CB]",
};

interface INeighborhoodBadgeProps {
  /** `null`: «Sin barrio» en gris. */
  neighborhood: INeighborhood | null;
  /** El globito de mapa va solo en las cards; en el select de barrio, sin él (Thony, 2026-11-07). */
  hasIcon?: boolean;
}

/** El barrio de una persona en su color, con el globito de mapa. */
export default function NeighborhoodBadge({ neighborhood, hasIcon = true }: INeighborhoodBadgeProps) {
  if (!neighborhood) {
    return (
      <Badge color="neutral">
        {hasIcon && <MapPin aria-hidden />}
        Sin barrio
      </Badge>
    );
  }

  return (
    <Badge className={cn(NEIGHBORHOOD_COLOR_CLASS[neighborhood.id])}>
      {hasIcon && <MapPin aria-hidden />}
      {neighborhood.name}
    </Badge>
  );
}
