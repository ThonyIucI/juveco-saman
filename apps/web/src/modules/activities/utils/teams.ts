import { TEAM_MAX_PLAYERS, type IActivityTeamResource } from "@juveco/shared/activity-teams";

/** «Sin jugadores», «1 jugador», «12 de 15 jugadores». */
export const playerCountLabel = (count: number): string =>
  count === 0 ? "Sin jugadores" : count === 1 ? "1 jugador" : `${count} de ${TEAM_MAX_PLAYERS} jugadores`;

/**
 * El número de cada equipo: su orden de inscripción en todo el campeonato (la API los manda en
 * ese orden). No cambia al filtrar ni al cobrar.
 */
export const teamNumbersOf = (teams: IActivityTeamResource[]): Map<string, number> =>
  new Map(teams.map((team, index) => [team.id, index + 1]));

/** «01», «02»… */
export const formatTeamNumber = (number: number): string => String(number).padStart(2, "0");
