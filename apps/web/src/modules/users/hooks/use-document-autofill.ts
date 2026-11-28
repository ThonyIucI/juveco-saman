import { useStore } from "@tanstack/react-form";
import { useEffect } from "react";

import { isoToWrittenDate } from "@/common/utils/person-form";
import type { TPersonFormApi } from "@/modules/users/components/person-fields";
import { useDocumentLookup } from "@/modules/users/hooks/use-document-lookup";

const NAME_FIELDS = ["firstName", "paternalLastName", "maternalLastName"] as const;

/**
 * Autocompletar una persona nueva con su DNI (RENIEC vía id-pos) en cualquier formulario con los
 * campos de `personFormSchema`: al completar los 8 dígitos llena nombres, apellidos, fecha de
 * nacimiento y género **que estén vacíos** (lo escrito no se pisa). `isEnabled` en falso (editar,
 * o la persona ya está registrada) no consulta.
 */
export const useDocumentAutofill = (form: TPersonFormApi, isEnabled: boolean) => {
  const documentNumber = useStore(form.store, (state) => state.values.documentNumber as string);
  const { result, isLooking } = useDocumentLookup(documentNumber, isEnabled);

  useEffect(() => {
    if (!result) {
      return;
    }
    for (const name of NAME_FIELDS) {
      if (form.getFieldValue(name) === "" && result[name]) {
        form.setFieldValue(name, result[name]);
      }
    }
    if (form.getFieldValue("birthDate") === "" && result.birthDate) {
      form.setFieldValue("birthDate", isoToWrittenDate(result.birthDate));
    }
    if (form.getFieldValue("gender") === "" && result.gender) {
      form.setFieldValue("gender", result.gender);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result]);

  return { isLooking, isFilled: result !== null };
};
