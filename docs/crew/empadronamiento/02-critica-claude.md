## 1. Lo mejor de la otra propuesta

- **`GET /dwellings/next-code`, con conflicto si otro admin ganó el código.** Así la confirmación de la decisión 7 muestra el código real que se va a asignar. Mi propuesta muestra «Se le asignará SR-0001», pero no dice de dónde sale ese número en el front. Su versión tapa ese hueco.
- **Medidor y correlativo en columnas separadas** (`meter_number` y `local_sequence`, se guarda exactamente uno). Así no hace falta mi regla frágil de «un `code` editado no puede parecerse a `XX-0000`». La unicidad del correlativo por barrio queda en un índice y no en un parseo de texto.
- **Columnas auxiliares en el Excel** con el código de vivienda y la familia repetidos en cada fila. Las celdas combinadas no se pueden filtrar, y la decisión 14 pide filtrar en el mismo Excel. Ninguna de las dos lo había resuelto.

## 2. Problemas

1. **La API no deja editar nada después del alta.** Solo hay `POST /dwellings` (toda la ficha), `PATCH /families/:id/head` y lecturas. Faltan: editar el estado de la vivienda, agregar un recién nacido, agregar una segunda familia encontrada después, quitar a alguien, editar el contacto. Un censo «actual, sin historial» vive de esas ediciones. Además, el estado de la vivienda va a cambiar con la próxima lluvia. Haría lo mismo que en mi propuesta: una ruta por recurso hijo (`families`, `members`) y `PATCH` de la vivienda.
2. **`census_details` mezcla identidad y pertenencia.** El DNI, la fecha de nacimiento y el género están en la misma fila que `family_id` y `relationship`. Si `family_id` es obligatorio, sacar a alguien de una familia borra su DNI. Si es nulable, la regla «una persona, una familia» se debilita. Además, la búsqueda de duplicados por DNI tiene que pasar por la membresía. Separaría `family_members(user_id único, family_id, relationship)` de los datos de identidad, vivan donde vivan.
3. **Apellido legado con doble lectura indefinida.** Mantener `last_name` y además paterno y materno obliga a que `fullName`, la búsqueda, el orden de jugadores, `me` y `collector` lean dos formas «hasta que un admin confirme». No hay fecha de fin, así que la deuda queda para siempre. Además, «confirmar la separación» es un flujo nuevo que nadie pidió. Haría el rename a paterno, como en mi propuesta: el texto queda entero, no se parte mal, y la deuda se paga una sola vez en el slice 1.
4. **Sincronizar `users.neighborhood_id` con la vivienda y bloquear el cambio de barrio desde Usuarios.** Es una regla nueva que el ítem no pide. Toca un flujo que ya está en uso (decisión 6b: los censados son usuarios comunes) y suma una confirmación más al alta urgente. Lo sacaría de la fase 1.
5. **El slice 1 es enorme y se hace con una sola escritura.** Incluye esquema, apellidos, el formulario de toda la ficha con altas de usuarios en memoria y `POST /dwellings` con revalidación. Es el slice más riesgoso, y la data se necesita «ya». Si la señal se cae en el campo con 8 integrantes cargados, se pierde todo. Partiría el alta en pasos que guardan, o al menos separaría la persona censable (apellidos y DNI) en su propio slice.
6. **Largos que rompen la convención de `own/CLAUDE.md`:**
   - `drive_url` con máx. 2048, sin anotarlo;
   - los apellidos a 120, cuando en el mismo diagrama `last_name` va a 60;
   - `wall_material` como texto libre de 160, que no se puede contar en el resumen ni filtrar.

   Pondría 500 para los enlaces, 60 para los apellidos y un enum con labels para el material, como el estado.

## 3. Errores de hecho sobre el código

Ninguno. Verifiqué lo que afirma sobre el repo:

- `last_name` es nulable;
- `UserSearch` elige con Enter;
- `UserFormModal` tiene «Crear y seguir creando»;
- los barrios tienen IDs fijos.

Hay dos cosas que asume sin decirlo. Los prefijos SR, RC, MA, EP y NE hoy no existen en `INeighborhood` y hay que agregarlos. Y el estado «sin daño» no lo trata.

## 4. Lo que adoptaría de la otra en la mía

- `GET /dwellings/next-code` para el texto de la confirmación, con un 409 si el código se ocupó en el medio.
- `meter_number` + `local_sequence` en lugar de un solo `code` con `has_meter`. El código visible se arma en el recurso.
- Columnas auxiliares filtrables en la hoja de cada barrio (código de vivienda y jefe de la familia en cada fila).
- Hoja por barrio aunque esté vacío, y el DNI como texto en el Excel para no perder ceros.
- `POST /census/matches` como endpoint del servidor, para el aviso de duplicados. Mi versión filtra solo la lista ya cargada en el navegador.

## 5. Desacuerdos que mantengo

- **Datos de identidad en `users` y no en una tabla de detalle.** Son 1:1 con la persona, y la tabla aparte obliga a un join en cada búsqueda y en el chequeo de DNI único. La otra propuesta respeta la decisión 1 al pie de la letra. Thony decide si la mantiene.
- **Alta por pasos y no en una sola ficha.** Cada modal guarda: si se corta la señal no se pierde lo anterior, y se reutilizan `UserFormModal` y `UserSearch` tal cual. La ficha única es más rápida si todo sale bien, pero es frágil en el campo.
- **Renombrar `last_name` y no convivir con el legado.** Un solo cambio, con fin claro. La doble lectura evita corregir a mano a pocos usuarios, pero a cambio deja deuda permanente en cada consulta.
- **No tocar el barrio del usuario desde el padrón.** Está fuera del ítem y agrega una confirmación al flujo urgente. Si hace falta, va como un ítem aparte.
- **4 slices y no 3.** Separar «persona censable» aísla el cambio más invasivo (`lastName`) y deja empezar viviendas en paralelo.
