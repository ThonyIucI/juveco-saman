import type { IPublicPrize } from "@juveco/shared/public";
import { Trophy } from "lucide-react";

import { SITE } from "@/modules/public/data/site";

import { RevealGroup, RevealItem } from "./reveal";

/**
 * Los premios del bingo en filas compactas: premio, quién lo donó y, ya sorteado, quién ganó.
 * En escritorio son tres columnas; en celular, el donante y el ganador van debajo del premio.
 */
export default function PrizeTable({ prizes }: { prizes: IPublicPrize[] }) {
  if (prizes.length === 0) {
    return <p className="text-base text-muted-foreground">Muy pronto publicaremos los premios.</p>;
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <div className="hidden grid-cols-3 gap-4 border-b border-border bg-muted/50 px-4 py-2 text-xs font-medium tracking-wide text-muted-foreground uppercase md:grid">
        <span>Premio</span>
        <span>Donó</span>
        <span>Ganó</span>
      </div>
      <RevealGroup className="divide-y divide-border">
        {prizes.map((prize, index) => (
          <RevealItem key={`${prize.name}-${index}`} className="px-4 py-2.5 md:grid md:grid-cols-3 md:items-center md:gap-4">
            <p className="text-base font-medium text-foreground">{prize.name}</p>
            <p className="text-sm text-muted-foreground">
              <span className="md:hidden">Donó: </span>
              {prize.donorName ?? SITE.shortName}
            </p>
            <p className="text-sm text-foreground">
              {prize.winner ? (
                <span className="flex items-center gap-1.5">
                  <Trophy aria-hidden className="size-4 shrink-0 text-gold-ink" />
                  <span>
                    {prize.winner.name} <span className="font-mono text-xs text-muted-foreground">· {prize.winner.serial}</span>
                  </span>
                </span>
              ) : (
                <span className="hidden text-muted-foreground md:inline">Por sortear</span>
              )}
            </p>
          </RevealItem>
        ))}
      </RevealGroup>
    </div>
  );
}
