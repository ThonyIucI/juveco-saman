import { cn } from "@juveco/ui/lib/utils";

import { type IMatch, type IMatchSide, teamNameOf, winnerOf } from "@/modules/public/data/relampago-2026";

import { Goals, shortTeamName, sideToneClass } from "./bracket-match";

function FinalSlot({ side, isPlayed, isWinner }: { side: IMatchSide; isPlayed: boolean; isWinner: boolean }) {
  const team = teamNameOf(side);
  if (team === null) {
    return <div className="h-14 rounded-xl border border-dashed border-gold/80" />;
  }
  return (
    <div
      className={cn(
        "flex h-14 flex-col items-center justify-center rounded-xl bg-white px-2",
        sideToneClass(isPlayed, isWinner),
      )}
    >
      <span className="max-w-full truncate text-sm leading-tight">{shortTeamName(team)}</span>
      <Goals side={side} isWinner={isWinner} />
    </div>
  );
}

/** Las dos casillas de la final, una al lado de la otra; punteadas y vacías hasta que haya semifinales. */
export default function FinalSlots({ match, className }: { match: IMatch; className?: string }) {
  const winner = winnerOf(match);
  return (
    <div role="group" aria-label={match.label} className={cn("grid grid-cols-2 gap-4", className)}>
      <FinalSlot side={match.home} isPlayed={winner !== null} isWinner={winner === match.home} />
      <FinalSlot side={match.away} isPlayed={winner !== null} isWinner={winner === match.away} />
    </div>
  );
}
