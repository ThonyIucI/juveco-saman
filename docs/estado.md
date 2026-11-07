# Estado del proyecto

Última actualización: 2026-11-07.

## Hecho

**Base**
- Monorepo pnpm: `@juveco/{shared,db,auth,env,ui,config}` más `apps/server` y `apps/web`.
- API con Hono, Drizzle (D1) y better-auth; web con Vite, React 19, TanStack Router/Form, Tailwind v4 y shadcn.
- Respuestas de la API con el sobre `{success, data, error}` y errores en español.

**Usuarios y acceso**
- Una sola tabla `users` para todas las personas: nombres, apellidos, barrio, WhatsApp (número o usuario) y nota.
- Roles: `USER` (no entra a la app), `ADMIN` y `SUPERADMIN`.
- El superadmin da acceso a un usuario (correo + contraseña) y este pasa a `ADMIN`. A un administrador no se le puede eliminar desde la lista.
- El login vive en tablas `auth_*` que apuntan a la persona. La sesión trae la persona y su rol.
- Un teléfono o un usuario de WhatsApp no se puede repetir.
- Al crear un usuario, el superadmin puede encender el switch «Dar acceso a la app» y poner correo y contraseña en el mismo formulario (`POST /users` con `access`). Si el login falla, no queda la persona a medias. El modal «Dar acceso» sigue para quien ya existe.

**Barrios**
- Tabla `neighborhoods` para la llave foránea, pero el código los lee de `packages/shared/src/neighborhoods.ts` (UUID v7 fijos).
- Seed por migración: Santa Rosa, Ramón Castilla, María Auxiliadora, El Patio, Nueva Esperanza.
- Un test comprueba que las constantes y la tabla coincidan.

**Diseño**
- Paleta del logo (azul rey, dorado, seis colores de las manos) y modo oscuro tomado de Stitch.
- Plus Jakarta Sans como fuente; IBM Plex Mono para números.
- La página es de Juveco en general: el inicio y el login no mencionan el bingo.

**Verificado por Thony:** `pnpm install`, `pnpm check-types` y `pnpm test` pasan.

## En curso: despliegue a Cloudflare

Ver los pasos en [tecnico/despliegue.md](tecnico/despliegue.md).

- API en `juveco-api.gaiamundo.com` y web en `juveco-saman.gaiamundo.com`.
- El front mostraba `Failed to fetch` al cargar la sesión: la API solo permitía el origen `juveco.gaiamundo.com`. Se corrigió `CORS_ORIGIN` a `juveco-saman.gaiamundo.com`; **falta redesplegar la API** (`pnpm deploy:server`) y confirmar que el login carga.
- Falta crear el superadmin en producción con el seed y, después, quitar el secret `SEED_TOKEN`.

## En curso: Bingo II - 2026 (evento el 21 nov 2026)

- Tabla `activities` (nombre, tipo `BINGO`, fecha, precio por defecto). «Bingo II - 2026» la crea una migración de seed; no hay pantalla para crear actividades.
- `/actividades` lleva directo a la única actividad. Cuando haya otra, ahí va el listado en cards.
- Tabla `activity_items` (genérica: en un bingo, las cartillas; cómo se llama sale de `activityItemLabels`): una fila por ítem con serie, comprador, vendedor (el admin de la sesión), precio y nota. El precio se copia de la actividad y se cambia por ítem. API: `/activities/:id/items`.
- El barrio se muestra en un badge con su color (paleta de segmentos de id-pos): Nueva Esperanza verde, El Patio ladrillo, Ramón Castilla dorado, María Auxiliadora celeste, Santa Rosa rosado.
- Serie repetida en el mismo bingo: se deja guardar y se avisa en el formulario y en la card.
- Cualquier admin vende, edita y elimina. A una persona con cartillas no se la puede eliminar.
- Pantalla: cards también en escritorio, como la de reportes de ventas de id-pos: header gris con serie, comprador y `⋯`; cuerpo con el barrio y «Por cobrar» (verde S/ 0.00 si pagó, amarillo si pagó una parte, rojo si no pagó). Mientras no haya pagos, todo sale en rojo. Buscador y botón de sincronizar junto al título; cuántas se vendieron va en los KPIs, no en el subtítulo. El comprador se elige con `UserSearch` y se puede crear ahí mismo.

## Pendiente (en este orden; cada parte se prueba antes de seguir)

1. **Detalle de la cartilla** y cómo se muestran los pagos en la card.
2. **Pagos**: Yape o efectivo, pagos parciales. La deuda se calcula a partir de los pagos.
3. **Premios y KPIs**: los premios salen del dinero del bingo. Panel con lo recaudado, lo que se debe y lo que falta por cobrar.
4. **Contenido de Juveco**: proyectos, quiénes somos y demás secciones públicas.

## Decisiones abiertas

- Si se quiere un correo de superadmin configurable por variable (`SEED_EMAIL`) en lugar de ir en el curl.
- Franja de colores del logo: hoy son segmentos; en Stitch era un degradado.
- Un administrador nuevo todavía no tiene forma de quitarle el acceso; hoy solo se le da.
