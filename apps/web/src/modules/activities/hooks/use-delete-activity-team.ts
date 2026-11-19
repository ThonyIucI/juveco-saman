import type { IActivityTeamResource } from "@juveco/shared/activity-teams";
import { toast } from "sonner";

import { useRequest } from "@/common/hooks/use-request";
import { deleteActivityTeamRequest } from "@/modules/activities/services/activity-team.service";

export const useDeleteActivityTeam = () => {
  const { loading, handleRequest } = useRequest<{ id: string }>();

  const handler = (team: IActivityTeamResource) =>
    handleRequest(async () => {
      const deleted = await deleteActivityTeamRequest(team.activityId, team.id);
      toast.success(`«${team.name}» eliminado`);
      return deleted;
    });

  return { loading, handler };
};
