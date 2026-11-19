import type { IActivityTeamResource } from "@juveco/shared/activity-teams";

import { useRequest } from "@/common/hooks/use-request";
import { listActivityTeamsRequest } from "@/modules/activities/services/activity-team.service";

/** Los equipos de un campeonato. `onUpsert` y `onRemove` los mantienen al día sin recargar. */
export const useListActivityTeams = () => {
  const request = useRequest<IActivityTeamResource[]>();

  const handler = (activityId: string, signal?: AbortSignal) =>
    request.handleRequest(() => listActivityTeamsRequest(activityId, signal));

  /* Uno nuevo va al final: la lista sigue el orden de inscripción. */
  const onUpsert = (saved: IActivityTeamResource) =>
    request.setData((previous) => {
      const teams = previous ?? [];
      return teams.some((team) => team.id === saved.id)
        ? teams.map((team) => (team.id === saved.id ? saved : team))
        : [...teams, saved];
    });

  const onRemove = (id: string) =>
    request.setData((previous) => (previous ?? []).filter((team) => team.id !== id));

  return { teams: request.data ?? [], loading: request.loading, handler, onUpsert, onRemove };
};
