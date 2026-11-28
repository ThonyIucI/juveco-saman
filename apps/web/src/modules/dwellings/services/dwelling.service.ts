import type {
  IDwellingCreateInput,
  IDwellingDetailResource,
  IDwellingInput,
  IDwellingResource,
  IMeterMatchResource,
} from "@juveco/shared/dwellings";
import type { IFamilyCreateInput, IFamilyMemberInput, IFamilyUpdateInput } from "@juveco/shared/families";

import { apiRequest } from "@/lib/api";

const DWELLINGS_PATH = "/dwellings";
const dwellingPath = (dwellingId: string) => `${DWELLINGS_PATH}/${dwellingId}`;
const familiesPath = (dwellingId: string) => `${dwellingPath(dwellingId)}/families`;
const familyPath = (dwellingId: string, familyId: string) => `${familiesPath(dwellingId)}/${familyId}`;
const membersPath = (dwellingId: string, familyId: string) => `${familyPath(dwellingId, familyId)}/members`;

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

/* Las escrituras de familias e integrantes responden la vivienda completa, ya al día. */
export const createFamilyRequest = (dwellingId: string, payload: IFamilyCreateInput) =>
  apiRequest<IDwellingDetailResource>(familiesPath(dwellingId), { method: "POST", body: payload });

export const updateFamilyRequest = (dwellingId: string, familyId: string, payload: IFamilyUpdateInput) =>
  apiRequest<IDwellingDetailResource>(familyPath(dwellingId, familyId), { method: "PATCH", body: payload });

export const deleteFamilyRequest = (dwellingId: string, familyId: string) =>
  apiRequest<IDwellingDetailResource>(familyPath(dwellingId, familyId), { method: "DELETE" });

export const createMemberRequest = (dwellingId: string, familyId: string, payload: IFamilyMemberInput) =>
  apiRequest<IDwellingDetailResource>(membersPath(dwellingId, familyId), { method: "POST", body: payload });

export const updateMemberRequest = (
  dwellingId: string,
  familyId: string,
  memberId: string,
  payload: Pick<IFamilyMemberInput, "relationship">,
) =>
  apiRequest<IDwellingDetailResource>(`${membersPath(dwellingId, familyId)}/${memberId}`, {
    method: "PATCH",
    body: payload,
  });

export const deleteMemberRequest = (dwellingId: string, familyId: string, memberId: string) =>
  apiRequest<IDwellingDetailResource>(`${membersPath(dwellingId, familyId)}/${memberId}`, { method: "DELETE" });
