import { cn } from "@juveco/ui/lib/utils";

import { MATCH_DAYS, topScorers } from "@/modules/public/data/relampago-2026";

import { Reveal } from "./reveal";

const TOP_SCORERS = 5;

/** Los goleadores del torneo: posición, nombre a 14 px, equipo y goles. */
export default function ScorersList() {
  const scorers = topScorers(MATCH_DAYS).slice(0, TOP_SCORERS);
  if (scorers.length === 0) {
    return null;
  }

  return (
    <Reveal delay={0.1} className="h-fit rounded-lg border border-border bg-card p-4">
      <h2 className="font-heading text-xl font-semibold text-foreground">Goleadores</h2>
      <ol className="mt-3 space-y-3">
        {scorers.map((scorer, index) => (
          <li key={`${scorer.name}-${scorer.team}`} className="flex items-center gap-3">
            <span
              className={cn(
                "flex size-7 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
                index === 0 ? "bg-gold text-gold-foreground" : "bg-muted text-muted-foreground",
              )}
            >
              {index + 1}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium text-foreground">{scorer.name}</span>
              <span className="block truncate text-xs text-muted-foreground">{scorer.team}</span>
            </span>
            <span className="text-base font-semibold text-foreground tabular-nums">{scorer.goals}</span>
          </li>
        ))}
      </ol>
    </Reveal>
  );
}
