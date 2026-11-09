# Accesos a la app

Decisiones sobre quién entra a Juveco y cómo se edita (Thony, 2026-11-09).

## Regla

- **Entra quien tiene acceso** (login con correo y contraseña en `auth_users`). Sin acceso
  no entra, sea cual sea su rol.
- El acceso lo da, cambia o quita **solo el superadmin**, desde la modal de crear o editar
  usuario (switch «Acceso a la app» con rol, correo y contraseña).
- El correo no puede repetirse entre logins. Si cambia la contraseña, se cierran las
  sesiones abiertas de esa persona.
- Apagar el switch a quien ya entraba le **quita el acceso**: se borra su login (sesiones y
  cuentas incluidas) y vuelve a rol Usuario.
- El acceso del superadmin (y el propio) no se edita desde la app.

## Pendiente: usuarios sin rol que entren

Hoy el server exige además un rol que pueda entrar: `canSignIn` en `@juveco/shared/roles`
deja fuera a `USER` aunque tenga login, y el switch solo ofrece el rol Administrador. Por
ahora no hay usuarios sin rol que deban entrar, así que se deja así.

Si algún día un `USER` debe entrar:

1. Quitar la condición de rol de `canSignIn` (`apps/server/src/middleware/require-role.ts`
   la usa): entrar dependería solo de tener login.
2. Definir qué puede hacer adentro: hoy `requireAuth` deja todo lo de administrador a
   cualquiera que entre, así que un `USER` con login podría vender, editar y eliminar.
3. Agregar `USER` a las opciones de rol del switch (`ASSIGNABLE_ROLES` en
   `user-form-modal.tsx`) y al esquema del server (`grantAccessSchema` en
   `apps/server/src/lib/user-access.ts`).
