# Paquete de contexto: empadronamiento

Proyecto: juveco-saman. Repo: /home/thony/own/juveco-saman. Generado: 2026-11-27 22:01.

## Ítem del backlog (docs/backlog/empadronamiento.md)

# Empadronamiento de viviendas, familias y personas de Samán

Fecha: 2026-11-27. Reemplaza a `empadronamiento-lluvias.md`, que quedó atado a la lluvia. Tamaño: **M**, máximo 4 slices.

Complejidad: alta — cambia `users`, que ya tiene datos (separar apellidos), y crea un dominio nuevo de varias tablas que tiene que servir para ayudas futuras de cualquier tipo.

## Para qué sirve

Juveco quiere conocer, vivienda por vivienda, quiénes viven en Samán y en qué condiciones, para que las autoridades puedan llevar ayuda a donde hace falta y presentar soluciones a los gobiernos distrital, provincial y regional.

Es un **censo genérico**. Servirá para cualquier ayuda: desastres, donativos, útiles escolares, herramientas agrícolas. Más adelante se le sumarán preguntas sociales (agua, luz, desagüe, educación, salud, economía).

**El primer uso es urgente.** El 26 de noviembre una lluvia prolongada dañó viviendas. El gobierno regional tiene material de ayuda, pero no lo entrega mientras no sepa a qué viviendas llevarlo. Juveco necesita **la data actual, ya**.

Quienes registran son los admins de la app. Thony también transcribe lo que otros llenen en papel o le manden por WhatsApp, así que el formulario tiene que ser rápido en celular y en escritorio.

## Cómo es la realidad que se modela

- **Vivienda:** la casa física. Su código es el **número del medidor de luz**, que de paso es un dato útil. Solo se registran las viviendas donde se encuentra a alguien.
- **Familia:** en una vivienda pueden vivir **varias familias**. Cada familia tiene su **jefe de hogar**, que es su contacto.
- **Persona:** cada integrante de una familia, con su parentesco respecto al jefe de su familia.
- **Datos actuales, sin historial.** Un censo posterior **actualiza** a las personas que ya existen y crea solo a las nuevas. No se guarda un registro por cada censo ni por cada evento.

## Decisiones de Thony (mandan sobre cualquier propuesta)

**Personas**
1. **Una persona censada es un usuario de la app** (la tabla `users` que ya existe), no una tabla aparte. Los datos del censo que no tienen todos los usuarios (DNI, fecha de nacimiento, género, condiciones) van en una **tabla de detalle** ligada al usuario. Si una propuesta prefiere otra forma, la justifica.
2. **Apellido paterno y apellido materno en campos separados**, para poder relacionar parentescos después. Esto toca a todos los usuarios: la propuesta dice qué pasa con los que ya tienen un solo campo de apellidos.
3. **DNI opcional.** Un recién nacido puede no tenerlo y sigue siendo habitante. Si se pone, no se repite.
4. **La edad sale de la fecha de nacimiento.** Menores y adultos mayores no se marcan a mano.
5. **Condiciones de prioridad por persona**, como opciones fijas que se pueden ampliar: gestante, dio a luz recientemente y con discapacidad. La prioridad de una familia sale de sus integrantes. Por ejemplo, es prioritaria si tiene niños pequeños, adultos mayores o alguna de esas condiciones. El detalle va en la nota.
6. **Teléfono:** el de contacto es el del jefe de cada familia; al resto, si lo tienen. **Nunca bloquea el registro**: puede vivir un anciano solo sin teléfono. En ese caso se pide el de un vecino o familiar como contacto (con a quién pertenece), y si no hay ninguno se guarda igual y la familia queda **marcada sin contacto**, visible en la lista y en el Excel.
6b. **Los censados aparecen en los selectores** de comprador, jugador, etc., como cualquier usuario. No es un problema: un usuario con vivienda es uno censado; los demás simplemente no tienen vivienda.

**Vivienda**

