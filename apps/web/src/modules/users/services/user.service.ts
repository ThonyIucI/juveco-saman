import type { IPersonInput } from "@juveco/shared/people";
import type { IUserResource } from "@juveco/shared/users";

import { apiRequest } from "@/lib/api";

export type TUpdateUserPayload = Partial<IPersonInput>;

export interface IGrantAccessPayload {
  email: string;
  password: string;
}

/** Todas las personas de Juveco. */
export const listUsersRequest = (signal?: AbortSignal) =>
  apiRequest<IUserResource[]>("/users", { signal });

export const createUserRequest = (payload: IPersonInput) =>
  apiRequest<IUserResource>("/users", { method: "POST", body: payload });

export const updateUserRequest = (id: string, payload: TUpdateUserPayload) =>
  apiRequest<IUserResource>(`/users/${id}`, { method: "PATCH", body: payload });

export const deleteUserRequest = (id: string) =>
  apiRequest<{ id: string }>(`/users/${id}`, { method: "DELETE" });

/** Solo SUPERADMIN: le crea su login y lo pasa a administrador. */
export const grantAccessRequest = (id: string, payload: IGrantAccessPayload) =>
  apiRequest<IUserResource>(`/users/${id}/access`, { method: "POST", body: payload });
