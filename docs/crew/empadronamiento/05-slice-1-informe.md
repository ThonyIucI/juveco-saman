# Informe: Slice 1, persona censable

## 1. Qué quedó funcionando
- **Apellidos:** el formulario de usuario tiene «Nombres» y debajo «Apellido paterno» y «Apellido materno» en una misma fila.
- **Sección «Datos del censo (opcional)»,** separada por una línea fina. Trae DNI, fecha de nacimiento (se escribe día/mes/año y las barras se ponen solas), género, condiciones de prioridad y el detalle de las condiciones.
- **Condiciones:** se prenden y apagan como chips (Gestante, Dio a luz recientemente, Con discapacidad).
- **DNI repetido:** al completar los 8 dígitos, el campo avisa «“Ana Quispe” ya tiene este DNI. Ver persona». «Ver persona» abre su registro en Usuarios. Si igual se intenta guardar, sale un toast y no guarda. El servidor también lo rechaza.
- **Mismo nombre y fecha:** sin DNI, si ya existe alguien con los mismos nombres, apellido paterno y fecha de nacimiento, sale un aviso amarillo. No bloquea.
- **Buscador por DNI:** funciona en el buscador de personas (cartillas, equipos, etc.) y en la lista de Usuarios cuando se escribe un DNI de 8 dígitos.
- **Nombres completos:** en toda la app se ven con paterno y materno (cartillas, equipos, premios, portada pública).
- **Datos sensibles:** `GET /users` no trae DNI, nacimiento ni condiciones. Solo `GET /users/:id` los trae.

## 2. Archivos tocados

**Shared**
- `packages/shared/src/people.ts`: `IPersonName` y `IPersonInput` con `paternalLastName` y `maternalLastName`. `fullName` une los tres campos. Mensajes nuevos de largo.
- `packages/shared/src/person-details.ts` (nuevo): `EGender`, `EPersonCondition` con sus etiquetas, validadores, mensajes e interfaces del censo.
- `packages/shared/src/users.ts`: `IUserDetailResource`, que suma `details`.
- `packages/shared/src/activity-items.ts`: `IActivityItemPerson` extiende `IPersonName`.

**Base de datos**
- `packages/db/src/schema/users.ts`: `last_name` pasa a `paternal_last_name`, y se agrega `maternal_last_name`.
- `packages/db/src/schema/person-details.ts` (nuevo): tablas `person_details` (DNI único) y `person_conditions` (clave compuesta).
- `packages/db/src/schema/index.ts`: exporta lo nuevo.

**Servidor**
- `apps/server/src/lib/person-input.ts`: validación de los dos apellidos.
- `apps/server/src/lib/person-details-input.ts` (nuevo): validación zod de `details`. Cubre el DNI de 8 dígitos, la fecha existente y no futura, el género, las condiciones y el detalle (máx. 500).
- `apps/server/src/lib/person-details.ts` (nuevo): cargar y guardar el censo en `db.batch`, y buscar por DNI.
- `apps/server/src/lib/person-guards.ts`: `assertDocumentAvailable`, que responde «“Ana Quispe” ya tiene ese DNI.».
- `apps/server/src/routes/users.ts`:
  - Nuevo `GET /users/matches`, declarado antes de `/users/:id`.
  - `GET /users/:id` devuelve `details`.
  - `POST` y `PATCH` aceptan `details` y validan el DNI.
  - Se usan los dos apellidos.
- `apps/server/src/routes/{activities,activity-finances,activity-teams,me}.ts`: devuelven los dos apellidos. En equipos, el orden de jugadores usa ambos.
- `apps/server/test/*.spec.ts` (5 archivos): solo renombré `lastName` a `paternalLastName` en los datos de prueba. No agregué tests.

**Web**
- `apps/web/src/common/utils/person-form.ts`: campos del formulario para apellidos y censo, fecha escrita y su conversión, y los payloads.
- `apps/web/src/modules/users/components/user-form-modal.tsx`: apellidos, sección del censo, avisos y carga del detalle al editar.
- `apps/web/src/modules/users/components/condition-chips.tsx` (nuevo): chips de condiciones.
- `apps/web/src/modules/users/components/user-search.tsx`: busca por DNI.
- `apps/web/src/routes/_app/usuarios.tsx`: la búsqueda de la lista encuentra por DNI.
- `apps/web/src/modules/users/services/user.service.ts`: `getUserRequest`, `findPersonMatchesRequest` y `details` en los payloads.
- `apps/web/src/modules/users/hooks/use-get-user.ts`, `use-find-person-matches.ts`, `use-person-matches.ts`, `use-document-lookup.ts` (nuevos): consulta de detalle, avisos de repetidos con espera de 400 ms y búsqueda por DNI.
- `apps/web/src/modules/users/utils/user-search.ts`: constantes y `looksLikeDocumentNumber`.

