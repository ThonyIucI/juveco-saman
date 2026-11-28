import { useStore } from "@tanstack/react-form";

import { writtenDateToIso } from "@/common/utils/person-form";
import type { TPersonFormApi } from "@/modules/users/components/person-fields";
import { usePersonMatches } from "@/modules/users/hooks/use-person-matches";

/**
 * Los avisos de persona repetida (DNI, o nombre y fecha de nacimiento) de un formulario que
 * tiene los campos de `personFormSchema`. `exceptId`: la persona que se edita no cuenta.
 */
export const usePersonFormMatches = (form: TPersonFormApi, exceptId?: string) => {
  const documentNumber = useStore(form.store, (state) => state.values.documentNumber as string);
  const firstName = useStore(form.store, (state) => state.values.firstName as string);
  const paternalLastName = useStore(form.store, (state) => state.values.paternalLastName as string);
  const birthDate = useStore(form.store, (state) => state.values.birthDate as string);

  return usePersonMatches({
    documentNumber,
    firstName,
    paternalLastName,
    birthDateIso: writtenDateToIso(birthDate),
    exceptId,
  });
};
