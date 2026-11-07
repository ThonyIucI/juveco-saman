# Convenciones de código

Reglas tomadas de `~/own/yiya-accounts/docs/tecnico/convenciones.md` (que a su vez adapta
`~/idbi/id-backend/docs/RULES-DEV-GUIDELINES.md` y `~/own/saas/planning/rules.md`) el
2026-11-07, adaptadas a Juveco. **Las que están acá son las que valen**: lo que de esas guías
no está acá no aplica (Laravel, yup, react-hook-form, `idbi-components`).

## Código TS/React

### Nombres y tipos

- **Interfaces `IFoo`, types `TFoo`, enums `EFoo`.** Nunca un `type` con `I` ni una
  `interface` con `T`.
- **Una forma que se repite se declara una vez**, como interface base, y las demás la
  extienden. `Pick` / `Omit` solo cuando no se pueda extender.
- Opciones de dominio fijas: enum con su objeto de labels (`EUserRole` + `userRoleLabels`).
  Variantes de la UI van como union `TFoo`.
- Sin `any` ni `unknown`, salvo datos de afuera que se validan después.
- **Nombres en inglés y camelCase**; constantes en `UPPER_SNAKE_CASE`; booleanos con `is`,
  `has`, `should`, `can`. Los textos que ve la persona, en español.
- **Sin abreviaciones ni monosílabos**: `items.map((option) => option.id)`, nunca
  `(o) => o.id`; `catch (error)`, nunca `catch (e)`.

### Funciones

- Arrow functions para todo lo que no es componente. Los componentes son
  `export default function Nombre()`.
- Una arrow con 2 o más sentencias va en varias líneas.
- **Parámetros:** hasta 2, posicionales; 3 o más, un solo objeto desestructurado.
- **No incrustar llamadas como argumento:** el resultado va primero a una variable con nombre.
- Sin valores sueltos: rutas, límites, tiempos y tipos van en constantes con nombre.

### Archivos e imports

- Un componente por archivo, en **kebab-case** (`user-form-modal.tsx`).
- `export default` para componentes; sin barrels: se importa del archivo directo.
- Lo que se repite en dos módulos va a `common/` (componentes, hooks, utils).

### Hooks y estado

- Hooks de petición instanciados como objeto: `const ListUsers = useListUsers()`
  → `ListUsers.data`, `.handler`, `.loading`.
- Sin `useState` aparte para un listado: el `data` del hook, con `onUpsert(item)` y
  `onRemove(id)`.
- Las peticiones se disparan desde el componente de la pantalla, no con un `useEffect`
  dentro del hook.
- Flags de abrir/cerrar con `useBoolean`.
- Mínimo de `useEffect`, `useMemo` y `useCallback`.

### Pantallas

- **Skeleton mientras carga**, con la forma del contenido final; nunca el estado vacío
  mientras la petición sigue.
- Toda mutación muestra que está cargando, avisa el error y sincroniza la lista sin recargar.
- **Ninguna falla queda solo en consola** (acordado 2026-11-07): si algo falla, la persona
  ve un toast que explica qué pasó. El detalle técnico puede ir además a la consola, nunca
  en lugar del toast. Ojo con better-auth: si el servidor no responde, lanza en vez de
  llamar a `onError`, así que va en `try/catch`.
- **Toda acción destructiva pide confirmación** en modal, con la opción del menú en rojo.
- Ningún botón se deshabilita: al clic se muestra el error.
- El texto de un botón nunca se parte en dos líneas.
- Para enfocar un campo al abrir una modal, nunca `autoFocus`.

### Formularios (acordado 2026-11-07)

- **Placeholders sin ejemplos**: «Ingresa los nombres», «Ingresa el correo», «Elige el
  barrio». Nunca «Ej. Ana María» ni un número de ejemplo.
- **La nota va siempre al final.**
- **Modal ancha (`width="lg"`) y todo el formulario en 2 columnas en desktop**; una columna en
  celular. Nunca 3 campos en una fila.
- Secciones dentro de una modal (p. ej. «Crear usuario» con su switch) se separan con una
  línea fina, como en id-pos; nunca con una caja de fondo gris.
- Un dato que se puede escribir de dos formas (número o usuario de WhatsApp) va en **un solo
  campo con tabs de ícono** (`SegmentedTabs`), no en dos campos a la vez.

### Alcance de los cambios

1. **Solo se toca lo que se pidió.** Describir cómo debería comportarse algo no es una orden
   de hacerlo.
2. **Si el mensaje trae preguntas, primero se responden** y se propone cómo se va a hacer;
   se codea cuando Thony lo aprueba.
3. **Antes de tocar un flujo, se recorre entero.**

---

Lo que sigue es propio de Juveco.

## API

- Un archivo de rutas por recurso en `apps/server/src/routes/<recurso>.ts`.
- Toda respuesta con el sobre `{ success, data, error }` (`lib/response.ts`).
- Validación con zod usando **siempre** `validateJson` (`lib/validator.ts`).
- Permisos con `requireAuth` (ADMIN o SUPERADMIN) y `requireSuperadmin`.

## Personas y acceso

- Una sola tabla `users` para todas las personas. Roles: `USER` (no entra), `ADMIN` y
  `SUPERADMIN`.
- El login vive en las tablas `auth_*`, que apuntan a la persona por `userId`.
- Solo el superadmin da acceso, al crear (`POST /users` con `access`) o después
  (`POST /users/:id/access`). Si el login falla al crear, la persona no queda a medias.
- **Barrios**: se leen de `packages/shared/src/neighborhoods.ts` (UUID v7 fijos); uno nuevo va
  ahí **y** en una migración.
- **Teléfonos**: `country_prefix` («51») y el número en dígitos; en la API
  `{ countryPrefix, number }`. Validar y formatear con `@juveco/shared/phones`.

## Base de datos

- Esquema en `packages/db/src/schema/<tabla>.ts`. Tablas en plural.
- Migraciones **solo** con `pnpm db:generate`, nunca SQL a mano.
- Escrituras de varias filas en `db.batch([...])`.
- **La base local depende del `database_id`** de `wrangler.jsonc`: si cambia, wrangler usa
  otro archivo y la base local aparece vacía (pasó el 2026-11-07). Los datos siguen en el
  archivo anterior, en `apps/server/.wrangler/state/v3/d1/`.

## Errores en español

Todo error que ve la persona va en español y se entiende. Nunca inglés, IDs ni texto de
librerías.

| Origen | Dónde se traduce |
|---|---|
| better-auth | `lib/auth-errors.ts`, por `code` |
| Validación | Mensaje propio en cada campo; lo demás con `z.locales.es()` |
| Hono e inesperados | Mensaje genérico por status en `index.ts` |
| Front | Respaldos de `lib/api.ts` y todos los `toast` |

**Ver el detalle de un error** (como el `laravel.log`): en local, la terminal de
`pnpm dev:server`; en producción, `pnpm --filter server exec wrangler tail juveco-api` o
Workers → `juveco-api` → Logs.

## Quién corre qué

Thony corre todos los comandos (install, tests, check-types, build, migraciones, deploy,
git). Claude escribe el código y dice qué correr.
