/**
 * Viviendas del empadronamiento. La vivienda es la casa física: su código lleva las iniciales
 * del barrio y un correlativo por barrio («SR-0001»). El número de medidor de luz es un dato
 * aparte, opcional y repetible (un medidor puede alimentar varias casas).
 *
 * Todo es dato **actual**, sin historial. El estado y el material son listas fijas con su
 * etiqueta: renombrarlas no toca el resto.
 */
import type { IFamilyResource } from "./families";
import type { INeighborhood } from "./neighborhoods";

export const DWELLING_METER_MAX_LENGTH = 20;
export const DWELLING_WALL_MATERIAL_OTHER_MAX_LENGTH = 120;
export const DWELLING_TEXT_MAX_LENGTH = 500;
export const DWELLING_COORDINATE_DECIMALS = 6;

/**
 * Donde abre el mapa si la vivienda no tiene ubicación y no hay GPS.
 * TODO (Thony): reemplazar por las coordenadas exactas de la plaza de Samán; estas son aproximadas.
 */
export const SAMAN_MAP_CENTER = { latitude: -15.3833, longitude: -70.1333 } as const;
export const DWELLING_CODE_DIGITS = 4;

export const DWELLING_LATITUDE_RANGE = { min: -90, max: 90 } as const;
export const DWELLING_LONGITUDE_RANGE = { min: -180, max: 180 } as const;

export const DWELLING_NEIGHBORHOOD_REQUIRED_MESSAGE = "Elige el barrio de la vivienda.";
export const DWELLING_METER_LENGTH_MESSAGE = "El medidor va hasta 20 caracteres.";
export const DWELLING_WALL_MATERIAL_OTHER_REQUIRED_MESSAGE = "Especifica el material de las paredes.";
export const DWELLING_WALL_MATERIAL_OTHER_LENGTH_MESSAGE = "El material va hasta 120 caracteres.";
export const DWELLING_TEXT_LENGTH_MESSAGE = "El texto va hasta 500 letras.";
export const DWELLING_LATITUDE_INVALID_MESSAGE = "La latitud va entre -90 y 90.";
export const DWELLING_LONGITUDE_INVALID_MESSAGE = "La longitud va entre -180 y 180.";
export const DWELLING_COORDINATES_PAIR_MESSAGE = "Escribe la latitud y la longitud juntas.";
export const DWELLING_STATUS_INVALID_MESSAGE = "Elige el estado de la vivienda.";
export const DWELLING_MATERIAL_INVALID_MESSAGE = "Elige un material de la lista.";

export const dwellingHasFamiliesMessage = (code: string): string =>
  `La vivienda ${code} tiene familias: primero elimínalas.`;

export const dwellingCodeTakenMessage = (expectedCode: string, nextCode: string): string =>
  `El código ${expectedCode} ya lo tomó otra vivienda. Ahora le toca ${nextCode}: confirma de nuevo.`;

export const meterAlreadyUsedMessage = (codes: readonly string[]): string =>
  `Este medidor ya está en ${codes.join(", ")}. Puedes seguir si comparten medidor.`;

/** «SR» + 1 → «SR-0001». */
export const formatDwellingCode = (prefix: string, sequence: number): string =>
  `${prefix}-${String(sequence).padStart(DWELLING_CODE_DIGITS, "0")}`;

/** Estado actual de la vivienda; el primero es el valor por defecto. */
export enum EDwellingStatus {
  NONE = "NONE",
  AFFECTED = "AFFECTED",
  SEVERELY_AFFECTED = "SEVERELY_AFFECTED",
  UNINHABITABLE = "UNINHABITABLE",
}

export const dwellingStatusLabels: Record<EDwellingStatus, string> = {
  [EDwellingStatus.NONE]: "Sin daño",
  [EDwellingStatus.AFFECTED]: "Afectada",
  [EDwellingStatus.SEVERELY_AFFECTED]: "Muy afectada",
  [EDwellingStatus.UNINHABITABLE]: "Inhabitable",
};

