import type { IActivityExpenseInput, IActivityExpenseResource } from "@juveco/shared/activity-expenses";
import { toast } from "sonner";

import { useRequest } from "@/common/hooks/use-request";
import { updateActivityMovementRequest } from "@/modules/activities/services/activity-finance.service";
import { type TMovementKind, movementLabels } from "@/modules/activities/utils/movements";

export const useUpdateActivityMovement = (kind: TMovementKind) => {
  const { loading, handleRequest } = useRequest<IActivityExpenseResource>();

  const handler = (movement: IActivityExpenseResource, payload: IActivityExpenseInput) =>
    handleRequest(async () => {
      const updated = await updateActivityMovementRequest(kind, movement, payload);
      toast.success(`${movementLabels[kind].singularCapitalized} «${updated.concept}» actualizado`);
      return updated;
    });

  return { loading, handler };
};