7. **Código de vivienda = número del medidor de luz.** Si no tiene medidor, la app genera un código con el prefijo del barrio y un correlativo (`SR-0001` para Santa Rosa). **Antes de guardar una vivienda sin medidor se pide confirmación** («Esta vivienda no tiene medidor, se le asignará SR-0001»), para no dejar una sin su medidor por olvido.
8. **Ubicación:** coordenadas y enlace a Google Maps. Da igual si casas vecinas comparten coordenadas aproximadas; en el lugar se distinguen.
9. **Estado de la vivienda:** 3 niveles, de afectada a inhabitable. Es un dato **actual** de la vivienda (no de la lluvia), con los nombres como constantes con etiqueta. Por ahora, «Afectada», «Muy afectada» e «Inhabitable»; se renombran después sin tocar el resto.
10. **Material:** el predominante de las paredes.
11. **Fotos:** la app no sube archivos. Cada vivienda guarda el enlace a su carpeta de Google Drive.
12. **Barrios:** solo los de Samán que ya están en el sistema. No hay barrios nuevos.
13. **Observación y nota:** opcionales.

**Padrón en Excel (`.xlsx`)**

14. **Se exporta todo**; se filtra en el mismo Excel.
15. **Una hoja de resumen** (conteos por barrio y por estado de vivienda, familias, personas y prioridades) y **una hoja por barrio**.
16. En la hoja de cada barrio, una fila por persona, agrupadas:
    - la celda de la **vivienda** se combina sobre todas sus filas;
    - la celda de la **familia** se combina sobre sus integrantes;
    - el **jefe de hogar** va primero, resaltado y con su teléfono;
    - después van los datos de cada persona (nombres, apellidos, DNI, fecha de nacimiento, edad, parentesco, condiciones);
    - **al final, el estado de la vivienda y los riesgos**, que es como más fácil se lee.
17. Para combinar celdas hace falta una librería de Excel; la propuesta elige cuál y dónde se genera el archivo.

**Alcance**

18. Se hace en la app, ya. **Máximo 4 slices**, en orden de flujo: primero registrar (vivienda, familias y personas), después consultar, al final exportar.
19. **Fuera de esta fase:** encuesta social, entregas de ayuda por campaña, historial, subir fotos, trabajo sin señal y flujo para actualizar un censo anterior. Nada de esto se construye ahora, pero el diseño no debe impedirlo.
20. Nada de esto aparece en la portada pública. DNI, fechas de nacimiento y condiciones son datos sensibles; los ven solo los admins.

## Lo que la propuesta tiene que resolver

- **Persona repetida.** Por DNI cuando lo tiene. Sin DNI, por ejemplo un bebé, avisar si hay alguien con el mismo nombre y la misma fecha de nacimiento.
- **Una persona en dos familias.** No debería pasar con los datos actuales; la propuesta dice cómo se evita.
- **Cambiar al jefe de una familia** sin rehacerla.

## Criterios de aceptación

1. Desde el celular, un admin registra una vivienda con sus familias e integrantes en menos de 5 minutos, y Thony puede transcribir una ficha de papel igual de rápido desde escritorio.
2. La lista de viviendas se filtra por barrio, estado y prioridad. El detalle muestra las familias, sus integrantes, la ubicación en Maps y la carpeta de fotos.
3. El Excel tiene la hoja de resumen y una hoja por barrio, con las celdas combinadas como dice la decisión 16.
4. Un DNI no se repite. Si alguien ya existe, el sistema avisa y lleva a su registro.
5. Una campaña de ayuda futura, de cualquier tipo, se puede colgar de viviendas, familias o personas sin rehacer estas tablas.

---

## Reglas del proyecto: ../CLAUDE.md

# Proyectos propios (carpeta own)

## Largo de los textos (acordado 2026-11-15)
- Todo texto que entra por la API tiene un máximo en la validación (zod `.max()`), no solo en la base.
- Largos estándar:
  - nombre: 120
  - concepto: 160
  - nota o descripción: 500
  - otro campo: se elige el más cercano y se anota en la propuesta.
- **SQLite / D1:** `VARCHAR(n)` y `TEXT` son lo mismo. SQLite no aplica el largo ni ahorra espacio, así que la columna va como `text` y el límite vive solo en la validación.
- **Postgres / MySQL:** la columna va con `varchar(n)` del mismo largo que la validación.
- En los diagramas Mermaid de las propuestas, el largo va como comentario del campo («máx. 120»).