## 3. Decisiones que tomé
- **Alta con censo:** el usuario se inserta primero y los datos del censo se guardan después. Si eso falla, se deshace el alta, igual que con el acceso. No va en un solo `batch`, porque `returning()` más un insert condicional no encaja con la tipificación del `batch`. Al editar, el censo sí va en `db.batch`.
- **Edición:** el formulario pide `GET /users/:id` al abrir. Hasta que llegue, no manda `details`, para no borrar datos por un guardado rápido. Al crear, solo manda `details` si se escribió algún dato.
- **Fila vacía:** si no hay DNI, fecha, género ni detalle, no se deja una fila en `person_details`. Las condiciones van aparte, en `person_conditions`.
- **«Ver persona»:** navega a `/usuarios?usuario=<id>` y cierra la modal.
- **Aviso por nombre y fecha:** compara nombres y apellido paterno sin importar mayúsculas, más la fecha de nacimiento. No mira el materno ni las tildes. Solo se activa con paterno y fecha completa.
- **Apellidos:** quedan opcionales, como lo era el campo único. Largo de 60, como antes.
- **El plan no pedía nada más** sobre el detalle de usuario (panel lateral), así que no muestra DNI ni nacimiento todavía.
- **Ordenar jugadores:** por nombres, apellido paterno y apellido materno.

## 4. Comandos para Thony
Antes de empezar, respaldar la base de producción (riesgo señalado en el plan).

```bash
# 1) Migración de esquema.
pnpm db:generate
#    Cuando pregunte por paternal_last_name elige "rename column" (desde last_name).
#    Si eliges crear y borrar, pierdes los apellidos. maternal_last_name y las dos tablas nuevas se crean.

# 2) Migración de datos (vacía), para repartir los apellidos que ya existen.
pnpm --filter @juveco/db exec drizzle-kit generate --custom --name=split_last_names
```
Pega este SQL en el archivo `.sql` que se acaba de crear en `packages/db/src/migrations/`:
```sql
UPDATE users
SET
  maternal_last_name = substr(trim(paternal_last_name), instr(trim(paternal_last_name), ' ') + 1),
  paternal_last_name = substr(trim(paternal_last_name), 1, instr(trim(paternal_last_name), ' ') - 1)
WHERE paternal_last_name IS NOT NULL
  AND length(trim(paternal_last_name)) - length(replace(trim(paternal_last_name), ' ', '')) = 1;
```
- **Qué hace:** parte solo los apellidos de exactamente dos palabras («Quispe Mamani» pasa a Quispe y Mamani).
- **Qué no toca:** los de una palabra quedan como paterno. Los de tres o más («Del Rosario Castro») quedan enteros como paterno.
- **Orden del UPDATE:** SQLite evalúa ambos lados con la fila original, así que no se pisan entre sí.

```bash
# 3) Aplicar en local.
pnpm --filter server exec wrangler d1 migrations apply juveco-db --local

# 4) Verificar.
pnpm check-types
pnpm test
```
El paso 3 usa el nombre de la base que dice `drizzle.config.ts`. Si tu script de `apps/server/package.json` tiene otro comando para migrar, usa ese.

## 5. Cómo probarlo
1. Abre Usuarios y edita uno existente (por ejemplo, uno con «Quispe Mamani»). Debe verse separado en paterno y materno. Si tenía tres palabras, separa tú los apellidos y guarda.
2. En «Datos del censo», pon DNI de 8 dígitos y una fecha (escribe `05112019`; debe quedar `05/11/2019`). Marca «Gestante» y escribe un detalle. Guarda, reabre y comprueba que todo volvió.
3. Crea otro usuario con el mismo DNI. Debe aparecer el aviso rojo con «Ver persona», que te lleva al primero. Si intentas guardar, sale el toast y no guarda.
4. Crea un bebé sin DNI con el mismo nombre, paterno y fecha que otra persona. Debe salir el aviso amarillo y dejar guardar.
5. Escribe el DNI completo en el buscador de Usuarios, y también al elegir comprador en cartillas. Debe encontrar a esa persona.
6. Abre cartillas, equipos y la portada, y confirma que los nombres se ven completos con ambos apellidos.
7. En celular, el formulario va en una columna con los chips que se acomodan en varias líneas.