export const DEFAULT_DWELLING_STATUS = EDwellingStatus.NONE;

export const isDwellingStatus = (value: string): value is EDwellingStatus => value in dwellingStatusLabels;

/** Material predominante de las paredes, con la lista del censo del INEI. */
export enum EWallMaterial {
  BRICK_OR_CEMENT_BLOCK = "BRICK_OR_CEMENT_BLOCK",
  STONE_OR_ASHLAR_WITH_LIME = "STONE_OR_ASHLAR_WITH_LIME",
  ADOBE = "ADOBE",
  TAPIA = "TAPIA",
  QUINCHA = "QUINCHA",
  STONE_WITH_MUD = "STONE_WITH_MUD",
  WOOD = "WOOD",
  PLYWOOD_OR_CALAMINA_OR_MAT = "PLYWOOD_OR_CALAMINA_OR_MAT",
  OTHER = "OTHER",
}

export const wallMaterialLabels: Record<EWallMaterial, string> = {
  [EWallMaterial.BRICK_OR_CEMENT_BLOCK]: "Ladrillo o bloque de cemento",
  [EWallMaterial.STONE_OR_ASHLAR_WITH_LIME]: "Piedra o sillar con cal o cemento",
  [EWallMaterial.ADOBE]: "Adobe",
  [EWallMaterial.TAPIA]: "Tapia",
  [EWallMaterial.QUINCHA]: "Quincha (caña con barro)",
  [EWallMaterial.STONE_WITH_MUD]: "Piedra con barro",
  [EWallMaterial.WOOD]: "Madera",
  [EWallMaterial.PLYWOOD_OR_CALAMINA_OR_MAT]: "Triplay, calamina o estera",
  [EWallMaterial.OTHER]: "Otro",
};

export const isWallMaterial = (value: string): value is EWallMaterial => value in wallMaterialLabels;

/** Lo que se muestra como material: con «Otro», lo que se especificó. */
export const wallMaterialText = (
  material: EWallMaterial | null,
  other: string | null,
): string | null => {
  if (!material) {
    return null;
  }
  return material === EWallMaterial.OTHER && other ? other : wallMaterialLabels[material];
};

/** El enlace de Google Maps armado con las coordenadas; `null` sin ubicación. */
export const mapsUrlOf = (latitude: number | null, longitude: number | null): string | null =>
  latitude !== null && longitude !== null ? `https://www.google.com/maps?q=${latitude},${longitude}` : null;

/** Lo que se escribe en el formulario de una vivienda. El barrio solo viaja al crear. */
export interface IDwellingInput {
  /** `null` = sin medidor. */
  meterNumber: string | null;
  latitude: number | null;
  longitude: number | null;
  status: EDwellingStatus;
  wallMaterial: EWallMaterial | null;
  /** Solo con material «Otro»: qué material es (máx. 120). */
  wallMaterialOther: string | null;
  observation: string | null;
  note: string | null;
}

export interface IDwellingCreateInput extends IDwellingInput {
  neighborhoodId: string;
  /** El código que se le mostró a quien confirma: si otro lo ocupó, la API responde 409. */
  expectedCode: string;
}

/** Una vivienda en la lista. */
export interface IDwellingResource extends IDwellingInput {
  id: string;
  /** «SR-0001». */
  code: string;
  neighborhood: INeighborhood;
  familyCount: number;
  memberCount: number;
  /** Los nombres de los jefes de hogar, para reconocerla en la lista. */
  headNames: string[];
  createdAt: string;
}

/** Una vivienda con sus familias e integrantes. */
export interface IDwellingDetailResource extends IDwellingResource {
  families: IFamilyResource[];
}

/** Otra vivienda que ya tiene ese medidor. */
export interface IMeterMatchResource {
  id: string;
  code: string;
}
