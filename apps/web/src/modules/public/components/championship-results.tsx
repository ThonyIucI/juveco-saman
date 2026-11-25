import { cn } from "@juveco/ui/lib/utils";
import { Trophy } from "lucide-react";

import { formatLongDate } from "@/common/utils/format-date";
import {
  type IMatch,
  type IMatchSide,
  MATCH_DAYS,
  topScorers,
  winnerOf,
} from "@/modules/public/data/relampago-2026";

/**
 * Resultados del campeonato (en código, Thony 2026-11-25): cada fecha con sus partidos, los
 * goleadores de cada equipo, penales y tarjetas rojas, y la tabla de goleadores.
 */
export default function ChampionshipResults() {
  const scorers = topScorers(MATCH_DAYS);

  return (
    <div className="space-y-6">
      {MATCH_DAYS.map((day) => (
        <div key={day.title} className="space-y-3">
          <div>
            <h3 className="font-heading font-bold text-foreground">
              {day.title} · {formatLongDate(day.date)}
            </h3>
            <p className="text-sm text-muted-foreground">{day.description}</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {day.matches.map((match) => (
              <MatchCard key={match.label} match={match} />
            ))}
          </div>
        </div>
      ))}

      {scorers.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-heading font-bold text-foreground">Goleadores</h3>
          <ol className="divide-y divide-border rounded-md border border-border">
            {scorers.map((scorer, index) => (
              <li key={`${scorer.name}-${scorer.team}`} className="flex items-center gap-3 px-3 py-2 text-sm">
                <span className="w-5 shrink-0 text-right text-muted-foreground tabular-nums">{index + 1}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-foreground">{scorer.name}</p>
                  <p className="truncate text-muted-foreground">{scorer.team}</p>
                </div>
                <span className="shrink-0 font-heading font-bold tabular-nums">{scorer.goals}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}

function MatchCard({ match }: { match: IMatch }) {
  const winner = winnerOf(match);
  const isPlayed = winner !== null;
  const byPenalties = isPlayed && match.home.penalties !== undefined;

  return (
    <article className="overflow-hidden rounded-md border border-border">
      <header className="flex items-center justify-between bg-muted/50 px-3 py-2 text-sm">
        <span className="font-semibold text-foreground">{match.label}</span>
        <span className="text-muted-foreground">{isPlayed ? "Jugado" : "Por jugar"}</span>
      </header>
      <div className="space-y-2 px-3 py-2.5">
        <SideRow side={match.home} isWinner={winner === match.home} />
        <SideRow side={match.away} isWinner={winner === match.away} />
        {byPenalties && (
          <p className="text-sm text-muted-foreground">
            Penales {match.home.penalties} – {match.away.penalties}
          </p>
        )}
        {match.redCards.length > 0 && (
          <p className="flex items-start gap-1.5 text-sm text-muted-foreground">
            <span aria-hidden className="mt-1 h-3 w-2 shrink-0 rounded-[2px] bg-destructive" />
            <span>
              <span className="sr-only">Tarjetas rojas: </span>
              {match.redCards.map((card) => card.name).join(", ")}
            </span>
          </p>
        )}
      </div>
    </article>
  );
}

function SideRow({ side, isWinner }: { side: IMatchSide; isWinner: boolean }) {
  return (
    <div>
      <div className="flex items-center gap-2">
        <span className={cn("min-w-0 flex-1 truncate", isWinner ? "font-bold text-foreground" : "text-foreground")}>
          {side.team}
        </span>
        {isWinner && <Trophy aria-label="Ganó" className="size-4 shrink-0 text-gold-ink" />}
        <span className="w-6 shrink-0 text-right font-heading text-lg font-bold tabular-nums">
          {side.goals ?? "–"}
        </span>
      </div>
      {side.scorers.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {side.scorers
            .map((scorer) => (scorer.goals > 1 ? `${scorer.name} (${scorer.goals})` : scorer.name))
            .join(", ")}
        </p>
      )}
    </div>
  );
}
