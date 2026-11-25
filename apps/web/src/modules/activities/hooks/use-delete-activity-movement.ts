import type { IActivityExpenseResource } from "@juveco/shared/activity-expenses";
import { toast } from "sonner";

import { useRequest } from "@/common/hooks/use-request";
import { deleteActivityMovementRequest } from "@/modules/activities/services/activity-finance.service";
import { type TMovementKind, movementLabels } from "@/modules/activities/utils/movements";

export const useDeleteActivityMovement = (kind: TMovementKind) => {
  const { loading, handleRequest } = useRequest<{ id: string }>();

  const handler = (movement: IActivityExpenseResource) =>
    handleRequest(async () => {
      const deleted = await deleteActivityMovementRequest(kind, movement);
      toast.success(`${movementLabels[kind].singularCapitalized} «${movement.concept}» eliminado`);
      return deleted;
    });

  return { loading, handler };
};
