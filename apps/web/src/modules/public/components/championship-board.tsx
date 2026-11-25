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

import { Reveal, RevealGroup, RevealItem } from "./reveal";

const TOP_SCORERS = 5;

const scorersLine = (side: IMatchSide) =>
  side.scorers.map((scorer) => (scorer.goals > 1 ? `${scorer.name} (${scorer.goals})` : scorer.name)).join(", ");

/**
 * Resultados del campeonato como un marcador (en código, Thony 2026-11-25): cada partido en
 * una fila con los goleadores debajo de su equipo; al costado, los goleadores del torneo.
 */
export default function ChampionshipBoard() {
  const scorers = topScorers(MATCH_DAYS).slice(0, TOP_SCORERS);

  return (
    <div className="grid gap-8 lg:grid-cols-[1.7fr_1fr]">
      <div className="space-y-8">
        {MATCH_DAYS.map((day) => (
          <div key={day.title}>
            <Reveal className="mb-3 flex flex-wrap items-baseline gap-x-3">
              <h2 className="font-heading text-xl font-semibold text-foreground">{day.title}</h2>
              <p className="text-sm text-muted-foreground">
                {formatLongDate(day.date)} · {day.description}
              </p>
            </Reveal>
            <RevealGroup className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
              {day.matches.map((match) => (
                <RevealItem key={match.label}>
                  <MatchRow match={match} />
                </RevealItem>
              ))}
            </RevealGroup>
          </div>
        ))}
      </div>

      {scorers.length > 0 && (
        <Reveal delay={0.15} className="h-fit rounded-lg border border-border bg-card p-4">
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
                  <span className="block truncate text-base font-medium text-foreground">{scorer.name}</span>
                  <span className="block truncate text-sm text-muted-foreground">{scorer.team}</span>
                </span>
                <span className="font-heading text-xl font-bold text-foreground tabular-nums">{scorer.goals}</span>
              </li>
            ))}
          </ol>
        </Reveal>
      )}
    </div>
  );
}

function MatchRow({ match }: { match: IMatch }) {
  const winner = winnerOf(match);
  const isPlayed = winner !== null;
  const notes = [
    isPlayed && match.home.penalties !== undefined ? `Penales ${match.home.penalties} – ${match.away.penalties}` : null,
    match.redCards.length > 0 ? `Roja: ${match.redCards.map((card) => card.name).join(", ")}` : null,
  ].filter(Boolean);

  return (
    <div className="px-4 py-3">
      <p className="mb-1.5 text-xs font-medium tracking-wide text-muted-foreground uppercase">{match.label}</p>
      <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-3">
        <TeamCell side={match.home} isWinner={winner === match.home} align="right" />
        <span className="mt-0.5 rounded-md bg-muted px-3 py-0.5 font-heading text-xl font-bold whitespace-nowrap text-foreground tabular-nums">
          {isPlayed ? `${match.home.goals} – ${match.away.goals}` : "vs"}
        </span>
        <TeamCell side={match.away} isWinner={winner === match.away} align="left" />
      </div>
      {notes.length > 0 && <p className="mt-2 text-center text-sm text-muted-foreground">{notes.join(" · ")}</p>}
    </div>
  );
}

function TeamCell({ side, isWinner, align }: { side: IMatchSide; isWinner: boolean; align: "left" | "right" }) {
  return (
    <div className={cn("min-w-0", align === "right" && "text-right")}>
      <p
        className={cn(
          "flex items-center gap-1.5 text-base font-medium text-foreground",
          align === "right" && "justify-end",
          isWinner && "font-semibold",
        )}
      >
        {isWinner && align === "left" && <Trophy aria-label="Ganó" className="size-4 shrink-0 text-gold-ink" />}
        <span className="min-w-0">{side.team}</span>
        {isWinner && align === "right" && <Trophy aria-label="Ganó" className="size-4 shrink-0 text-gold-ink" />}
      </p>
      {side.scorers.length > 0 && <p className="mt-0.5 text-xs text-muted-foreground">{scorersLine(side)}</p>}
    </div>
  );
}
