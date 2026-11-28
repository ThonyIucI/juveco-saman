/** Lo que un proveedor de consulta de DNI devolverá para autocompletar a la persona. */
export interface IDocumentLookupResult {
  firstName: string;
  paternalLastName: string;
  maternalLastName: string;
}

/**
 * El punto donde se autocompletarán nombres y apellidos con el DNI. Hoy no consulta a nadie y
 * devuelve `null`; cuando se conecte el proveedor (cuenta propia de consulta RENIEC, no el
 * gateway de id-pos) solo cambia este archivo: quien lo usa ya aplica lo que devuelva.
 */
export const useDocumentLookup = (documentNumber: string): IDocumentLookupResult | null => {
  void documentNumber;
  return null;
};
