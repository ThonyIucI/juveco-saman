## Vuelta 2 — Slice 2: experiencia de integrantes

No corrí nada. Todo está sin compilar hasta que ejecutes `pnpm check-types`.

### 1. Qué corregí (por nota)

**Detalle de la vivienda** (`routes/_app/viviendas.$dwellingId.tsx`):
- La acción primaria de la cabecera ahora es «Agregar integrante» con `UserPlus`. Es un `Button` en escritorio y un `IconButton` relleno en celular, ambos de 44 px. Editar sigue como ícono con borde.
- La sección de la derecha se llama «Integrantes» y muestra el total («7 personas») a la derecha.
- Con 0 o 1 familia es una lista plana con el jefe primero. Lleva ⭐ al lado del nombre.
- Con 2 o más familias se agrupa. Cada grupo tiene el subtítulo «Familia Quispe Mamani», su conteo y un `⋯` con «Eliminar familia». Esa acción siempre pide confirmación.
- Cada fila muestra avatar, nombre, «parentesco · edad», badges de condiciones y celular. Editar va como ícono directo y «Quitar de la vivienda» en `⋯`.
- Si el jefe no tiene celular y la familia tiene contacto, sale la línea «Contacto: Rosa (vecina) · 999 999 999» bajo su fila.
- El vacío es un `EmptyState` «Todavía no hay integrantes», sin botón.
- Se eliminaron `family-card.tsx`, `family-form-modal.tsx` y `use-save-family.ts`.
- Modelo de la lista: `prize-list.tsx`, con `DetailSection isBordered`, `ul divide-y`, filas `py-2.5` y `RowActions isBordered`. El nuevo componente es `member-list.tsx`.

**Formulario «Nuevo integrante» / «Editar integrante»** (reemplaza `member-form-modal.tsx`):
- Modelo del formulario: `user-form-modal.tsx`, con el mismo patrón de tanstack-form, `Modal`, `FormSubmitButtons` y confirmación al cerrar si está dirty.
- «¿Ya está registrado?» usa `UserSearch`. Al elegir a alguien se llenan los campos de abajo y se pueden corregir. Los datos de censo llegan con `GET /users/:id`.
- Si no eliges a nadie, se crea una persona nueva con esos campos. «Crear «Ana»» en el buscador pasa lo escrito al campo de nombres, sin abrir otra modal.
- Los campos de persona se extrajeron a `users/components/person-fields.tsx` (`PersonNameFields` y `PersonCensusFields`). Los usan este formulario y `user-form-modal.tsx`. Se mantienen los avisos de DNI repetido y de mismo nombre y fecha, vía `usePersonFormMatches`.
- Interruptor «⭐ Es jefe(a) de hogar»:
  - Viene prendido y bloqueado si la vivienda no tiene familias, o si eliges «Nueva familia».
  - Al editar al jefe actual también queda bloqueado, con la pista «Para cambiar al jefe(a), prende la estrella en otra persona».
- Al pasar la jefatura a otra persona sale el toast «Revisa el parentesco de <nombre>». El servidor deja al jefe anterior como «Otro pariente».
- El parentesco con el jefe solo aparece si no es jefe, y viene en «Hijo(a)».
- El contacto alternativo solo aparece si es jefe y no tiene celular, y nunca bloquea.
- La familia va escondida. Con una sola familia sale el enlace «¿Es de otra familia de esta casa?», que abre un select con «Familia …» y «Nueva familia». Con 2 o más familias el select va visible y es obligatorio.
- Pie: «Guardar» y «Guardar y agregar otro». El segundo limpia los campos, mantiene la familia elegida y deja el foco en el buscador.

**API** (`routes/dwellings.ts`):
- `POST /dwellings/:id/members` recibe `{ userId?, person?, familyId? | "NEW", isHead, relationship?, contact? }`.
  - La familia se crea sola si no hay ninguna.
  - Con `"NEW"` crea otra.
  - Sin `familyId` y con una sola familia, usa esa. Con 2 o más, pide elegir.
