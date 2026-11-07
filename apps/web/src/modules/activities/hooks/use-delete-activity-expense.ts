import type { IActivityExpenseResource } from "@juveco/shared/activity-expenses";
import { toast } from "sonner";

import { useRequest } from "@/common/hooks/use-request";
import { deleteActivityExpenseRequest } from "@/modules/activities/services/activity-finance.service";

export const useDeleteActivityExpense = () => {
  const { loading, handleRequest } = useRequest<{ id: string }>();

  const handler = (expense: IActivityExpenseResource) =>
    handleRequest(async () => {
      const deleted = await deleteActivityExpenseRequest(expense);
      toast.success(`Gasto «${expense.concept}» eliminado`);
      return deleted;
    });

  return { loading, handler };
};
