import type { IProjectDetail, IProjectInput, IProjectResource } from "@juveco/shared/projects";

import { apiRequest } from "@/lib/api";

export const listProjectsRequest = (signal?: AbortSignal) =>
  apiRequest<IProjectResource[]>("/projects", { signal });

export const getProjectRequest = (id: string, signal?: AbortSignal) =>
  apiRequest<IProjectDetail>(`/projects/${id}`, { signal });

export const createProjectRequest = (payload: IProjectInput) =>
  apiRequest<IProjectResource>("/projects", { method: "POST", body: payload });

export const updateProjectRequest = (id: string, payload: IProjectInput) =>
  apiRequest<IProjectResource>(`/projects/${id}`, { method: "PATCH", body: payload });

export const closeProjectRequest = (id: string) =>
  apiRequest<IProjectResource>(`/projects/${id}/close`, { method: "POST" });

/** Solo el superadmin. */
export const reopenProjectRequest = (id: string) =>
  apiRequest<IProjectResource>(`/projects/${id}/reopen`, { method: "POST" });
