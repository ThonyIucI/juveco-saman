import { Badge } from "@juveco/ui/components/badge";
import { EDwellingStatus, dwellingStatusLabels } from "@juveco/shared/dwellings";

type TBadgeColor = "neutral" | "yellow" | "orange" | "destructive";

/* El color nunca es el único indicador: el texto va siempre. */
const STATUS_COLOR: Record<EDwellingStatus, TBadgeColor> = {
  [EDwellingStatus.NONE]: "neutral",
  [EDwellingStatus.AFFECTED]: "yellow",
  [EDwellingStatus.SEVERELY_AFFECTED]: "orange",
  [EDwellingStatus.UNINHABITABLE]: "destructive",
};

interface IDwellingStatusBadgeProps {
  status: EDwellingStatus;
}

/** El estado de la vivienda en su color, de «Sin daño» (gris) a «Inhabitable» (rojo). */
export default function DwellingStatusBadge({ status }: IDwellingStatusBadgeProps) {
  return <Badge color={STATUS_COLOR[status]}>{dwellingStatusLabels[status]}</Badge>;
}
