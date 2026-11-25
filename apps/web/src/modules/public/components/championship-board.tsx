import Bracket from "./bracket";
import Expandable from "./expandable";
import MatchDetails from "./match-details";
import { Reveal } from "./reveal";
import ScorersList from "./scorers-list";

/**
 * Resultados del campeonato (en código, Thony 2026-11-25): la llave a la vista; tras «Ver goleadores y
 * detalle de los partidos», el detalle de cada partido jugado y, al costado, los goleadores.
 */
export default function ChampionshipBoard() {
  return (
    <div className="space-y-8">
      <Reveal>
        <Bracket />
      </Reveal>
      <Expandable label="Ver goleadores y detalle de los partidos">
        <div className="grid gap-8 pt-4 lg:grid-cols-[1.7fr_1fr]">
          <MatchDetails />
          <ScorersList />
        </div>
      </Expandable>
    </div>
  );
}
