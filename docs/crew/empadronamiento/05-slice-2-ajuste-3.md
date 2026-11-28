## Informe: Slice 2, vuelta 3

No corrí nada: ni compilación ni pruebas. Todo está sin verificar hasta que corras los comandos de la sección 4.

### 1. Qué corregí

**1. El lápiz de editar. No pude confirmar la causa leyendo el código.**
- El clic llega bien: `RowActions` llama a `openEditMember`, que guarda al integrante y prende `showMemberForm`.
- La modal vieja, en modo edición, hacía tres cosas que el alta no hacía:
  - pedía los datos de la persona (`GET /users/:id`);
  - reseteaba el formulario dentro del mismo efecto, con una limpieza que abortaba esa carga;
  - esperaba esos datos antes de dejar guardar.
- Sin ver la consola no puedo decir cuál de las tres lo rompía.
- Reescribí `member-form-modal.tsx` sin ese enredo:
  - Al abrir pide los datos, muestra un esqueleto y recién entonces arma el formulario.
  - Si la petición falla, avisa con un toast y cierra.
  - Al cerrar no toca nada, así no parpadea.
- **Si el lápiz sigue sin abrir, pásame el error de la consola del navegador.** Con eso lo cierro.

**2. Detalle de la vivienda a todo el ancho** (`viviendas.$dwellingId.tsx`)
- **Datos** va arriba a todo el ancho, en 1 columna en celular, 2 en escritorio y 3 en pantallas anchas.
- **Integrantes** va debajo.
  - **Escritorio:** tabla (`member-table.tsx`) con Nombre ⭐, DNI, Edad, Género, Parentesco, Condiciones, Celular y acciones. Editar va directo y quitar en `⋯`.
  - **Con 2 o más familias:** fila de grupo «Familia … · N personas» con su `⋯` para eliminar la familia.
  - **Celular:** vista compacta (`member-compact-list.tsx`) con nombre y ⭐, debajo DNI · edad · parentesco, y los badges.
  - **Contacto alternativo del jefe:** va en su fila, en la columna Celular («Rosa (vecina) · +51 999…»).
- **Datos nuevos:** para mostrar DNI y género, `GET /dwellings/:id` ahora los devuelve en cada integrante.

**3. «Agregar integrantes» como lista repetible** (`members-batch-modal.tsx`, `member-batch-row.tsx`)
- **Caja:** caja con borde, filas separadas por línea, «⊕ Agregar integrante» al pie y «−» por fila.
- **Fila:**
  - buscador por DNI o nombre, con la última opción «Crear persona con DNI 12345678» o con el texto escrito;
  - parentesco, por defecto «Hijo(a)»;
  - ⭐ de «Es jefe(a) de hogar», solo una a la vez.
- **La persona elegida** muestra su nombre y su DNI.
- **Apertura:** la modal abre con una fila vacía. Si la familia no tiene jefe, esa fila viene con la ⭐.
- **Otra familia:** el enlace «¿Son de otra familia de esta casa?» muestra el select de familia, que aplica a todas las filas.
- **Guardar:** `POST /dwellings/:id/members/batch` es atómico, en un solo `db.batch`.
  - Antes de escribir revisa a cada persona.
  - Si una ya integra otra familia, el error la nombra y no se guarda nada.
  - Mismas reglas de jefe y familia que antes. Si pasa la jefatura a otra persona, el jefe anterior queda como «Otro pariente» y se avisa.
- **«Crear persona…»** abre el formulario de persona y, al guardar, vuelve a la fila con la persona elegida. Si el DNI ya existe, ofrece «Usar esta persona» en lugar de «Ver persona», para no perder la lista.

**4. Formulario de persona por pasos** (`person-steps-modal.tsx`)
- **Pasos:** DNI → Principal → Contacto → Prioridad, con el `Stepper` común y Anterior/Siguiente.
- **DNI:** solo el campo, grande, con ícono `IdCard`. Mantiene el aviso de repetido y el botón «No tiene DNI».
- **Autocompletar:** `useDocumentLookup` hoy devuelve `null`. Cuando se conecte el proveedor, solo cambia ese archivo: el formulario ya aplica lo que devuelva a los nombres que estén vacíos.
- **Principal:** nombres, apellidos, nacimiento y género como botones (`OptionCards`, deseleccionable).
- **Contacto:** celular con ícono `Phone` y, si es jefe sin celular, el contacto alternativo.
- **Editar integrante:** suma el parentesco y la ⭐ en el paso Principal, y deja guardar desde cualquier paso.
- **Usuarios:** `user-form-modal.tsx` agrupa en Principal, Contacto y Prioridad con subtítulo pequeño, sin pasos. El género también pasa a botones.