## Cajas de página hasta abajo (acordado 2026-11-18)
- En escritorio, cuando la página va en cajas blancas sobre fondo gris (encabezado y cuerpo), la caja del cuerpo llega siempre hasta el final de la pantalla: cargando, vacía o con poco contenido.
- Así el fondo no cambia de forma al terminar de cargar y ninguna caja se ve recortada a la altura de su contenido.
- Se resuelve una sola vez en componentes comunes, no página por página: un contenedor de página que ocupa el alto disponible en columna y la caja del cuerpo que crece para llenarlo. En juveco-saman son `PageContainer` y `PageBox isFill`.
- Toda página nueva usa esos dos componentes. Si un repo todavía no los tiene, se crean antes de la primera página.

## Transición al cargar (acordado 2026-11-19)
- Todo lo que una página carga al entrar pasa por un mismo componente común, no por esqueletos sueltos en cada página. En juveco-saman es `Loadable`.
- Si los datos llegan en menos de 200 ms, no se muestra esqueleto y el contenido entra con un fundido.
- Si tardan más, se muestra el esqueleto al menos 300 ms y luego el contenido con el mismo fundido.
- El esqueleto tiene la forma de lo que va a aparecer (tabla, cards, KPIs), no un bloque genérico.
- Solo cuenta la primera carga: al sincronizar, los datos anteriores siguen a la vista.
- Toda página nueva lo usa desde el inicio.

---

## Reglas del proyecto: docs/estado.md

# Estado del proyecto

Última actualización: 2026-11-25.

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

**Despliegue en Cloudflare** (pasos en [tecnico/despliegue.md](tecnico/despliegue.md)): API en `juveco-api.gaiamundo.com` y web en `juveco-saman.gaiamundo.com`. El superadmin ya está creado y la app está en uso.

## En curso: Bingo II - 2026 (evento el 21 nov 2026)

- Tabla `activities` (nombre, tipo `BINGO`, fecha, precio por defecto). «Bingo II - 2026» la crea una migración de seed; no hay pantalla para crear actividades.
- `/actividades` lleva directo a la única actividad. Cuando haya otra, ahí va el listado en cards.
- Tabla `activity_items` (genérica: en un bingo, las cartillas; cómo se llama sale de `activityItemLabels`): una fila por ítem con serie, comprador, vendedor (el admin de la sesión), precio y nota. El precio se copia de la actividad y se cambia por ítem. API: `/activities/:id/items`.
- El barrio se muestra en un badge con su color (paleta de segmentos de id-pos): Nueva Esperanza verde, El Patio ladrillo, Ramón Castilla dorado, María Auxiliadora celeste, Santa Rosa rosado.
- Serie repetida en el mismo bingo: se deja guardar y se avisa en el formulario y en la card.
- Cualquier admin vende, edita y elimina. A una persona con cartillas no se la puede eliminar.
- Pantalla: cards también en escritorio, como la de reportes de ventas de id-pos: header gris con serie, comprador, acceso directo al pago (mientras falte cobrar) y `⋯`; cuerpo con el barrio y «Por cobrar» (verde S/ 0.00 si pagó, amarillo si pagó una parte, rojo si no pagó). Tocar la card abre el detalle en panel lateral. Buscador y botón de sincronizar junto al título. El comprador se elige con `UserSearch` y se puede crear ahí mismo.
- Escritorio: tabla (serie, comprador, barrio, vendedor, precio, por cobrar, acciones) y los filtros directos en una fila bajo el encabezado. Celular: cards (serie a 18 px, barrio al lado del nombre, vendedor y por cobrar en el cuerpo) y botón de filtros a la derecha del buscador que abre una modal. Filtros: estado de pago, vendedor y barrio.
- Pagos (tabla `activity_item_payments`): monto y método (Yape o efectivo); cobra el admin de la sesión y la fecha es la del registro. Un pago no puede pasar de lo que falta cobrar. La deuda no se guarda: es el precio menos la suma de los pagos. Un pago mal puesto se elimina desde el detalle. Un ítem con pagos no se elimina, y su precio no baja de lo pagado.
- Página de resumen (`/actividades/:id/resumen`), desde el botón «Resumen» de las cartillas (flotante en celular): KPIs (vendidas, recaudado por Yape y efectivo, total a recaudar, por cobrar, cómo van los pagos), balance, premios y gastos. API: `GET /activities/:id/summary` y `GET /activities/:id/balance`.
- Premios (`activity_prizes`): nombre, **Donado** (con donante, una persona; un negocio va en la nota) o **Comprado** (con costo), y nota. A una persona que donó un premio no se la puede eliminar.
- Gastos (`activity_expenses`): concepto, monto y nota (impresión de cartillas, alquileres…). Lo gastado en premios comprados no se repite acá.
- Balance: ingresos − premios comprados − gastos = ganancia, con lo ya cobrado («Actual») y si todos pagan. Los donados no restan, solo se cuentan.

