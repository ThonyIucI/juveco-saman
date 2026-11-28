## 1. Qué corregí

**Fallos de diseño del detalle**
- **Código partido en el celular (1):** el título tiene `isTitleNowrap`, una prop nueva de `PageHeader`, y nunca se parte. «Agregar familia» queda como la única acción primaria. En escritorio va a la derecha del título; en el celular va en su propia fila, a todo el ancho, debajo de la cabecera.
- **Card sin orden (2):** ahora es una grilla etiqueta/valor compacta. El estado es una fila más («Estado: [badge]»). `DetailRow` ganó la prop `isCompact`: fila más baja y valor que se envuelve. Los conteos («2 familias · 7 personas») pasaron al título de la sección «Familias». «Abrir en Maps» quedó en un pie de acciones alineado, listo para sumar «Ver fotos» en 2c.
- **Título de la card (3):** pasó de «Vivienda» a «Datos de la vivienda».
- **«Paredes: Otro» (4):** muestra el material especificado, con `wallMaterialText`.
- **360 px (5):** la barra inferior de 5 entradas lleva `px-0.5`, `text-[11px]`, `whitespace-nowrap` y `min-w-0`, para que no se apriete ni se corte. No pude verlo en pantalla; hay que probarlo.
- **Convenciones (6):** usé los componentes comunes (`DetailSection`, `IconButton`, `Modal`, `Select`, `TextField`, `FormSubmitButtons`).

**Formulario (decisiones 8–10)**
- **Tres pasos:** Vivienda, Ubicación y Notas, con el indicador «Paso X de 3 · Título» y tres segmentos tocables.
  - Al crear, «Siguiente» valida solo los campos del paso actual y «Atrás» conserva todo, porque los pasos quedan montados.
  - Enter en un paso intermedio avanza y no guarda.
  - Si el envío final falla por un campo de otro paso, el formulario vuelve a ese paso.
  - La confirmación del código y del medidor sigue al guardar, al final.
  - Al editar se puede saltar a cualquier paso y «Guardar cambios» está siempre a mano.
- **Mapa:** `react-leaflet` con Esri World Imagery por defecto y un botón Satélite/Calles (OpenStreetMap), ambos con atribución visible.
  - Tocar el mapa mueve el pin y el pin se arrastra.
  - «Usar mi ubicación» mueve el pin y centra el mapa en el GPS.
  - Debajo se ven las coordenadas con 6 decimales y el botón «Quitar ubicación».
  - Carga con `lazy` e import dinámico. El CSS de Leaflet y el ícono del marcador (imágenes importadas) van dentro del mismo chunk.
- **Material:** ícono (i) con tooltip (`InfoTip`, hover en escritorio y toque en celular) con el texto de la decisión 9. Con «Otro» aparece «Especifica el material» (obligatorio, máx. 120). El servidor lo exige con «Otro» y lo descarta con cualquier otro material.
- **Se quitaron** `mapsUrl` y `photosUrl` del esquema, los tipos, la API y el formulario. Se agregó la columna `wall_material_other`. «Abrir en Maps» sale de las coordenadas.

## 2. Qué no corregí y por qué
- **Coordenadas del centro del mapa:** no sé las exactas de la plaza de Samán. Dejé `SAMAN_MAP_CENTER` en `packages/shared/src/dwellings.ts` con valores aproximados y un TODO para que las completes.
- **Fotos y formulario público (2b y 2c):** no van en esta vuelta, como pediste. El paso 3 tiene un comentario donde irán las fotos.

## 3. Archivos tocados
- **Compartido y base:** `packages/shared/src/dwellings.ts`, `packages/db/src/schema/dwellings.ts`
- **Servidor:** `apps/server/src/lib/dwelling-input.ts`, `apps/server/src/lib/dwelling-resources.ts`
- **Web, nuevos:** `common/components/info-tip.tsx`, `modules/dwellings/components/dwelling-location-map.tsx` y `dwelling-location-step.tsx`
- **Web, reescritos o editados:** `dwelling-form-modal.tsx`, `dwelling-info-card.tsx`, `routes/_app/viviendas.$dwellingId.tsx`, `common/components/detail-section.tsx`, `common/components/page-header.tsx`, `components/bottom-nav.tsx`

## 4. Comandos para Thony
```bash
# 1. Dependencias del mapa
pnpm --filter web add leaflet react-leaflet
pnpm --filter web add -D @types/leaflet

# 2. Migración nueva encima de la 0017
pnpm db:generate
# Si pregunta si «wall_material_other» es un rename de «maps_url» o «photos_url»,
# elige CREAR columna, nunca rename.

# 3. Aplicarla en local
pnpm db:migrate:local

# 4. Verificar
pnpm check-types
pnpm test
```
No hay migración de datos. Los `maps_url` y `photos_url` de prueba se pierden al borrar las columnas.

## 5. Qué volver a probar
- Detalle a 360 px: el código «MA-0001» en una sola línea, «Agregar familia» a todo el ancho debajo de la cabecera y la barra inferior sin cortes.
- Card de datos: estado como fila, filas compactas, «Abrir en Maps» alineado, conteos en «Familias».
- Crear una vivienda: «Siguiente» no deja pasar del paso 1 sin barrio, «Atrás» conserva lo escrito y la confirmación sigue al final.
- Mapa: satélite y calles, tocar, arrastrar, «Usar mi ubicación» y «Quitar ubicación». Que nada del mapa tape el encabezado ni el pie de la modal al hacer scroll.
- Material «Otro»: sin texto no deja avanzar, y el detalle muestra lo escrito en «Paredes».
- Tooltip (i): hover en escritorio y toque en celular.
- Editar: saltar entre pasos tocando los segmentos y guardar desde cualquiera.
- Que no queden campos de enlace de Maps ni de carpeta de fotos en ninguna pantalla.
