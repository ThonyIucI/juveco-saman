import type { IActivityResource } from "./activities";
import type { IActivityBalance } from "./activity-expenses";

/**
 * Eventos y proyectos (acordado 2026-11-17). Agrupan las actividades: la Chocolatada 2026 es
 * un evento con su bingo; el mural y las cámaras son proyectos. Cada etapa de una obra es un
 * proyecto nuevo («Ampliación de cámaras»). Cerrar un proyecto bloquea registrar cosas nuevas
 * en él y en sus actividades; solo el superadmin lo reabre.
 */

export enum EProjectType {
  EVENT = "EVENT",
  PROJECT = "PROJECT",
}

export type TProjectType = `${EProjectType}`;

export const PROJECT_TYPES = Object.values(EProjectType) as [TProjectType, ...TProjectType[]];

export const projectTypeLabels: Record<TProjectType, string> = {
  [EProjectType.EVENT]: "Evento",
  [EProjectType.PROJECT]: "Proyecto",
};

/** Solo cambia cómo se llaman las fechas en pantalla. */
export const projectDateLabels: Record<TProjectType, { start: string; end: string }> = {
  [EProjectType.EVENT]: { start: "Fecha del evento", end: "Hasta" },
  [EProjectType.PROJECT]: { start: "Inicio", end: "Inauguración" },
};

export const PROJECT_NAME_MAX_LENGTH = 120;
export const PROJECT_DESCRIPTION_MAX_LENGTH = 500;

export const PROJECT_TYPE_REQUIRED_MESSAGE = "Elige si es un evento o un proyecto.";
export const PROJECT_NAME_REQUIRED_MESSAGE = "Escribe el nombre.";
export const PROJECT_NAME_LENGTH_MESSAGE = `El nombre va hasta ${PROJECT_NAME_MAX_LENGTH} caracteres.`;
export const PROJECT_DESCRIPTION_LENGTH_MESSAGE = `La descripción va hasta ${PROJECT_DESCRIPTION_MAX_LENGTH} caracteres.`;
export const PROJECT_DATE_INVALID_MESSAGE = "Elige una fecha válida.";
export const PROJECT_END_BEFORE_START_MESSAGE = "La fecha de fin no puede ser antes que la de inicio.";
export const PROJECT_BENEFICIARIES_INVALID_MESSAGE = "Los beneficiarios son un número entero mayor a cero.";
export const PROJECT_CLOSED_MESSAGE = "El proyecto está cerrado: el superadministrador tiene que reabrirlo.";

/** Un proyecto tal como lo devuelve la API. */
export interface IProjectResource {
  id: string;
  type: TProjectType;
  name: string;
  description: string | null;
  /** «2026-11-21», sin hora. */
  startDate: string;
  endDate: string | null;
  /** En soles con dos decimales. */
  goalAmount: number | null;
  beneficiaryCount: number | null;
  /** Vacío = abierto. */
  closedAt: string | null;
  activityCount: number;
}

/** Lo que se escribe al crear o editar. */
export interface IProjectInput {
  type: TProjectType;
  name: string;
  description: string | null;
  startDate: string;
  endDate: string | null;
  goalAmount: number | null;
  beneficiaryCount: number | null;
}

/** Una actividad del proyecto con su balance, para el detalle. */
export interface IProjectActivity extends IActivityResource {
  balance: IActivityBalance;
}

/** El detalle de un proyecto: sus datos, lo ganado y sus actividades. */
export interface IProjectDetail {
  project: IProjectResource;
  progress: IProjectProgress;
  activities: IProjectActivity[];
}

/**
 * Lo ganado por las actividades del proyecto: cobrado menos premios comprados y gastos.
 * Cuando lleguen los aportes y gastos del proyecto (documentos 2 y 3), se suman y restan acá.
 */
export interface IProjectProgress {
  collected: number;
  expected: number;
  purchasedPrizes: number;
  expenses: number;
  currentProfit: number;
  expectedProfit: number;
}
