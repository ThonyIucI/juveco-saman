import { Badge } from "@juveco/ui/components/badge";
import { Button } from "@juveco/ui/components/button";
import { Skeleton } from "@juveco/ui/components/skeleton";
import { EPrizeOrigin, type IActivityPrizeResource, prizeOriginLabels } from "@juveco/shared/activity-prizes";
import { formatSoles } from "@juveco/shared/money";
import { fullName } from "@juveco/shared/people";
import { Gift, Plus, ShoppingBag } from "lucide-react";

import { DetailSection } from "@/common/components/detail-section";
import RowActions, { type IRowAction } from "@/common/components/row-actions";

const SKELETON_ROWS = 3;

interface IPrizeListProps {
  prizes: IActivityPrizeResource[];
  isLoading: boolean;
  buildActions: (prize: IActivityPrizeResource) => IRowAction[];
  onCreate: () => void;
}

/** Los premios: nombre, si fue donado (y por quién) o comprado (y cuánto costó). */
export default function PrizeList({ prizes, isLoading, buildActions, onCreate }: IPrizeListProps) {
  return (
    <DetailSection
      title="Premios"
      isBordered
      action={
        <Button type="button" size="sm" variant="outline" onClick={onCreate}>
          <Plus />
          Agregar
        </Button>
      }
    >
      {isLoading && prizes.length === 0 ? (
        <div className="space-y-2">
          {Array.from({ length: SKELETON_ROWS }, (_, index) => (
            <Skeleton key={index} className="h-11 w-full rounded-md" />
          ))}
        </div>
      ) : prizes.length === 0 ? (
        <p className="py-1 text-sm text-muted-foreground">Todavía no hay premios.</p>
      ) : (
        <ul className="-my-1 divide-y divide-border">
          {prizes.map((prize) => {
            const isDonated = prize.origin === EPrizeOrigin.DONATED;
            const Icon = isDonated ? Gift : ShoppingBag;
            return (
              <li key={prize.id} className="flex items-center gap-3 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="flex min-w-0 items-center gap-2">
                    <span className="truncate font-semibold text-foreground">{prize.name}</span>
                    <Badge color={isDonated ? "success" : "neutral"} className="shrink-0 rounded-md">
                      <Icon aria-hidden />
                      {prizeOriginLabels[prize.origin]}
                    </Badge>
                  </p>
                  <p className="truncate text-sm text-muted-foreground tabular-nums">
                    {isDonated
                      ? `Lo donó ${prize.donor ? fullName(prize.donor) : "—"}`
                      : `Costó ${formatSoles(prize.cost ?? 0)}`}
                    {prize.note && ` · ${prize.note}`}
                  </p>
                </div>
                <RowActions actions={buildActions(prize)} isBordered />
              </li>
            );
          })}
        </ul>
      )}
    </DetailSection>
  );
}
