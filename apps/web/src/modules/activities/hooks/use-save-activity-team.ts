import type { IActivityTeamInput, IActivityTeamResource } from "@juveco/shared/activity-teams";
import { toast } from "sonner";

import { useRequest } from "@/common/hooks/use-request";
import {
  createActivityTeamRequest,
  updateActivityTeamRequest,
} from "@/modules/activities/services/activity-team.service";

/** Crea un equipo o, si se pasa `team`, lo edita. */
export const useSaveActivityTeam = () => {
  const { loading, handleRequest } = useRequest<IActivityTeamResource>();

  const handler = (activityId: string, payload: IActivityTeamInput, team?: IActivityTeamResource) =>
    handleRequest(async () => {
      const saved = team
        ? await updateActivityTeamRequest(activityId, team.id, payload)
        : await createActivityTeamRequest(activityId, payload);
      toast.success(team ? `«${saved.name}» actualizado` : `«${saved.name}» inscrito`);
      return saved;
    });

  return { loading, handler };
};
