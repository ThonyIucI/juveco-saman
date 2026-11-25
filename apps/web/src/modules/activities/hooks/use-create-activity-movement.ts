import type { IActivityExpenseInput, IActivityExpenseResource } from "@juveco/shared/activity-expenses";
import { toast } from "sonner";

import { useRequest } from "@/common/hooks/use-request";
import { createActivityMovementRequest } from "@/modules/activities/services/activity-finance.service";
import { type TMovementKind, movementLabels } from "@/modules/activities/utils/movements";

export const useCreateActivityMovement = (kind: TMovementKind) => {
  const { loading, handleRequest } = useRequest<IActivityExpenseResource>();

  const handler = (activityId: string, payload: IActivityExpenseInput) =>
    handleRequest(async () => {
      const created = await createActivityMovementRequest(kind, activityId, payload);
      toast.success(`${movementLabels[kind].singularCapitalized} «${created.concept}» agregado`);
      return created;
    });

  return { loading, handler };
};
