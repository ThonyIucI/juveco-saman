import { Badge } from "@juveco/ui/components/badge";
import type { IActivityItemResource } from "@juveco/shared/activity-items";
import { formatSoles } from "@juveco/shared/money";
import { CircleCheck, CircleX, Clock, type LucideIcon } from "lucide-react";
import type { ComponentProps } from "react";

import { type TCollectionStatus, collectionOf } from "@/modules/activities/utils/activity-items";

/* Como el «A cobrar» de la card de reportes de ventas de id-pos (acordado 2026-11-07). */
export const COLLECTION_BADGE: Record<
  TCollectionStatus,
  { color: ComponentProps<typeof Badge>["color"]; icon: LucideIcon }
> = {
  PAID: { color: "success", icon: CircleCheck },
  PARTIAL: { color: "yellow", icon: Clock },
  UNPAID: { color: "destructive", icon: CircleX },
};

interface ICollectionBadgeProps {
  item: IActivityItemResource;
  /** Texto antes del monto («Por cobrar»); sin él, solo el monto. */
  label?: string;
}

/** Lo que falta cobrar: verde en S/ 0.00 si pagó todo, amarillo si pagó una parte, rojo si nada. */
export default function CollectionBadge({ item, label }: ICollectionBadgeProps) {
  const collection = collectionOf(item);
  const { color, icon: Icon } = COLLECTION_BADGE[collection.status];

  return (
    <Badge color={color} className="rounded-md tabular-nums">
      <Icon aria-hidden />
      {label && `${label} `}
      {formatSoles(collection.pending)}
    </Badge>
  );
}
