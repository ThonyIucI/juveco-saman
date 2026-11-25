import { cn } from "@juveco/ui/lib/utils";

import { type IMatch, type IMatchSide, teamNameOf, winnerOf } from "@/modules/public/data/relampago-2026";

/** «Máster Samán Chico» → «Samán Chico»: dentro de la llave el prefijo sobra. */
export const shortTeamName = (team: string): string => team.replace(/^Máster /, "");

/*
  Las cajas son claras sobre el azul marino. El ganador va en dorado y el perdedor atenuado
  (slate-600 sobre blanco: 7:1, AA).
*/
export const sideToneClass = (isPlayed: boolean, isWinner: boolean): string => {
  if (!isPlayed) {
    return "text-[#14214A]";
  }
  return isWinner ? "bg-gold font-semibold text-gold-foreground" : "text-slate-600";
};

/** Los goles a 16 px y, si se definió por penales, «(p)» pequeño junto al del ganador. */
export function Goals({ side, isWinner }: { side: IMatchSide; isWinner: boolean }) {
  if (side.goals === null) {
    return null;
  }
  return (
    <span className="flex shrink-0 items-baseline gap-1 text-base font-semibold tabular-nums">
      {isWinner && side.penalties !== undefined && (
        <span aria-label="por penales" className="text-xs font-normal">
          (p)
        </span>
      )}
      {side.goals}
    </span>
  );
}

interface ISideRowProps {
  side: IMatchSide;
  isPlayed: boolean;
  isWinner: boolean;
  hasBestLoserCaption: boolean;
}

/** Una fila del partido: el equipo a 14 px y sus goles. Sin equipo, una casilla punteada. */
function SideRow({ side, isPlayed, isWinner, hasBestLoserCaption }: ISideRowProps) {
  const team = teamNameOf(side);
  if (team === null) {
    return (
      <div className="flex flex-1 items-center px-1.5">
        <div className="h-6 w-full rounded-full border border-dashed border-slate-300" />
      </div>
    );
  }

  return (
    <div className={cn("flex flex-1 items-center gap-2 px-3", sideToneClass(isPlayed, isWinner))}>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm leading-tight">{shortTeamName(team)}</span>
        {hasBestLoserCaption && side.source?.outcome === "BEST_LOSER" && (
          <span className="block text-xs leading-tight font-normal">Mejor perdedor</span>
        )}
      </span>
      <Goals side={side} isWinner={isWinner} />
    </div>
  );
}

interface IBracketMatchProps {
  match: IMatch;
  /** En el mapa de escritorio el rótulo va en su propia etiqueta; en vertical, en la fila. */
  hasBestLoserCaption?: boolean;
  className?: string;
}

/** Un partido: pastilla clara de dos filas; el ganador en dorado; punteada si aún no hay equipos. */
export default function BracketMatch({ match, hasBestLoserCaption = false, className }: IBracketMatchProps) {
  const winner = winnerOf(match);
  const isPlayed = winner !== null;
  const isEmpty = teamNameOf(match.home) === null && teamNameOf(match.away) === null;

  return (
    <div
      role="group"
      aria-label={match.label}
      className={cn(
        "flex h-18 flex-col overflow-hidden rounded-xl",
        isEmpty ? "border border-dashed border-gold/70" : "divide-y divide-slate-200 bg-white",
        className,
      )}
    >
      {[match.home, match.away].map((side, index) => (
        <SideRow
          key={index}
          side={side}
          isPlayed={isPlayed}
          isWinner={winner === side}
          hasBestLoserCaption={hasBestLoserCaption}
        />
      ))}
    </div>
  );
}
