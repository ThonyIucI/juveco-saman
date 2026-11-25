/**
 * Resultados del Campeonato Relámpago 2026, en código y no en la base (Thony, 2026-11-25):
 * se publican tal como los pasó la mesa. Cuando se juegue la fecha 2, solo se cargan los goles
 * de las semifinales y la final: la llave sale de `source` (de qué partido viene cada casilla)
 * y se llena sola, también el campeón.
 *
 * Ningún partido termina empatado: si hay empate, va a penales (`penalties`).
 */

export interface IScorer {
  name: string;
  goals: number;
}

/** De qué partido viene un equipo: el que ganó o, en la fecha 1, el mejor perdedor. */
export interface ISideSource {
  matchId: string;
  outcome: "WINNER" | "BEST_LOSER";
}

export interface IMatchSide {
  /**
   * `null`: todavía no se sabe quién llega; sale de `source` cuando ese partido se juegue.
   * En las semifinales ya se conocen los equipos y se anotan tal cual.
   */
  team: string | null;
  /** `null`: todavía no se juega. */
  goals: number | null;
  /** Solo si se definió por penales. */
  penalties?: number;
  scorers: IScorer[];
  /** De dónde sale este equipo; une la casilla con su partido en la llave. */
  source?: ISideSource;
}

export interface IMatch {
  /** Estable: lo usan las casillas de la llave (`source.matchId`). */
  id: string;
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

/**
 * Un ala de la llave: una semifinal y los partidos de la fecha 1 que la alimentan, de arriba
 * abajo. Un equipo que viene de otro ala (el mejor perdedor) no aparece en `feederIds`.
 */
export interface IBracketWing {
  semifinalId: string;
  feederIds: string[];
}

/** Un equipo que aún no se juega: sin goles. */
const waiting = (team: string | null, source: ISideSource): IMatchSide => ({ team, goals: null, scorers: [], source });

export const CHAMPIONSHIP_NAME = "Campeonato Relámpago 2026";

export const MATCH_DAYS: IMatchDay[] = [
  {
    title: "Fecha 1",
    date: "2026-11-22",
    description: "Pasan los 3 ganadores y el mejor perdedor.",
    matches: [
      {
        id: "partido-1",
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
        id: "partido-2",
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
        id: "partido-3",
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
      {
        id: "semifinal-1",
        label: "Semifinal 1",
        home: waiting("Máster La Noria", { matchId: "partido-3", outcome: "WINNER" }),
        away: waiting("Máster Samán Chico", { matchId: "partido-1", outcome: "WINNER" }),
        redCards: [],
      },
      {
        id: "semifinal-2",
        label: "Semifinal 2",
        home: waiting("Máster Atlético Grau", { matchId: "partido-1", outcome: "BEST_LOSER" }),
        away: waiting("Máster Calixto Romero", { matchId: "partido-2", outcome: "WINNER" }),
        redCards: [],
      },
      {
        id: "final",
        label: "Final",
        home: waiting(null, { matchId: "semifinal-1", outcome: "WINNER" }),
        away: waiting(null, { matchId: "semifinal-2", outcome: "WINNER" }),
        redCards: [],
      },
    ],
  },
];

/**
 * La llave como mapa de fase final: dos alas que convergen en la final del centro. El orden de
 * `feederIds` acerca los partidos que se juntan; las fechas salen de `MATCH_DAYS`.
 */
export const BRACKET = {
  left: { semifinalId: "semifinal-1", feederIds: ["partido-3", "partido-1"] } satisfies IBracketWing,
  right: { semifinalId: "semifinal-2", feederIds: ["partido-2"] } satisfies IBracketWing,
  finalId: "final",
};

export const ALL_MATCHES: IMatch[] = MATCH_DAYS.flatMap((day) => day.matches);

export const findMatch = (id: string): IMatch | null => ALL_MATCHES.find((match) => match.id === id) ?? null;

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

/** El equipo que perdió el partido; `null` si no se jugó. */
export const loserOf = (match: IMatch): IMatchSide | null => {
  const winner = winnerOf(match);
  if (!winner) {
    return null;
  }
  return winner === match.home ? match.away : match.home;
};

/** El equipo de una casilla: el anotado o, si no, el que salió del partido del que viene. */
export const teamNameOf = (side: IMatchSide): string | null => {
  if (side.team !== null) {
    return side.team;
  }
  const match = side.source ? findMatch(side.source.matchId) : null;
  if (!side.source || !match) {
    return null;
  }
  const origin = side.source.outcome === "WINNER" ? winnerOf(match) : loserOf(match);
  return origin ? teamNameOf(origin) : null;
};

/** Goleadores de todo el campeonato, de más a menos goles y luego por nombre. */
export const topScorers = (days: IMatchDay[]): (IScorer & { team: string })[] => {
  const totals = new Map<string, IScorer & { team: string }>();
  for (const match of days.flatMap((day) => day.matches)) {
    for (const side of [match.home, match.away]) {
      const team = teamNameOf(side);
      if (team === null) {
        continue;
      }
      for (const scorer of side.scorers) {
        const key = `${scorer.name}|${team}`;
        const goals = (totals.get(key)?.goals ?? 0) + scorer.goals;
        totals.set(key, { name: scorer.name, team, goals });
      }
    }
  }
  return [...totals.values()].sort(
    (first, second) => second.goals - first.goals || first.name.localeCompare(second.name, "es"),
  );
};