**Esqueletos que copié**
- Tabla: `dwelling-table.tsx`.
- Vista compacta: `activity-item-compact-list.tsx`.
- Lista repetible: el patrón de «Redes sociales» que describiste (caja con borde, filas con línea, «⊕» al pie y «−» por fila).

### 2. Qué no corregí y por qué

- **El lápiz:** ver el punto 1, no confirmé la causa.
- **Familia con 2 o más familias:** en vez de esconder el select detrás del enlace, lo muestro de entrada. Sin elegir familia, guardar fallaría con un error. Con 0 familias no aparece y con 1 familia queda detrás del enlace.
- **Contacto alternativo de un jefe que ya existe y no tiene celular:** la fila de «Agregar integrantes» no lo pide. Se completa después con «Editar integrante» → Contacto.
- **Endpoint viejo:** `POST /dwellings/:id/members` (alta de uno) sigue en el servidor, pero la web ya no lo usa. Se puede quitar cuando quieras.
- **Cambié un nombre existente:** el hook que buscaba ids por DNI se llamaba `useDocumentLookup` y chocaba con el que pediste. Quedó como `useDocumentUserIds`, con sus dos usos actualizados.

### 3. Archivos tocados

**Compartido y servidor**
- `packages/shared/src/families.ts`
- `apps/server/src/lib/dwelling-resources.ts`
- `apps/server/src/lib/dwelling-input.ts`
- `apps/server/src/lib/dwelling-members.ts`
- `apps/server/src/routes/dwellings.ts`

**Web, común**
- `common/components/option-cards.tsx`
- `common/components/detail-section.tsx`
- `common/components/phone-input.tsx`
- `common/utils/person-form.ts`

**Web, usuarios**
- `modules/users/components/person-fields.tsx`
- `modules/users/components/user-form-modal.tsx`
- `modules/users/components/user-search.tsx`
- `modules/users/hooks/use-document-lookup.ts` (ahora el hook nuevo)
- `modules/users/hooks/use-document-user-ids.ts` (nuevo, con lo que hacía el viejo)
- `routes/_app/usuarios.tsx`

**Web, viviendas**
- `routes/_app/viviendas.$dwellingId.tsx`
- `modules/dwellings/components/`: `member-list.tsx` y `member-form-modal.tsx` (reescritos), `member-family-fields.tsx` (reescrito), `member-table.tsx`, `member-compact-list.tsx`, `members-batch-modal.tsx`, `member-batch-row.tsx` y `person-steps-modal.tsx` (nuevos)
- `modules/dwellings/hooks/`: `use-save-member.ts`, `use-create-members-batch.ts` (nuevo)
- `modules/dwellings/services/dwelling.service.ts`
- `modules/dwellings/utils/`: `member-form.ts` (reescrito), `member-batch.ts`, `member-display.ts` (nuevos)

### 4. Comandos para Thony

No hay cambios de esquema, así que no hay migración.

```bash
pnpm check-types
pnpm test
```

### 5. Qué volver a probar

1. **El lápiz** en una fila, en escritorio y en celular. Debe abrir «Editar integrante» con esqueleto breve y luego los datos. Si no abre, mira la consola.
2. **Detalle de la vivienda:** Datos arriba en 2 o 3 columnas (1 en celular) e Integrantes debajo, como tabla en escritorio y compacto en celular. Con 2 familias deben verse las filas de grupo y su `⋯`.
3. **Agregar integrantes:**
   - Con una vivienda sin gente, la primera fila trae la ⭐.
   - Elige a una persona existente por DNI y comprueba que se vea su DNI.
   - Crea una desde la fila con «Crear persona con DNI…» y comprueba que vuelva elegida.
   - Guarda 3 filas juntas.
4. **Persona ya en otra familia:** mete a alguien así en la lista. Debe salir el error con su nombre y no guardarse ninguna fila.
5. **Otra familia:** usa el enlace «¿Son de otra familia…?» y «Nueva familia» con la ⭐ pasando a otra fila.
6. **Formulario de persona:**
   - DNI con «No tiene DNI» y con un DNI repetido.
   - Género deseleccionable.
   - Contacto alternativo con un jefe sin celular.
   - Editar un jefe, con el interruptor bloqueado.
7. **Usuarios:** el formulario en tres secciones, con el género en botones, y que crear y editar sigan guardando el DNI y las condiciones.
