import type { IPublicPrize } from "@juveco/shared/public";
import { cn } from "@juveco/ui/lib/utils";
import { Gift, Trophy } from "lucide-react";

import { RevealGroup, RevealItem } from "./reveal";

/** Los premios del bingo: quién donó cada uno y, ya sorteados, quién ganó (en dorado). */
export default function PrizeGrid({ prizes }: { prizes: IPublicPrize[] }) {
  if (prizes.length === 0) {
    return <p className="text-muted-foreground">Muy pronto publicaremos los premios.</p>;
  }

  return (
    <RevealGroup className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
      {prizes.map((prize, index) => (
        <RevealItem key={`${prize.name}-${index}`}>
          <article
            className={cn(
              "flex h-full flex-col rounded-lg border bg-card p-4",
              prize.winner ? "border-gold" : "border-border",
            )}
          >
            <Gift aria-hidden className="mb-3 size-6 text-primary" />
            <h4 className="font-heading font-bold text-foreground">{prize.name}</h4>
            {prize.donorName && <p className="mt-1 text-sm text-muted-foreground">Donó: {prize.donorName}</p>}
            {prize.winner && (
              <p className="mt-auto flex items-start gap-1.5 pt-3 text-sm font-semibold text-foreground">
                <Trophy aria-hidden className="mt-0.5 size-4 shrink-0 text-gold-ink" />
                <span>
                  {prize.winner.name}
                  <span className="block font-mono text-xs text-muted-foreground">cartilla {prize.winner.serial}</span>
                </span>
              </p>
            )}
          </article>
        </RevealItem>
      ))}
    </RevealGroup>
  );
}
