## Lo mejor de la otra propuesta

- **Ubicación en campo (§7).** Mostrar «±12 m», repetir la lectura y abrir Maps permite al brigadista comprobar, antes de irse, si el punto sirve para entregar la ayuda.
- **Carga de familias (§7).** «Crear y seguir creando» evita volver al detalle por cada habitante. Es una mejora concreta para la meta de cinco minutos.
- **Lectura del Excel (§8).** La hoja «Viviendas» da a la brigada de reparto una fila por destino. Complementa las hojas «Personas» y «Resumen».

## Problemas

1. **Una vivienda incompleta ya cuenta (§§5–8).** Se crea antes de registrar habitantes y fotos. Si se corta la señal, puede sumar en «Resumen» sin aparecer en «Personas». También se permite borrar al único jefe o la última foto. Confirmaría el alta con coordenadas, exactamente un jefe y una o dos fotos. Las ediciones conservarían esos mínimos.
2. **Repetir el paso puede duplicarlo (§§6 y 9).** Si el servidor crea la vivienda y se pierde la respuesta, el segundo `POST` puede crear otra. Una foto también puede ocupar dos cupos. Usaría un identificador estable por captura para recuperar la confirmación. Probaría el corte justo después de guardar.
3. **La escala cambia el significado del daño (§5).** El contexto sitúa «Inhabitable» en el extremo superior. Claude la pone en medio y añade «Destruida». Renombrar etiquetas después dejaría ambiguos los registros ya clasificados. Confirmaría los tres niveles con la autoridad antes de la primera visita y usaría códigos estables como `L1`–`L3`.
4. **El Excel puede omitir barrios sin avisar (§§7–9).** El botón dice «Exportar Excel» y exporta lo filtrado. Un filtro olvidado deja viviendas fuera de la entrega. Haría explícita la acción «Exportar padrón completo». Probaría con dos barrios y uno oculto por el filtro. El archivo debe incluir ambos y sus conteos.
5. **Abrir la lista descarga todos los DNI y nacimientos (§§6–7).** Consultar cuántas viviendas están inhabitables transfiere datos de todos los habitantes, incluidos menores, sobre una conexión irregular. Devolvería resúmenes filtrados. Consultaría el DNI introducido para detectar coincidencias y cargaría los datos personales al abrir la ficha o exportar.
6. **Ningún slice mide la visita completa (§8).** Cargar cuatro habitantes y tomar dos fotos en pruebas separadas deja sin comprobar el criterio de cinco minutos. Al terminar el tercer slice, cronometraría una visita en celular, desde la toma de GPS hasta la confirmación de la última foto, con señal de campo.

## Errores de hecho sobre el código

- **§2.** `useRequest` expone `setData`. `onUpsert` y `onRemove` los implementa el hook del listado. Para el padrón copiaría ese patrón. [use-request.ts](/home/thony/own/juveco-saman/apps/web/src/common/hooks/use-request.ts:45) · [use-list-users.ts](/home/thony/own/juveco-saman/apps/web/src/modules/users/hooks/use-list-users.ts:12)
- **§5.** Añadir columnas a `users` no mostraría automáticamente DNI y nacimiento en Usuarios. `toUserResource` elige cada campo que devuelve. Sí crecería el directorio, argumento suficiente para separar habitantes. [users.ts](/home/thony/own/juveco-saman/apps/server/src/routes/users.ts:73)
- **§6.** Web y API tienen orígenes distintos en producción. Una imagen puede cargar con la cookie de la API, pero eso debe comprobarse con la URL real. Probaría también que la misma URL exija sesión en incógnito. [Configuración del Worker](/home/thony/own/juveco-saman/apps/server/wrangler.jsonc:28)

## Lo que adoptaría de la otra en la mía.

Añadiría la precisión del GPS y «Volver a tomar». Incorporaría «Agregar y seguir» dentro de la captura para familias numerosas. Incluiría «Viviendas» en el Excel completo, con la referencia, el enlace a Maps y el número de habitantes por destino.

## Desacuerdos que mantengo

- **Daño por episodio o por vivienda (§3).** Mantendría el informe por episodio para conservar la evidencia de cada lluvia.  
  Si Thony confirma que solo interesa esta emergencia, guardarlo en la vivienda ahorra una tabla.

- **Habitantes sin DNI (§5).** Exigiría los ocho dígitos mientras la autoridad los pida para la entrega.  
  Si acepta bebés u otros residentes sin documento, admitiría el alta provisional y acordaría cómo conciliarla después.