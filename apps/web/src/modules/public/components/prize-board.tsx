import type { IPublicPrize } from "@juveco/shared/public";
import { Gift, Trophy } from "lucide-react";

/** Los premios del bingo con quién los donó y, ya sorteados, quién ganó. */
export default function PrizeBoard({ prizes }: { prizes: IPublicPrize[] }) {
  if (prizes.length === 0) {
    return <p className="text-sm text-muted-foreground">Pronto publicaremos los premios.</p>;
  }

  return (
    <ul className="divide-y divide-border">
      {prizes.map((prize, index) => (
        <li key={`${prize.name}-${index}`} className="flex items-start gap-3 py-2.5 first:pt-0 last:pb-0">
          <Gift aria-hidden className="mt-0.5 size-4.5 shrink-0 text-muted-foreground" />
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-foreground">{prize.name}</p>
            {prize.donorName && <p className="text-sm text-muted-foreground">Donado por {prize.donorName}</p>}
            {prize.winner && (
              <p className="mt-0.5 flex items-center gap-1.5 text-sm text-foreground">
                <Trophy aria-hidden className="size-4 shrink-0 text-gold-ink" />
                Ganó {prize.winner.name} con la cartilla{" "}
                <span className="font-mono font-semibold">{prize.winner.serial}</span>
              </p>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