## En curso: Campeonato Relámpago 2026 (22 y 29 nov 2026)

Acuerdos, reglas y fases en [propuestas/campeonatos/README.md](propuestas/campeonatos/README.md).

- **Fase 1, hecha el 2026-11-19 y en prueba:**
  - equipos con delegado y hasta 15 jugadores;
  - cobro de la inscripción por partes;
  - vista propia del campeonato en `/actividades/$activityId`.
- **2026-11-25:**
  - lo del campeonato entra al balance como ingresos y gastos;
  - los resultados se publican en la portada, escritos en código.

## En curso: portada pública y cierre de la Chocolatada (2026-11-25)

- **La raíz `/` ahora es la portada pública** y ya no manda al login. Muestra:
  - quiénes somos y las redes (Facebook y TikTok);
  - la Chocolatada con sus actividades;
  - los premios del bingo con su donante y, ya sorteados, su ganador;
  - los resultados del campeonato;
  - el balance **solo con conceptos, sin montos**, y quiénes apoyaron;
  - las últimas publicaciones de TikTok y Facebook, como avance.
- **API pública:** `GET /public/home`, sin sesión.
- **Ingresos genéricos por actividad (`activity_incomes`)**, con la misma forma que los gastos. Suman a lo cobrado y a lo esperado. Se registran en la vista del campeonato y en el resumen del bingo.
- **Ganador de cada premio:** se guarda la cartilla ganadora (`activity_prizes.winning_item_id`), y el ganador es su comprador.
  - Se marca desde el resumen del bingo con el ícono del trofeo, buscando por serie.
  - El bingo se postergó al **28 de noviembre**.

## Pendiente (en este orden; cada parte se prueba antes de seguir)

1. **Ganadores** de los premios (más adelante).
2. **Contenido de Juveco**: proyectos, quiénes somos y demás secciones públicas.
3. **Datos en caché al volver a una vista** (mapeado 2026-11-18, por detallar): hoy cada vista vuelve a pedir todo y muestra el esqueleto otra vez. La idea es mostrar al instante lo que ya se tenía y actualizar por detrás, migrando `useRequest` a TanStack Query. Toca todos los hooks de `modules/*/hooks`: se propone y estima antes de empezar.

## Decisiones abiertas

- Si se quiere un correo de superadmin configurable por variable (`SEED_EMAIL`) en lugar de ir en el curl.
- Franja de colores del logo: hoy son segmentos; en Stitch era un degradado.
- Un administrador nuevo todavía no tiene forma de quitarle el acceso; hoy solo se le da.

---

## Reglas del proyecto: docs/tecnico/convenciones.md

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
  También las que sacan a la persona de lo que estaba haciendo, como cerrar sesión
  (acordado 2026-11-09): un clic por error no puede costarle volver a entrar.
- Ningún botón se deshabilita: al clic se muestra el error.
- El texto de un botón nunca se parte en dos líneas.
- Botón principal con ancho mínimo (`min-w-32` en el pie de modal): un «Crear» corto no
  queda angosto. Ícono y texto juntos siempre centrados en la vertical (acordado 2026-11-09).
- Lo que llega después del skeleton entra con fundido (`FADE_IN_CLASS`), nunca de golpe.
- Tocar en la navegación la sección en la que ya se está no recarga: sube al inicio.
- Para enfocar un campo al abrir una modal, nunca `autoFocus`.
- **Ahorrar clics es imperativo** (acordado 2026-11-09): una acción que se usa seguido
  (editar, cobrar…) va como ícono directo (`inline: true` en `IRowAction`) en tabla, card y
  detalle, nunca escondida en `⋯`. En `⋯` queda solo lo que se usa poco.
  Excepción: en la vista compacta y en las cards de celular de cartillas se ahorra espacio y
  lo directo es **cobrar**; editar queda en `⋯` y en el detalle.
