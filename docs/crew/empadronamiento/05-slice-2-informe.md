# Informe: Slice 2 — registrar viviendas con sus familias e integrantes

No corrí nada: ni compilación, ni migración, ni tests. Todo el código está sin verificar hasta que corras los comandos de abajo.

## 1. Qué quedó funcionando

- **«Viviendas» en el menú**, con una lista simple y el botón «Nueva vivienda». En escritorio es tabla; en celular, cards. La lista tiene paginación, sin filtros.
- **Nueva vivienda.** Eliges el barrio y aparece «Se le asignará SR-0001». El medidor es opcional; si ya está en otra vivienda, avisa «Este medidor ya está en SR-0003…» y te deja seguir.
- **Confirmación al guardar.** Siempre repite el código. Si no pusiste medidor, además dice «Esta vivienda no tiene medidor…». Si otro admin tomó ese código mientras tanto, avisa con el código nuevo y pide confirmar de nuevo.
- **Datos de la vivienda.** Estado (por defecto «Sin daño»), material de paredes con la lista del INEI, coordenadas, enlace de Maps y carpeta de fotos de Drive. «Usar mi ubicación» llena las coordenadas con el GPS del celular. Observación y nota van al final.
- **Detalle de la vivienda.** Muestra estado, medidor, paredes, botones «Abrir en Maps» y «Ver fotos», y una card por familia. Cada familia muestra primero al jefe y luego a los integrantes con parentesco, edad y condiciones. Después de guardar una vivienda nueva, la app te lleva a este detalle para que cargues las familias enseguida.
- **Agregar familia.** Eliges o creas al jefe. Si el jefe no tiene teléfono, aparece el contacto alternativo (a quién pertenece y número), que se puede dejar vacío.
- **Agregar integrante.** Buscador más parentesco, con «Guardar y agregar otro». El parentesco por defecto es «Hijo(a)».
- **Ediciones y borrados.** Se puede editar la vivienda, el contacto y la nota de la familia, y el parentesco de un integrante. Se puede quitar a un integrante (el jefe no). Se puede eliminar una familia, y una vivienda solo si no tiene familias.
- **Persona en dos familias.** El servidor lo rechaza con «Ana ya integra una familia de la vivienda SR-0001».
- **Usuarios.** A quien integra una familia ya no se le puede eliminar desde Usuarios; el mensaje pide quitarla primero de su familia.

## 2. Archivos tocados

**Compartido (`packages/shared/src`)**
- `neighborhoods.ts`: cada barrio suma `prefix` (SR, RC, MA, EP, NE), solo en la constante.
- `dates.ts`: `ageOn(birthDate, today)`.
- `dwellings.ts` (nuevo): estado, material, límites, mensajes, `formatDwellingCode` y tipos de la API.
- `families.ts` (nuevo): parentescos con etiqueta, mensajes y tipos de familia e integrante.

**Base de datos (`packages/db/src/schema`)**
- `dwellings.ts` (nuevo): tabla `dwellings`, con único `(barrio, correlativo)`.
- `families.ts` (nuevo): tablas `families` y `family_members`, con único sobre la persona y un único jefe por familia.
- `index.ts`: exporta las dos anteriores.

**Servidor (`apps/server/src`)**
- `lib/dwelling-input.ts` (nuevo): validaciones zod de vivienda, familia e integrante.
- `lib/dwelling-resources.ts` (nuevo): arma la lista (con conteos y jefes) y el detalle (con edad y condiciones).
- `routes/dwellings.ts` (nuevo): todos los endpoints bajo `/dwellings`.
- `index.ts`: registra las rutas.
- `routes/users.ts`: no deja eliminar a quien integra una familia.

**Web (`apps/web/src`)**
- `routes/_app/viviendas.index.tsx` y `routes/_app/viviendas.$dwellingId.tsx` (nuevos): la lista y el detalle.
- `modules/dwellings/` (nuevo): `services/dwelling.service.ts`, 10 hooks en `hooks/`, `utils/dwellings.ts` y 8 componentes: `dwelling-table`, `dwelling-card-list`, `dwelling-status-badge`, `dwelling-form-modal`, `dwelling-info-card`, `family-card`, `family-form-modal`, `member-form-modal`.
- `common/hooks/use-current-position.ts` (nuevo): el GPS del celular.
- `common/constants/routes.ts`: entrada «Viviendas» en el menú y en la barra inferior.
- `common/components/form-submit-buttons.tsx`: prop opcional `continueLabel` («Guardar y agregar otro»).
- `common/components/neighborhood-badge.tsx`: acepta `{id, name}`, para que no rompan los tres usos que arman ese literal.
- `routeTree.gen.ts`: lo regeneró solo tu dev server; no lo toqué.

