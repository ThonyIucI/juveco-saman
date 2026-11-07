/**
 * Rol de una persona en `users.role` (acordado 2026-11-07).
 *
 * - `USER`: cualquier persona registrada. No entra a la app.
 * - `ADMIN`: un usuario al que el superadmin le dio acceso (correo y contraseña).
 * - `SUPERADMIN`: Thony. Además de todo lo de un administrador, da acceso a otros.
 */
export enum EUserRole {
  USER = "USER",
  ADMIN = "ADMIN",
  SUPERADMIN = "SUPERADMIN",
}

export type TUserRole = `${EUserRole}`;

export const userRoleLabels: Record<TUserRole, string> = {
  [EUserRole.USER]: "Usuario",
  [EUserRole.ADMIN]: "Administrador",
  [EUserRole.SUPERADMIN]: "Superadministrador",
};

/** Normaliza el rol que llega del backend; cae a USER (el menos privilegiado) si no coincide. */
export const parseUserRole = (value: string | null | undefined): TUserRole => {
  const isKnownRole = Object.values(EUserRole).some((role) => role === value);
  return isKnownRole ? (value as TUserRole) : EUserRole.USER;
};

/** Si el rol puede entrar a la app. */
export const canSignIn = (role: TUserRole): boolean => role !== EUserRole.USER;
