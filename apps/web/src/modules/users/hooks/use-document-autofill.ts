import { useStore } from "@tanstack/react-form";
import { useEffect, useRef } from "react";

import { isoToWrittenDate } from "@/common/utils/person-form";
import type { TPersonFormApi } from "@/modules/users/components/person-fields";
import { useDocumentLookup } from "@/modules/users/hooks/use-document-lookup";

const AUTOFILL_FIELDS = ["firstName", "paternalLastName", "maternalLastName", "birthDate", "gender"] as const;
type TAutofillField = (typeof AUTOFILL_FIELDS)[number];

/**
 * Autocompletar una persona nueva con su DNI (RENIEC vía id-pos) en cualquier formulario con los
 * campos de `personFormSchema`: al completar los 8 dígitos llena nombres, apellidos, fecha de
 * nacimiento y género.
 *
 * Se acuerda de lo que puso: al cambiar el DNI, lo que vino del DNI anterior se reemplaza por lo
 * del nuevo, pero lo que se escribió o corrigió a mano no se pisa. `isEnabled` en falso (editar,
 * o la persona ya está registrada) no consulta.
 */
export const useDocumentAutofill = (form: TPersonFormApi, isEnabled: boolean) => {
  const documentNumber = useStore(form.store, (state) => state.values.documentNumber as string);
  const { result, isLooking } = useDocumentLookup(documentNumber, isEnabled);
  /* Lo último que puso el autocompletado en cada campo. */
  const filledRef = useRef<Partial<Record<TAutofillField, string>>>({});

  useEffect(() => {
    if (!result) {
      return;
    }
    const next: Record<TAutofillField, string> = {
      firstName: result.firstName,
      paternalLastName: result.paternalLastName,
      maternalLastName: result.maternalLastName,
      birthDate: result.birthDate ? isoToWrittenDate(result.birthDate) : "",
      gender: result.gender ?? "",
    };
    for (const name of AUTOFILL_FIELDS) {
      const current = form.getFieldValue(name) as string;
      /* Vacío, o todavía con lo que puso el DNI anterior: se reemplaza. Escrito a mano: se respeta. */
      const isOurs = current === "" || current === filledRef.current[name];
      if (isOurs && current !== next[name]) {
        form.setFieldValue(name, next[name]);
      }
      if (isOurs) {
        filledRef.current[name] = next[name];
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result]);

  return { isLooking, isFilled: result !== null };
};
