import type { IPersonInput } from "@juveco/shared/people";
import type { EUserRole } from "@juveco/shared/roles";
import type { IUserResource } from "@juveco/shared/users";

import { apiRequest } from "@/lib/api";

/** Acceso al editar: con contraseña vacía (si ya tenía acceso) no se cambia. */
export interface IEditAccessPayload {
  email: string;
  password?: string;
}

/** `access` solo el superadmin: `null` quita el acceso; sin `access`, no se toca. */
export type TUpdateUserPayload = Partial<IPersonInput> & { access?: IEditAccessPayload | null };

export interface IGrantAccessPayload {
  /** Hoy solo ADMIN; si no se manda, el server usa ADMIN. */
  role?: EUserRole.ADMIN;
  email: string;
  password: string;
}

/** Alta de una persona; con `access` (solo superadmin) nace ya con su login. */
export interface ICreateUserPayload extends IPersonInput {
  access?: IGrantAccessPayload;
}

/** Todas las personas de Juveco. */
export const listUsersRequest = (signal?: AbortSignal) =>
  apiRequest<IUserResource[]>("/users", { signal });

export const createUserRequest = (payload: ICreateUserPayload) =>
  apiRequest<IUserResource>("/users", { method: "POST", body: payload });

export const updateUserRequest = (id: string, payload: TUpdateUserPayload) =>
  apiRequest<IUserResource>(`/users/${id}`, { method: "PATCH", body: payload });

export const deleteUserRequest = (id: string) =>
  apiRequest<{ id: string }>(`/users/${id}`, { method: "DELETE" });

/** Solo SUPERADMIN: le crea su login y lo pasa a administrador. */
export const grantAccessRequest = (id: string, payload: IGrantAccessPayload) =>
  apiRequest<IUserResource>(`/users/${id}/access`, { method: "POST", body: payload });
