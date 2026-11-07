import type { TAuth, TSession, TSessionUser } from "@juveco/auth";
import type { users } from "@juveco/db/schema/users";

/** Variables que los middlewares dejan en el contexto de Hono. */
export interface IAppVariables {
  auth: TAuth;
  /** El login (correo) de la sesión. */
  authUser: TSessionUser;
  session: TSession["session"];
  /** La persona que entró, con su rol: de acá salen los permisos. */
  user: typeof users.$inferSelect;
}

export type TAppEnv = { Variables: IAppVariables };
