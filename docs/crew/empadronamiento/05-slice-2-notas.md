# Notas de Thony: slice 2, vuelta 3

Probé la vuelta 2. Ajustes, todos dentro de la experiencia de integrantes (decisión 15 del plan).

## 1. Bug: el lápiz de editar un integrante no hace nada

Encuéntralo y arréglalo: el ícono de cada fila no abre el formulario. Revisa `member-list.tsx`, `openEditMember` en `viviendas.$dwellingId.tsx` y `member-form-modal.tsx`. Di en el informe cuál era la causa.

## 2. Detalle de la vivienda: todo a lo ancho

- **«Datos» ocupa todo el ancho, arriba.** En escritorio, sus filas van en 2 o 3 columnas para no desperdiciar alto. En celular, una columna.
- **«Integrantes» va debajo, también a todo el ancho.**
  - **Escritorio:** una tabla. Copia el patrón de tabla que ya existe (`dwelling-table.tsx` o la tabla de Usuarios). Las columnas son:
    - Nombre (⭐ si es jefe)
    - DNI
    - Edad
    - Género
    - Parentesco
    - Condiciones (badges)
    - Celular
    - Acciones: editar directo; quitar en `⋯`
  - **Con 2 o más familias:** una fila de grupo «Familia Quispe Mamani · N personas» antes de sus integrantes, con su `⋯` (eliminar familia).
  - **Celular:** vista compacta, copiando `modules/activities/components/activity-item-compact-list.tsx` (la vista compacta de cartillas). Filas bajas con nombre y ⭐; debajo, en pequeño, DNI · edad · parentesco, y los badges.
  - El contacto alternativo del jefe va en su fila (columna Celular: «Rosa (vecina) · 999…»).

## 3. «Agregar integrantes»: lista repetible

La vivienda se registra primero (sus 3 pasos, como está). Después, desde su detalle, «Agregar integrantes» abre una modal con una **lista repetible**, como el campo «Redes sociales» de otros proyectos:
- una caja con borde y filas separadas por línea;
- al pie de la caja, «⊕ Agregar integrante» (ícono `CirclePlus` con color de marca);
- cada fila con su botón «−» para quitarla.

**Cada fila** tiene:
- **Un buscador de persona propio:** combobox por **DNI** (lo principal) o nombre, sobre las personas ya registradas.
  - Si la encuentra, queda elegida y se ve su nombre y DNI.
  - Si no, la última opción es «Crear persona con DNI 12345678», o con el texto escrito. Abre el formulario de persona (punto 4) con ese DNI ya puesto, y al guardar vuelve a la fila con la persona elegida.
- **Parentesco con el jefe:** select, por defecto «Hijo(a)».
- **⭐:** botón de estrella, «Es jefe(a) de hogar». Solo una fila puede tenerla. Si la familia todavía no tiene jefe, la primera fila viene con la estrella puesta.
- **«−»:** quitar la fila.

La modal abre con una fila vacía. Si la vivienda ya tiene más de una familia o se quiere otra, el enlace discreto «¿Son de otra familia de esta casa?» muestra el select de familia (existentes + «Nueva familia»), que aplica a todas las filas.

**Guardar** manda todas las filas juntas: un endpoint nuevo `POST /dwellings/:id/members/batch`, atómico. Si una persona ya está en otra familia, error con su nombre y no se guarda nada. Las mismas reglas de jefe y familia que hoy.

## 4. Formulario de persona, por pasos y con el DNI primero

Sirve para crear una persona desde la fila y para «Editar integrante». Usa el `Stepper` común (`common/components/stepper.tsx`) con Anterior/Siguiente, como el formulario de vivienda.

1. **DNI:** primero y antes que todo, solo ese campo grande. Mantiene el aviso de DNI repetido. Deja preparado el punto donde se autocompletarán nombres y apellidos con el DNI: un hook `useDocumentLookup` que hoy no consulta a nadie y devuelve `null`; el proveedor se conecta después. Botón «No tiene DNI» para seguir sin él (bebés).
2. **Principal:**
   - nombres, apellido paterno y materno;
   - fecha de nacimiento;
   - **género como grupo de botones** (Femenino / Masculino), con el `OptionCards` común, deseleccionable porque es opcional.
3. **Contacto:** celular y, si es jefe y no tiene celular, el contacto alternativo.
4. **Prioridad:** condiciones (chips) y su detalle.

Al editar un integrante se suman, en el paso Principal, su parentesco y la ⭐.

En el formulario de Usuarios (`user-form-modal.tsx`), el género también pasa a grupo de botones, y los campos se agrupan en las mismas secciones (Principal, Contacto, Prioridad) con un subtítulo pequeño cada una. Ese formulario no lleva pasos.

## Reglas

- Copia esqueletos existentes y di en el informe cuál usaste para la tabla, la vista compacta y el repetible.
- Botones de 44 px como máximo, una sola acción primaria e íconos en los campos donde ayude (DNI: `IdCard`; celular: `Phone`).
- No toques lo que ya funciona: pasos de vivienda, mapa, pie del modal y nota única.
