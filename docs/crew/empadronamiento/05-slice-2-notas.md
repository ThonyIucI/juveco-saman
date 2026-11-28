# Notas de Thony: slice 2, vuelta 2

La vuelta 1 ya se aplicó. Después, Claude (Opus) corrigió a mano:
- el detalle de la vivienda: cabecera con estado y barrio; «Datos» a la izquierda y las familias a la derecha;
- los pasos numerados del formulario y los botones Anterior/Siguiente;
- el campo único «Nota»: se quitó `observation` del esquema, la API y la web;
- el ícono del medidor y el barrio bloqueado al editar;
- el mapa, que abre en «Calles»;
- el pie del modal: sombra solo si hay scroll.

**No deshagas nada de eso.**

Esta vuelta es **una sola cosa: la experiencia de integrantes** (decisión 14 del plan). Hoy, crear primero una familia con su jefe y después sus miembros es una mala experiencia. Casi toda casa tiene una sola familia, y lo que necesito son los datos de las personas.

## 1. Detalle de la vivienda (`routes/_app/viviendas.$dwellingId.tsx`)

- **Acción primaria de la cabecera:** «Agregar integrante» (ícono `UserPlus`), en lugar de «Agregar familia». Mismo patrón: `Button` en escritorio e `IconButton` relleno en celular, ambos de 44 px. Editar sigue como ícono con borde.
- **Sección de la derecha:** se llama **«Integrantes»**, con el total a la derecha («7 personas»).
  - **Con 0 o 1 familia:** una sola lista plana.
    - Arriba va el jefe, con ⭐ (`Star` relleno, color de marca) al lado del nombre. Debajo, los demás.
    - Cada fila: avatar, nombre completo, «parentesco · edad», badges de condiciones y, si tiene, el celular.
    - Acciones: editar como ícono directo; «Quitar de la vivienda» en `⋯`.
  - **Con 2 o más familias:** la misma lista, agrupada.
    - Cada grupo lleva un subtítulo «Familia Quispe Mamani» (apellidos paterno y materno del jefe) y su conteo.
    - Su `⋯` tiene «Eliminar familia», solo si no le quedan integrantes o con confirmación.
  - **Contacto alternativo:** si el jefe no tiene celular y la familia tiene uno, va como una línea bajo la fila del jefe: «Contacto: Rosa (vecina) · 999 999 999».
  - **Vacío:** `EmptyState` «Todavía no hay integrantes», **sin** botón, porque la acción ya está arriba.
- **La lista replica las listas que ya existen** (`movement-list.tsx`, `prize-list.tsx`): `DetailSection isBordered` con `ul divide-y`, filas `py-2.5` y `RowActions isBordered`. No inventes cards nuevas.
- Se eliminan `family-card.tsx` y `family-form-modal.tsx`, y todo lo que solo ellos usaban.

## 2. Formulario «Nuevo integrante» / «Editar integrante» (reemplaza `member-form-modal.tsx`)

Es una sola modal, en este orden:

1. **«¿Ya está registrado?»:** el buscador de personas de Usuarios (`user-search`), por DNI o nombre.
   - Al elegir a alguien, sus datos llenan los campos de abajo y se pueden corregir.
   - Si ya integra otra familia, el servidor lo rechaza como hoy.
   - Si no se elige a nadie, se crea una persona nueva con los campos de abajo.
2. **Datos de la persona,** los mismos del formulario de usuario (slice 1):
   - nombres, apellido paterno y materno;
   - DNI, fecha de nacimiento y género;
   - condiciones (chips) y su detalle;
   - celular.

   **Extrae esos campos del `user-form-modal.tsx` a un componente reutilizable** (`PersonFields` o similar) y úsalo en los dos lugares, no los dupliques. Se mantienen los avisos de DNI repetido y de mismo nombre y fecha.
3. **«⭐ Es jefe(a) de hogar»:** un interruptor con estrella.
   - Si la familia todavía no tiene integrantes, viene prendido y bloqueado: el primero es el jefe.
   - Si se prende en otra persona, pasa a ser el jefe y el jefe anterior queda con parentesco «Otro pariente». Un toast avisa: «Revisa el parentesco de <nombre>».
4. **Parentesco con el jefe:** solo cuando no es jefe. Por defecto «Hijo(a)».
5. **Contacto alternativo:** solo si es jefe y no tiene celular. Bloque opcional con a quién pertenece y el número (lo de hoy).
6. **Familia:** escondido por defecto.
   - Si la vivienda ya tiene integrantes, debajo va un enlace discreto «¿Es de otra familia de esta casa?».
   - Al tocarlo aparece un select con las familias existentes («Familia Quispe Mamani») y «Nueva familia».
   - Con «Nueva familia», la estrella queda prendida y bloqueada.
   - Si la vivienda no tiene familias, se crea sola.

**Pie:** «Guardar» y «Guardar y agregar otro». Este último guarda, limpia los campos de la persona y deja el foco en el buscador.

## 3. API (`apps/server/src/routes/dwellings.ts`)

- **`POST /dwellings/:id/members`** recibe `{ userId?, person?, familyId? | "NEW", isHead, relationship?, contact? }`.
  - **Persona:** con `userId` se actualizan sus datos con `person`; sin él, se crea.
  - **Reutiliza la lógica del slice 1** (alta de usuario, perfil de censo, guardia de DNI): las funciones de `lib/`, nunca una copia.
  - **Familia:** sin familias, la crea. Con `"NEW"`, crea otra. Sin `familyId` y con una sola familia, usa esa.
  - **Jefe:** con `isHead`, cambia el jefe.
  - **Atómico:** todo con `db.batch` donde se pueda; donde no, deshace como en el alta de usuarios.
  - Devuelve la vivienda completa.
- **`PATCH /dwellings/:id/members/:memberId`:** lo mismo para editar (persona, parentesco, jefe, contacto).
- **`DELETE` de un integrante:**
  - Si es el único de su familia, se borra también la familia.
  - Si es el jefe y quedan otros, lo rechaza: «Marca a otro integrante como jefe antes de quitar a <nombre>».
  - La persona nunca se borra de Usuarios.
- Quita los endpoints de familia que queden sin uso. El contacto alternativo se edita desde el formulario del jefe.
- El esquema no cambia: `families`, `family_members` y el único jefe por familia siguen igual.

## Reglas

- **Diseño:** copia el esqueleto de lo existente (ver `docs/tecnico/convenciones.md` y las listas citadas). Botones de 44 px como máximo, una sola acción primaria e iconografía en los campos donde ayude.
- **Informe:** di qué componente tomaste como modelo para la lista y para el formulario.