- `PATCH /dwellings/:id/members/:memberId` edita persona, parentesco, jefe y contacto.
- `DELETE` de un integrante:
  - Si es el único de su familia, se borra también la familia.
  - Si es jefe y quedan otros: «Marca a otro integrante como jefe antes de quitar a <nombre>».
  - La persona nunca se borra de Usuarios.
- Se quitaron los endpoints de crear y editar familia y los de integrantes por familia. Se conserva `DELETE /families/:familyId`, que usa el `⋯` del grupo.
- La lógica de personas es la del slice 1 y no tiene copia. Moví las guardias y el alta/edición desde `routes/users.ts` a `lib/person-records.ts` (`createPersonRecord`, `updatePersonRecord`). `users.ts` y los integrantes usan las mismas funciones.
- La lógica de integrantes está en `lib/dwelling-members.ts`. La familia y la jefatura van en un `db.batch`; si falla y la persona era nueva, se borra.
- El esquema no cambió.

### 2. Qué no corregí y por qué

- **Nota de familia (`families.note`):** ya nadie la edita ni la muestra. Quité `note` del recurso y las constantes, pero dejé la columna para no tocar el esquema.
- **Nada de lo que corregiste a mano se tocó.**

### 3. Archivos tocados

- **Compartido:** `packages/shared/src/families.ts`.
- **Servidor:**
  - nuevos: `lib/person-records.ts`, `lib/dwelling-members.ts`;
  - editados: `lib/person-input.ts`, `lib/dwelling-input.ts`, `lib/dwelling-resources.ts`, `routes/users.ts`, `routes/dwellings.ts`.
- **Web:**
  - nuevos: `modules/users/components/person-fields.tsx`, `modules/users/hooks/use-person-form-matches.ts`, `modules/dwellings/components/member-list.tsx`, `modules/dwellings/components/member-family-fields.tsx`, `modules/dwellings/utils/member-form.ts`;
  - reescritos: `modules/dwellings/components/member-form-modal.tsx`, `modules/dwellings/services/dwelling.service.ts`, `modules/dwellings/hooks/use-save-member.ts`, `modules/dwellings/hooks/use-delete-member.ts`, `routes/_app/viviendas.$dwellingId.tsx`;
  - editados: `modules/users/components/user-form-modal.tsx`, `modules/users/components/user-search.tsx` (prop opcional `onStartCreate`), `modules/dwellings/hooks/use-delete-family.ts`;
  - borrados: `family-card.tsx`, `family-form-modal.tsx`, `use-save-family.ts`.

### 4. Comandos para Thony

No hay migración, porque el esquema no cambió.

```bash
pnpm check-types
pnpm test
```

Dos puntos que el compilador puede marcar:
- `TPersonFormApi` en `person-fields.tsx` usa `any` en los genéricos de TanStack Form. Es el punto más probable de error de tipos.
- `BatchItem<"sqlite">` en `dwelling-members.ts` viene de `drizzle-orm/batch`.

Si alguno falla, pásame el error.

### 5. Qué volver a probar

1. Vivienda sin familias: «Agregar integrante» abre el formulario con la ⭐ prendida y bloqueada. Guárdalo y crea la familia sola.
2. Agrega un segundo integrante: no pide familia y el parentesco viene en «Hijo(a)».
3. «Guardar y agregar otro»: limpia los campos y deja el foco en el buscador.
4. Elige a alguien ya registrado: los campos se llenan con sus datos y se pueden corregir. Si ya integra otra familia, el servidor lo rechaza.
5. Prende ⭐ en otro integrante: aparece el toast, y el jefe anterior queda como «Otro pariente».
6. Jefe sin celular: aparece el contacto alternativo. Revisa la línea «Contacto: …» bajo su fila.
7. «¿Es de otra familia…?» → «Nueva familia»: la ⭐ queda bloqueada. Con 2 familias, la lista se agrupa y el select de familia es obligatorio.
8. Quitar al único integrante de una familia borra la familia. Quitar al jefe con otros integrantes da el mensaje de marcar a otro jefe.
9. «Eliminar familia» desde el `⋯` del grupo.
10. Desde Usuarios, edita una persona y revisa que el formulario de usuario siga igual: nombres, DNI y avisos de DNI repetido.
