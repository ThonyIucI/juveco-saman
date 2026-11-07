import { zValidator } from "@hono/zod-validator";
import type { ZodType } from "zod";

import { fail } from "./response";

const INVALID_INPUT_MESSAGE = "Revisa los datos enviados.";

/**
 * `zValidator` con el sobre estándar. Sin esto, un cuerpo inválido responde el objeto crudo
 * de zod, que no es `{ success, data, error }` y el front no puede mostrar. Se manda el
 * mensaje del primer problema: los esquemas los definen en español y, si un campo no trae
 * mensaje propio, zod usa su idioma español (ver `z.config` en `index.ts`).
 */
export const validateJson = <TSchema extends ZodType>(schema: TSchema) =>
  zValidator("json", schema, (result, context) => {
    if (!result.success) {
      return fail(context, result.error.issues[0]?.message ?? INVALID_INPUT_MESSAGE, 400);
    }
  });
