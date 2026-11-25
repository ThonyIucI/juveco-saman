/**
 * Resultados del Campeonato Relámpago 2026, en código y no en la base (Thony, 2026-11-25):
 * se publican tal como los pasó la mesa. Cuando se juegue la fecha 2, se completa acá.
 *
 * Ningún partido termina empatado: si hay empate, va a penales (`penalties`).
 */

export interface IScorer {
  name: string;
  goals: number;
}

export interface IMatchSide {
  team: string;
  /** `null`: todavía no se juega o no se sabe quién llega («Ganador semifinal 1»). */
  goals: number | null;
  /** Solo si se definió por penales. */
  penalties?: number;
  scorers: IScorer[];
}

export interface IMatch {
  label: string;
  home: IMatchSide;
  away: IMatchSide;
  redCards: { name: string; team: string }[];
}

export interface IMatchDay {
  title: string;
  /** «2026-11-22». */
  date: string;
  description: string;
  matches: IMatch[];
}

const pending = (team: string): IMatchSide => ({ team, goals: null, scorers: [] });

export const CHAMPIONSHIP_NAME = "Campeonato Relámpago 2026";

export const MATCH_DAYS: IMatchDay[] = [
  {
    title: "Fecha 1",
    date: "2026-11-22",
    description: "Pasan los 3 ganadores y el mejor perdedor.",
    matches: [
      {
        label: "Partido 1",
        home: {
          team: "Máster Atlético Grau",
          goals: 3,
          penalties: 0,
          scorers: [{ name: "Rudy Farías Villarreyes", goals: 3 }],
        },
        away: {
          team: "Máster Samán Chico",
          goals: 3,
          penalties: 1,
          scorers: [{ name: "Freddy Roland Castro Herrera", goals: 3 }],
        },
        redCards: [
          { name: "Rudy Farías Villarreyes", team: "Máster Atlético Grau" },
          { name: "Francisco Correa", team: "Máster Samán Chico" },
        ],
      },
      {
        label: "Partido 2",
        home: {
          team: "Máster La Palma",
          goals: 2,
          scorers: [
            { name: "Sebastián Saavedra Rojas", goals: 1 },
            { name: "Jorge Atoche Yamunaqué", goals: 1 },
          ],
        },
        away: {
          team: "Máster Calixto Romero",
          goals: 3,
          scorers: [
            { name: "José Silva More", goals: 1 },
            { name: "Juan Carlos Escobar Saavedra", goals: 1 },
            { name: "Juan Canova", goals: 1 },
          ],
        },
        redCards: [],
      },
      {
        label: "Partido 3",
        home: {
          team: "Máster La Noria",
          goals: 2,
          scorers: [
            { name: "Francisco Chávez Chanta", goals: 1 },
            { name: "Wilmer Gallo Castro", goals: 1 },
          ],
        },
        away: {
          team: "Máster El Cane",
          goals: 1,
          scorers: [{ name: "Carlos Córdoba", goals: 1 }],
        },
        redCards: [],
      },
    ],
  },
  {
    title: "Fecha 2",
    date: "2026-11-29",
    description: "Semifinales y final.",
    matches: [
      { label: "Semifinal 1", home: pending("Máster La Noria"), away: pending("Máster Samán Chico"), redCards: [] },
      { label: "Semifinal 2", home: pending("Máster Atlético Grau"), away: pending("Máster Calixto Romero"), redCards: [] },
      { label: "Final", home: pending("Ganador semifinal 1"), away: pending("Ganador semifinal 2"), redCards: [] },
    ],
  },
];

/** Ganador del partido por marcador o por penales; `null` si no se jugó. */
export const winnerOf = (match: IMatch): IMatchSide | null => {
  const { home, away } = match;
  if (home.goals === null || away.goals === null) {
    return null;
  }
  if (home.goals !== away.goals) {
    return home.goals > away.goals ? home : away;
  }
  return (home.penalties ?? 0) > (away.penalties ?? 0) ? home : away;
};

/** Goleadores de todo el campeonato, de más a menos goles y luego por nombre. */
export const topScorers = (days: IMatchDay[]): (IScorer & { team: string })[] => {
  const totals = new Map<string, IScorer & { team: string }>();
  for (const match of days.flatMap((day) => day.matches)) {
    for (const side of [match.home, match.away]) {
      for (const scorer of side.scorers) {
        const key = `${scorer.name}|${side.team}`;
        const goals = (totals.get(key)?.goals ?? 0) + scorer.goals;
        totals.set(key, { name: scorer.name, team: side.team, goals });
      }
    }
  }
  return [...totals.values()].sort(
    (first, second) => second.goals - first.goals || first.name.localeCompare(second.name, "es"),
  );
};
