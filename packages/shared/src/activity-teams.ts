/**
 * Equipos de un campeonato (acordado 2026-11-19, Campeonato Relámpago 2026). Cada equipo
 * tiene su nombre, un delegado y hasta 15 jugadores, todos personas de Juveco. El delegado va
 * aparte: puede jugar o no, y si juega se agrega también como jugador.
 *
 * La inscripción se copia del precio de la actividad al crear el equipo y se paga por partes,
 * igual que una cartilla. La deuda no se guarda: es la inscripción menos la suma de sus pagos.
 */
import type { IPaymentResource } from "./activity-item-payments";
import type { IActivityItemBuyer } from "./activity-items";

export const TEAM_NAME_MAX_LENGTH = 120;
export const TEAM_MAX_PLAYERS = 15;

export const TEAM_NAME_REQUIRED_MESSAGE = "Escribe el nombre del equipo.";
export const TEAM_NAME_LENGTH_MESSAGE = "El nombre va hasta 120 caracteres.";
export const TEAM_NAME_TAKEN_MESSAGE = "Ya hay un equipo con ese nombre en el campeonato.";
export const TEAM_DELEGATE_REQUIRED_MESSAGE = "Elige al delegado.";
export const TEAM_PLAYERS_MAX_MESSAGE = `Un equipo lleva hasta ${TEAM_MAX_PLAYERS} jugadores.`;
export const TEAM_PLAYER_REPEATED_MESSAGE = "Ese jugador ya está en la lista.";
export const NOT_A_CHAMPIONSHIP_MESSAGE = "Esta actividad no es un campeonato: no lleva equipos.";

/**
 * Un jugador no puede estar en dos equipos del mismo campeonato (Thony, 2026-11-19). Lo frena
 * la API y no la base: si la mesa lo permite el día del campeonato, se quita sin migrar.
 */
export const playerInOtherTeamMessage = (playerName: string, teamName: string): string =>
  `${playerName} ya juega en «${teamName}».`;

/** Una persona del equipo (delegado o jugador), con su barrio. */
export type IActivityTeamPerson = IActivityItemBuyer;

/** Un equipo tal como lo devuelve la API. */
export interface IActivityTeamResource {
  id: string;
  activityId: string;
  name: string;
  /** La inscripción, en soles con dos decimales (ver `money.ts`). */
  price: number;
  /** La suma de sus pagos; lo que falta cobrar es `price - paidAmount`. */
  paidAmount: number;
  delegate: IActivityTeamPerson;
  /** Ordenados por nombre. */
  players: IActivityTeamPerson[];
  note: string | null;
  createdAt: string;
}

/** Lo que se escribe al crear o editar un equipo. Al editar se manda completo. */
export interface IActivityTeamInput {
  name: string;
  delegateId: string;
  playerIds: string[];
  note: string | null;
}

/** Un pago de la inscripción de un equipo tal como lo devuelve la API. */
export interface IActivityTeamPaymentResource extends IPaymentResource {
  teamId: string;
}
