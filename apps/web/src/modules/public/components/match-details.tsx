import { Target } from "lucide-react";

import BallIcon from "@/common/components/icons/ball-icon";
import { ALL_MATCHES, type IMatch, type IMatchSide, teamNameOf, winnerOf } from "@/modules/public/data/relampago-2026";

import { shortTeamName } from "./bracket-match";
import { RevealGroup, RevealItem } from "./reveal";

const nameOf = (side: IMatchSide): string => shortTeamName(teamNameOf(side) ?? "");

function RedCardIcon() {
  return <span aria-label="Tarjeta roja" role="img" className="mt-0.5 inline-block h-4 w-3 shrink-0 rounded-[2px] bg-red-600" />;
}

function SideScorers({ side }: { side: IMatchSide }) {
  if (side.scorers.length === 0) {
    return null;
  }
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground">{nameOf(side)}</p>
      <ul className="space-y-0.5">
        {side.scorers.map((scorer) => (
          <li key={scorer.name} className="flex items-start gap-2 text-sm text-foreground">
            <BallIcon aria-label="Gol" className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <span>{scorer.goals > 1 ? `${scorer.name} (${scorer.goals})` : scorer.name}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function MatchCard({ match }: { match: IMatch }) {
  const winner = winnerOf(match);
  const hasPenalties = match.home.penalties !== undefined && match.away.penalties !== undefined;

  return (
    <article className="space-y-2 rounded-lg border border-border bg-card p-3">
      <div>
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{match.label}</p>
        <h3 className="text-sm font-semibold text-foreground">
          {nameOf(match.home)} {match.home.goals} a {match.away.goals} {nameOf(match.away)}
        </h3>
      </div>
      <SideScorers side={match.home} />
      <SideScorers side={match.away} />
      {hasPenalties && winner && (
        <p className="flex items-start gap-2 text-sm text-foreground">
          <Target aria-hidden className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          Penales: ganó {nameOf(winner)} {winner.penalties} a {winner === match.home ? match.away.penalties : match.home.penalties}
        </p>
      )}
      {match.redCards.length > 0 && (
        <ul className="space-y-0.5">
          {match.redCards.map((card) => (
            <li key={card.name} className="flex items-start gap-2 text-sm text-foreground">
              <RedCardIcon />
              <span>
                {card.name}, {shortTeamName(card.team)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}

/** El detalle de cada partido ya jugado: goleadores, penales y tarjetas rojas. */
export default function MatchDetails() {
  const played = ALL_MATCHES.filter((match) => winnerOf(match) !== null);
  if (played.length === 0) {
    return null;
  }

  return (
    <div>
      <h2 className="mb-3 font-heading text-xl font-semibold text-foreground">Detalle de los partidos</h2>
      <RevealGroup className="grid gap-3 sm:grid-cols-2">
        {played.map((match) => (
          <RevealItem key={match.id}>
            <MatchCard match={match} />
          </RevealItem>
        ))}
      </RevealGroup>
    </div>
  );
}
