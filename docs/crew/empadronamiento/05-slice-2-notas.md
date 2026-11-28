# Notas de Thony: slice 2, vuelta 1

Probé el detalle de una vivienda y el formulario. Lo nuevo está en el plan: **decisiones 8, 9, 10 y 13**. En esta vuelta va solo el **slice 2 (ajuste)**. El formulario público (2b) y las fotos en Drive (2c) **no** van todavía: deja el paso 3 con observación y nota, y el lugar listo para las fotos.

## Fallos de diseño (en el detalle `/viviendas/$dwellingId`)

1. **El código se parte en el celular** («MA-» arriba, «0001» abajo), porque el botón «Agregar familia» le quita ancho.
   - El código nunca se corta (`whitespace-nowrap`).
   - En el celular, el botón primario no compite con el título: va como ícono con borde o en su propia fila, a todo el ancho, debajo de la cabecera.
2. **La card de datos no tiene orden:**
   - el badge de estado y «0 familias · 0 personas» van sueltos arriba, con otro estilo que las filas;
   - las filas tienen demasiado aire vertical;
   - «Abrir en Maps» queda sangrado y desalineado respecto de las filas.

   Arréglalo así:
   - una grilla etiqueta/valor alineada y compacta, con el estado como una fila más («Estado: [badge]»);
   - los conteos en la cabecera de la card o en el título de la sección de familias;
   - las acciones (Maps y, a futuro, Fotos) alineadas al pie de la card o en su cabecera.
3. **El título de la card («Vivienda») repite la cabecera de la página.** Ponle algo útil, como «Datos de la vivienda».
4. **«Paredes: Otro» no dice nada.** Debe mostrar lo que se especificó (decisión 9).
5. Revisa la misma página y el formulario a **360 px de ancho**: nada se corta ni se monta, y la barra inferior de 5 entradas no se aprieta.
6. Respeta las reglas de diseño del proyecto: `docs/tecnico/convenciones.md` y los componentes comunes que ya existen (cards, botones de ícono con borde, una sola acción primaria por vista).

## Formulario de vivienda (decisiones 8–10)

- **Tres pasos:** 1 Vivienda (barrio, medidor, estado, material), 2 Ubicación (mapa con pin) y 3 Notas (observación y nota). Arriba va un indicador «Paso 1 de 3 · Vivienda». «Siguiente» valida solo el paso actual y «Atrás» conserva lo escrito. La confirmación del código y del medidor sigue al guardar, al final.
- **Mapa:** Leaflet con `react-leaflet`.
  - Capa satelital Esri World Imagery por defecto, con un botón para pasar a calles (OpenStreetMap). Atribuciones visibles.
  - Centro inicial: Samán (pon la constante con las coordenadas de la plaza; si no la sabes, usa el centro de las viviendas existentes o déjala anotada en el informe para que yo la complete). «Usar mi ubicación» centra el mapa y mueve el pin ahí.
  - Tocar el mapa mueve el pin; el pin también se arrastra. Debajo se ven las coordenadas (6 decimales) y un botón «Quitar ubicación».
  - Carga el mapa con import dinámico, para no engordar el resto de la app. Importa el CSS de Leaflet y arregla el ícono del marcador (el problema clásico de las rutas de imagen con Vite).
- **Material:** ícono (i) con tooltip al lado de la etiqueta (hover en escritorio, toque en celular), con el texto de la decisión 9. Con «Otro», aparece el campo «Especifica el material» (obligatorio, máx. 120), que se guarda en una columna nueva y se muestra en el detalle como el material.
- **Se quitan** los campos «enlace de Maps» y «carpeta de fotos (Drive)» del formulario, la API, los tipos y el esquema. «Abrir en Maps» se arma con las coordenadas: `https://www.google.com/maps?q=<lat>,<lng>`.
- **Editar:** usa los mismos pasos y deja saltar a cualquiera (los pasos se pueden tocar).

## Comandos

- `leaflet`, `react-leaflet` y `@types/leaflet` no están instalados: ponlos en el informe para que los instale yo.
- Los cambios de esquema van en una migración nueva, encima de la 0017, que ya apliqué en local.
