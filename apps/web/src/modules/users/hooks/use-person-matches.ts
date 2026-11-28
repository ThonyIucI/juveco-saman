import type { IPersonMatchResource } from "@juveco/shared/user-profiles";
import { useEffect, useState } from "react";

import { useFindPersonMatches } from "@/modules/users/hooks/use-find-person-matches";
import { MIN_PERSON_NAME_LENGTH_FOR_MATCH } from "@/modules/users/utils/user-search";

/* Se espera a que deje de escribir antes de preguntarle al servidor. */
const MATCH_DEBOUNCE_MS = 400;

interface IPersonMatchesParams {
  /** Lo escrito en el campo; solo se busca si ya son los 8 dígitos. */
  documentNumber: string;
  firstName: string;
  paternalLastName: string;
  /** «AAAA-MM-DD», o `null` si todavía no hay una fecha completa y válida. */
  birthDateIso: string | null;
  /** Al editar, la misma persona no cuenta como repetida. */
  exceptId?: string;
}

const DOCUMENT_NUMBER_PATTERN = /^\d{8}$/;

/**
 * Avisa de alguien repetido mientras se escribe el formulario de una persona:
 * - `documentMatch`: ya existe alguien con ese DNI (bloquea el guardado);
 * - `nameMatches`: sin DNI, hay quien tiene los mismos nombres, apellido paterno y fecha de
 *   nacimiento (solo avisa).
 */
export const usePersonMatches = ({
  documentNumber,
  firstName,
  paternalLastName,
  birthDateIso,
  exceptId,
}: IPersonMatchesParams) => {
  const FindByDocument = useFindPersonMatches();
  const FindByName = useFindPersonMatches();
  const [documentMatch, setDocumentMatch] = useState<IPersonMatchResource | null>(null);
  const [nameMatches, setNameMatches] = useState<IPersonMatchResource[]>([]);

  const trimmedDocument = documentNumber.trim();
  const trimmedFirstName = firstName.trim();
  const trimmedPaternal = paternalLastName.trim();
  const isDocumentComplete = DOCUMENT_NUMBER_PATTERN.test(trimmedDocument);
  const canMatchByName =
    trimmedDocument === "" &&
    trimmedFirstName.length >= MIN_PERSON_NAME_LENGTH_FOR_MATCH &&
    trimmedPaternal !== "" &&
    birthDateIso !== null;

  useEffect(() => {
    if (!isDocumentComplete) {
      setDocumentMatch(null);
      return;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      const found = await FindByDocument.handler(
        { documentNumber: trimmedDocument, exceptId },
        controller.signal,
      );
      if (!controller.signal.aborted && found) {
        setDocumentMatch(found[0] ?? null);
      }
    }, MATCH_DEBOUNCE_MS);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDocumentComplete, trimmedDocument, exceptId]);

  useEffect(() => {
    if (!canMatchByName || birthDateIso === null) {
      setNameMatches([]);
      return;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      const found = await FindByName.handler(
        { firstName: trimmedFirstName, paternalLastName: trimmedPaternal, birthDate: birthDateIso, exceptId },
        controller.signal,
      );
      if (!controller.signal.aborted && found) {
        setNameMatches(found);
      }
    }, MATCH_DEBOUNCE_MS);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canMatchByName, trimmedFirstName, trimmedPaternal, birthDateIso, exceptId]);

  return { documentMatch, nameMatches };
};