- **Altos de controles** (acordado 2026-11-09), definidos una sola vez en el tema
  (`--spacing-control*`), nunca a mano:
  - `h-control` / `size-control` (44 px): campos de formulario (input, select, teléfono,
    fecha) y sus botones.
  - `h-control-lg` / `size-control-lg` (52 px): la barra de la página (Agregar, Resumen,
    buscador, filtros, IconButton al lado). Lo que va junto mide igual.
- **Pesos y jerarquía**: no todo en negrita. Labels de campo en 14 px, peso 400 y gris
  `--label` (#495057, como id-pos); títulos de página en 600.

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

---

## Archivos del repo (para orientarse; lee los que necesites)

### packages/db/src/schema

- packages/db/src/schema/activities.ts
- packages/db/src/schema/activity-expenses.ts
- packages/db/src/schema/activity-incomes.ts
- packages/db/src/schema/activity-item-payments.ts
- packages/db/src/schema/activity-items.ts
- packages/db/src/schema/activity-prizes.ts
- packages/db/src/schema/activity-teams.ts
- packages/db/src/schema/auth.ts
- packages/db/src/schema/columns.ts
- packages/db/src/schema/index.ts
- packages/db/src/schema/neighborhoods.ts
- packages/db/src/schema/projects.ts
- packages/db/src/schema/users.ts

### packages/shared/src

- packages/shared/src/activities.ts
- packages/shared/src/activity-expenses.ts
- packages/shared/src/activity-incomes.ts
- packages/shared/src/activity-item-payments.ts
- packages/shared/src/activity-items.ts
- packages/shared/src/activity-prizes.ts
- packages/shared/src/activity-teams.ts
- packages/shared/src/api.ts
- packages/shared/src/dates.ts
- packages/shared/src/money.ts
- packages/shared/src/neighborhoods.ts
- packages/shared/src/people.ts
- packages/shared/src/phones.ts
- packages/shared/src/projects.ts
- packages/shared/src/public.ts
- packages/shared/src/roles.ts
- packages/shared/src/users.ts
- packages/shared/src/whatsapp.ts

### apps/server/src

- apps/server/src/index.ts
- apps/server/src/lib/app-env.ts
- apps/server/src/lib/auth-errors.ts
- apps/server/src/lib/errors.ts
- apps/server/src/lib/ids.ts
- apps/server/src/lib/person-guards.ts
- apps/server/src/lib/person-input.ts
- apps/server/src/lib/phone-input.ts
- apps/server/src/lib/project-guards.ts
- apps/server/src/lib/response.ts
- apps/server/src/lib/user-access.ts
- apps/server/src/lib/validator.ts
- apps/server/src/middleware/require-role.ts
- apps/server/src/routes/activities.ts
- apps/server/src/routes/activity-finances.ts
- apps/server/src/routes/activity-incomes.ts
- apps/server/src/routes/activity-teams.ts
- apps/server/src/routes/health.ts
- apps/server/src/routes/internal.ts
- apps/server/src/routes/me.ts
- apps/server/src/routes/projects.ts
- apps/server/src/routes/public.ts
- apps/server/src/routes/users.ts

### apps/web/src/modules

- apps/web/src/modules/activities/components/activity-balance.tsx
- apps/web/src/modules/activities/components/activity-item-card.tsx
- apps/web/src/modules/activities/components/activity-item-compact-list.tsx
- apps/web/src/modules/activities/components/activity-item-detail-panel.tsx
- apps/web/src/modules/activities/components/activity-item-filters.tsx
- apps/web/src/modules/activities/components/activity-item-form-modal.tsx
- apps/web/src/modules/activities/components/activity-item-grid.tsx
- apps/web/src/modules/activities/components/activity-item-table.tsx
- apps/web/src/modules/activities/components/activity-item-totals.tsx
- apps/web/src/modules/activities/components/activity-kpis.tsx
- apps/web/src/modules/activities/components/activity-meta.tsx
- apps/web/src/modules/activities/components/activity-overview-card.tsx
- apps/web/src/modules/activities/components/championship-kpis.tsx
- apps/web/src/modules/activities/components/championship-view.tsx
- apps/web/src/modules/activities/components/collection-badge.tsx
- apps/web/src/modules/activities/components/item-change-badge.tsx
- apps/web/src/modules/activities/components/item-change-form-modal.tsx
- apps/web/src/modules/activities/components/item-payment-form-modal.tsx
- apps/web/src/modules/activities/components/item-status-breakdown.tsx
- apps/web/src/modules/activities/components/movement-form-modal.tsx
- apps/web/src/modules/activities/components/movement-list.tsx
- apps/web/src/modules/activities/components/payment-form-modal.tsx
- apps/web/src/modules/activities/components/payment-list.tsx
- apps/web/src/modules/activities/components/prize-form-modal.tsx
- apps/web/src/modules/activities/components/prize-list.tsx
- apps/web/src/modules/activities/components/prize-winner-modal.tsx
- apps/web/src/modules/activities/components/team-card-list.tsx
- apps/web/src/modules/activities/components/team-detail-panel.tsx
- apps/web/src/modules/activities/components/team-form-modal.tsx
- apps/web/src/modules/activities/components/team-table.tsx
- apps/web/src/modules/activities/hooks/use-change-activity-item.ts
- apps/web/src/modules/activities/hooks/use-create-activity-item.ts
- apps/web/src/modules/activities/hooks/use-create-activity-movement.ts
- apps/web/src/modules/activities/hooks/use-create-activity-prize.ts
- apps/web/src/modules/activities/hooks/use-create-item-payment.ts
- apps/web/src/modules/activities/hooks/use-create-team-payment.ts
- apps/web/src/modules/activities/hooks/use-delete-activity-item.ts
- apps/web/src/modules/activities/hooks/use-delete-activity-movement.ts
- apps/web/src/modules/activities/hooks/use-delete-activity-prize.ts
- apps/web/src/modules/activities/hooks/use-delete-activity-team.ts
- apps/web/src/modules/activities/hooks/use-delete-item-payment.ts
- apps/web/src/modules/activities/hooks/use-delete-team-payment.ts
- apps/web/src/modules/activities/hooks/use-get-activity-balance.ts
- apps/web/src/modules/activities/hooks/use-get-activity-summary.ts
- apps/web/src/modules/activities/hooks/use-get-activity.ts
- apps/web/src/modules/activities/hooks/use-list-activities.ts
- apps/web/src/modules/activities/hooks/use-list-activity-items.ts
- apps/web/src/modules/activities/hooks/use-list-activity-movements.ts
- apps/web/src/modules/activities/hooks/use-list-activity-prizes.ts
- apps/web/src/modules/activities/hooks/use-list-activity-teams.ts
- apps/web/src/modules/activities/hooks/use-list-item-payments.ts
- apps/web/src/modules/activities/hooks/use-list-team-payments.ts
- apps/web/src/modules/activities/hooks/use-save-activity-team.ts
- apps/web/src/modules/activities/hooks/use-set-prize-winner.ts
- apps/web/src/modules/activities/hooks/use-update-activity-item.ts
- apps/web/src/modules/activities/hooks/use-update-activity-movement.ts
- apps/web/src/modules/activities/hooks/use-update-activity-prize.ts
- apps/web/src/modules/activities/services/activity-finance.service.ts
- apps/web/src/modules/activities/services/activity.service.ts
- apps/web/src/modules/activities/services/activity-team.service.ts
- apps/web/src/modules/activities/utils/activity-items.ts
- apps/web/src/modules/activities/utils/money.ts
- apps/web/src/modules/activities/utils/movements.ts
- apps/web/src/modules/activities/utils/teams.ts
- apps/web/src/modules/projects/components/project-card.tsx
- apps/web/src/modules/projects/components/project-form-modal.tsx
- apps/web/src/modules/projects/components/project-progress-card.tsx
- apps/web/src/modules/projects/components/project-skeletons.tsx
- apps/web/src/modules/projects/components/project-status-badge.tsx
- apps/web/src/modules/projects/hooks/use-create-project.ts
- apps/web/src/modules/projects/hooks/use-get-project.ts
- apps/web/src/modules/projects/hooks/use-list-projects.ts
- apps/web/src/modules/projects/hooks/use-set-project-closed.ts
- apps/web/src/modules/projects/hooks/use-update-project.ts
- apps/web/src/modules/projects/services/project.service.ts
- apps/web/src/modules/public/components/about-section.tsx
- apps/web/src/modules/public/components/accounts-bar.tsx
- apps/web/src/modules/public/components/accounts-panel.tsx
- apps/web/src/modules/public/components/activity-link.tsx
- apps/web/src/modules/public/components/bracket-match.tsx
- apps/web/src/modules/public/components/bracket.tsx
- apps/web/src/modules/public/components/champion-box.tsx
- apps/web/src/modules/public/components/championship-board.tsx
- apps/web/src/modules/public/components/count-up.tsx
- apps/web/src/modules/public/components/date-block.tsx
- apps/web/src/modules/public/components/detail-page.tsx
- apps/web/src/modules/public/components/event-poster.tsx
- apps/web/src/modules/public/components/event-section.tsx
- apps/web/src/modules/public/components/expandable.tsx
- apps/web/src/modules/public/components/facebook-page.tsx
- apps/web/src/modules/public/components/final-slot.tsx
- apps/web/src/modules/public/components/follow-section.tsx
- apps/web/src/modules/public/components/hero-carousel.tsx
- apps/web/src/modules/public/components/load-error.tsx
- apps/web/src/modules/public/components/match-details.tsx
- apps/web/src/modules/public/components/prize-table.tsx
- apps/web/src/modules/public/components/projects-section.tsx
- apps/web/src/modules/public/components/reveal.tsx
- apps/web/src/modules/public/components/scorers-list.tsx
- apps/web/src/modules/public/components/site-footer.tsx
- apps/web/src/modules/public/components/site-navbar.tsx
- apps/web/src/modules/public/components/site-section.tsx
- apps/web/src/modules/public/components/upcoming-notice.tsx
- apps/web/src/modules/public/data/relampago-2026.ts
- apps/web/src/modules/public/data/site.ts
- apps/web/src/modules/public/data/social.ts
- apps/web/src/modules/public/hooks/use-active-section.ts
- apps/web/src/modules/public/hooks/use-element-width.ts
- apps/web/src/modules/public/hooks/use-get-public-home.ts
- apps/web/src/modules/public/hooks/use-navbar-hidden.ts
- apps/web/src/modules/public/services/public.service.ts
- apps/web/src/modules/public/utils/activity-icons.ts
- apps/web/src/modules/public/utils/activity-links.ts
- apps/web/src/modules/public/utils/bracket-layout.ts
- apps/web/src/modules/public/utils/event-dates.ts
- apps/web/src/modules/public/utils/scroll.ts
- apps/web/src/modules/users/components/access-form-modal.tsx
- apps/web/src/modules/users/components/role-badge.tsx
- apps/web/src/modules/users/components/user-card.tsx
- apps/web/src/modules/users/components/user-detail-panel.tsx
- apps/web/src/modules/users/components/user-filters.tsx
- apps/web/src/modules/users/components/user-form-modal.tsx
- apps/web/src/modules/users/components/user-mobile-list.tsx
- apps/web/src/modules/users/components/user-search.tsx
- apps/web/src/modules/users/components/user-table.tsx
- apps/web/src/modules/users/components/user-whatsapp-value.tsx
- apps/web/src/modules/users/hooks/use-create-user.ts
- apps/web/src/modules/users/hooks/use-delete-user.ts
- apps/web/src/modules/users/hooks/use-grant-access.ts
- apps/web/src/modules/users/hooks/use-list-users.ts
- apps/web/src/modules/users/hooks/use-update-user.ts
- apps/web/src/modules/users/services/user.service.ts
- apps/web/src/modules/users/utils/user-filters.ts
- apps/web/src/modules/users/utils/user-search.ts

### apps/web/src/common

- apps/web/src/common/components/button-group.tsx
- apps/web/src/common/components/confirm-modal.tsx
- apps/web/src/common/components/copy-button.tsx
- apps/web/src/common/components/country-flag.tsx
- apps/web/src/common/components/count-tabs.tsx
- apps/web/src/common/components/date-field.tsx
- apps/web/src/common/components/date-input.tsx
- apps/web/src/common/components/detail-section.tsx
- apps/web/src/common/components/empty-state.tsx
- apps/web/src/common/components/field-error.tsx
- apps/web/src/common/components/filter-button.tsx
- apps/web/src/common/components/filters-modal.tsx
- apps/web/src/common/components/floating-action-button.tsx
- apps/web/src/common/components/form-section.tsx
- apps/web/src/common/components/form-submit-buttons.tsx
- apps/web/src/common/components/horizontal-scroller.tsx
- apps/web/src/common/components/icons/ball-icon.tsx
- apps/web/src/common/components/icons/facebook-icon.tsx
- apps/web/src/common/components/icons/tiktok-icon.tsx
- apps/web/src/common/components/icons/whatsapp-icon.tsx
- apps/web/src/common/components/icons/yape-icon.tsx
- apps/web/src/common/components/initials-avatar.tsx
- apps/web/src/common/components/list-pagination.tsx
- apps/web/src/common/components/loadable.tsx
- apps/web/src/common/components/long-press-copy.tsx
- apps/web/src/common/components/modal.tsx
- apps/web/src/common/components/month-calendar.tsx
- apps/web/src/common/components/neighborhood-badge.tsx
- apps/web/src/common/components/option-cards.tsx
- apps/web/src/common/components/page-box.tsx
- apps/web/src/common/components/page-container.tsx
- apps/web/src/common/components/page-header.tsx
- apps/web/src/common/components/page-size-select.tsx
- apps/web/src/common/components/phone-input.tsx
- apps/web/src/common/components/phone-value.tsx
- apps/web/src/common/components/row-actions.tsx
- apps/web/src/common/components/search-input.tsx
- apps/web/src/common/components/segmented-tabs.tsx
- apps/web/src/common/components/select.tsx
- apps/web/src/common/components/side-panel.tsx
- apps/web/src/common/components/sign-out-confirm.tsx
- apps/web/src/common/components/soles-input.tsx
- apps/web/src/common/components/status-badge.tsx
- apps/web/src/common/components/sticky-toolbar.tsx
- apps/web/src/common/components/text-field.tsx
- apps/web/src/common/components/whatsapp-button.tsx
- apps/web/src/common/constants/motion.ts
- apps/web/src/common/constants/routes.ts
- apps/web/src/common/hooks/use-boolean.ts
- apps/web/src/common/hooks/use-chrome-hidden.ts
- apps/web/src/common/hooks/use-debounced-callback.ts
- apps/web/src/common/hooks/use-loading-phase.ts
- apps/web/src/common/hooks/use-long-press-copy.ts
- apps/web/src/common/hooks/use-media-query.ts
- apps/web/src/common/hooks/use-nav-items.ts
- apps/web/src/common/hooks/use-pagination.ts
- apps/web/src/common/hooks/use-request.ts
- apps/web/src/common/hooks/use-scroll-direction.ts
- apps/web/src/common/hooks/use-section-link-click.ts
- apps/web/src/common/hooks/use-session-role.ts
- apps/web/src/common/hooks/use-sign-out.ts
- apps/web/src/common/hooks/use-visual-viewport.ts
- apps/web/src/common/utils/clipboard.ts
- apps/web/src/common/utils/countries.ts
- apps/web/src/common/utils/format-date.ts
- apps/web/src/common/utils/pagination-range.ts
- apps/web/src/common/utils/person-form.ts
- apps/web/src/common/utils/scroll-lock.ts

### apps/web/src/routes

- apps/web/src/routes/_app/actividades.$activityId_.resumen.tsx
- apps/web/src/routes/_app/actividades.$activityId.tsx
- apps/web/src/routes/_app/actividades.index.tsx
- apps/web/src/routes/_app/dashboard.tsx
- apps/web/src/routes/_app/paleta.tsx
- apps/web/src/routes/_app/proyectos.$projectId.tsx
- apps/web/src/routes/_app/proyectos.index.tsx
- apps/web/src/routes/_app/route.tsx
- apps/web/src/routes/_app/usuarios.tsx
- apps/web/src/routes/bingos.$slug.tsx
- apps/web/src/routes/campeonatos.$slug.tsx
- apps/web/src/routes/index.tsx
- apps/web/src/routes/login.tsx
- apps/web/src/routes/__root.tsx