## 3. Decisiones que tomé

- **El barrio no se cambia al editar una vivienda**, porque el código lleva sus iniciales. En el formulario de edición se muestra solo el badge.
- **Las escrituras de familias e integrantes devuelven la vivienda completa**, y la pantalla se reemplaza sin recargar.
- **El aviso de medidor repetido** va por `GET /dwellings/meter-matches`, con espera de 400 ms al escribir.
- **El código se pide de nuevo al guardar.** La confirmación muestra el código vigente en ese momento, no el que se vio al elegir el barrio.
- **La API responde 409 con el código nuevo en el mensaje**, porque el sobre de errores solo lleva texto. Tras ese error, el front pide el código nuevo.
- **Contacto alternativo.** Se guarda solo si el jefe no tiene teléfono; con teléfono se ignora. Si pones nombre o número, deben ir los dos.
- **Quitar al jefe o cambiarle el parentesco se rechaza.** El cambio de jefe llega en el Slice 3.
- **Un integrante nuevo no puede ser «Jefe».** Se elige solo al crear la familia.
- **Enlaces de Maps y Drive:** deben empezar con `http://` o `https://`.
- **Coordenadas:** van las dos o ninguna.
- **«Usar mi ubicación»** redondea a 6 decimales.
- **Largo del medidor:** 20. Enlaces, observación y notas: 500. Nombre del contacto: 120.
- **Sin filtros ni buscador en la lista de viviendas**, como pide el plan. Eso llega en el Slice 3.
- **Barra inferior del celular:** ahora tiene 5 entradas, porque «Viviendas» se sumó a las demás. Mira que no se vea apretada.
- **No hay migración de datos en este slice.** Son tablas nuevas, sin sembrar nada.

## 4. Comandos para Thony

```bash
# 1. Generar la migración de esquema (tablas nuevas; no debería preguntar por rename)
pnpm db:generate

# 2. Aplicarla en la base local
pnpm db:migrate:local

# 3. Verificar tipos y compilación
pnpm check-types

# 4. Tests existentes
pnpm test
```

Si `db:generate` pregunta por renombrar algo, algo se salió del plan: no elijas «rename» y avísame.

## 5. Cómo probarlo

Prueba primero en el celular y luego en escritorio, cronometrando.

1. Entra a **Viviendas** y toca **Nueva vivienda**. Elige Santa Rosa: debe aparecer «Se le asignará SR-0001».
2. Pon un medidor, toca **Registrar vivienda** y verifica que la confirmación diga `SR-0001`. Confírmala: debes caer en el detalle.
3. En el celular, toca **Usar mi ubicación** y verifica que se llenen las coordenadas. Después revisa que **Abrir en Maps** abra el lugar.
4. Crea otra vivienda en Santa Rosa con el mismo medidor: debe avisar «ya está en SR-0001». Debe quedar como `SR-0002`.
5. Crea una tercera sin medidor: la confirmación debe advertirlo.
6. En el detalle de una vivienda, toca **Agregar familia** y elige como jefe a un comprador del bingo (con teléfono). No debe pedir contacto alternativo.
7. Agrega una segunda familia con un jefe nuevo sin teléfono: aparece el bloque de contacto. Pon el de un vecino y comprueba que se vea en la card.
8. Con **Agregar integrante** (ícono en la card), carga un bebé sin DNI y un adulto con **Guardar y agregar otro**. Revisa que la edad se vea si tiene fecha de nacimiento.
9. Intenta agregar a una persona que ya está en la otra familia: debe salir el error con el código de la vivienda donde está.
10. Cambia el parentesco de un integrante y quítalo. Verifica que el jefe no tenga acciones de editar ni quitar.
11. Intenta eliminar una vivienda con familias: debe negarse. Elimina las familias y vuelve a intentar.
12. Desde **Usuarios**, intenta eliminar a un integrante de una familia: debe explicar que primero se le quita de su familia.
13. Mide el tiempo: la meta es menos de 5 minutos por vivienda. Si pasa de eso, el plan ya prevé pasar a un formulario de familia con filas repetibles, sin cambiar la API.
