import type {
  IDwellingCreateInput,
  IDwellingDetailResource,
  IDwellingInput,
  IDwellingResource,
  IMeterMatchResource,
} from "@juveco/shared/dwellings";
import type { IFamilyMemberSaveInput, IFamilyMemberUpdateInput } from "@juveco/shared/families";

import { apiRequest } from "@/lib/api";

const DWELLINGS_PATH = "/dwellings";
const dwellingPath = (dwellingId: string) => `${DWELLINGS_PATH}/${dwellingId}`;
const familyPath = (dwellingId: string, familyId: string) => `${dwellingPath(dwellingId)}/families/${familyId}`;
const membersPath = (dwellingId: string) => `${dwellingPath(dwellingId)}/members`;

/** Las viviendas con su resumen, de la más nueva a la más vieja. */
export const listDwellingsRequest = (signal?: AbortSignal) =>
  apiRequest<IDwellingResource[]>(DWELLINGS_PATH, { signal });

/** Una vivienda con sus familias e integrantes. */
export const getDwellingRequest = (dwellingId: string, signal?: AbortSignal) =>
  apiRequest<IDwellingDetailResource>(dwellingPath(dwellingId), { signal });

/** El código que le tocaría hoy a una vivienda nueva del barrio. */
export const getNextDwellingCodeRequest = (neighborhoodId: string, signal?: AbortSignal) =>
  apiRequest<{ code: string }>(`${DWELLINGS_PATH}/next-code?neighborhoodId=${neighborhoodId}`, { signal });

/** Otras viviendas con ese medidor (solo avisa). */
export const findMeterMatchesRequest = (meterNumber: string, exceptId?: string, signal?: AbortSignal) => {
  const params = new URLSearchParams({ meterNumber, ...(exceptId && { exceptId }) });
  return apiRequest<IMeterMatchResource[]>(`${DWELLINGS_PATH}/meter-matches?${params.toString()}`, { signal });
};

export const createDwellingRequest = (payload: IDwellingCreateInput) =>
  apiRequest<IDwellingDetailResource>(DWELLINGS_PATH, { method: "POST", body: payload });

export const updateDwellingRequest = (dwellingId: string, payload: IDwellingInput) =>
  apiRequest<IDwellingDetailResource>(dwellingPath(dwellingId), { method: "PATCH", body: payload });

export const deleteDwellingRequest = (dwellingId: string) =>
  apiRequest<{ id: string }>(dwellingPath(dwellingId), { method: "DELETE" });

/* Las escrituras de integrantes y familias responden la vivienda completa, ya al día. */
export const createMemberRequest = (dwellingId: string, payload: IFamilyMemberSaveInput) =>
  apiRequest<IDwellingDetailResource>(membersPath(dwellingId), { method: "POST", body: payload });

export const updateMemberRequest = (dwellingId: string, memberId: string, payload: IFamilyMemberUpdateInput) =>
  apiRequest<IDwellingDetailResource>(`${membersPath(dwellingId)}/${memberId}`, { method: "PATCH", body: payload });

export const deleteMemberRequest = (dwellingId: string, memberId: string) =>
  apiRequest<IDwellingDetailResource>(`${membersPath(dwellingId)}/${memberId}`, { method: "DELETE" });

export const deleteFamilyRequest = (dwellingId: string, familyId: string) =>
  apiRequest<IDwellingDetailResource>(familyPath(dwellingId, familyId), { method: "DELETE" });
