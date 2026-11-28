# Empadronamiento rápido de viviendas afectadas por lluvias

Fecha: 2026-11-27. Tamaño estimado: **M**. Si la fase 1 no cabe en 4 slices, es L y se parte en dos ítems antes de implementar.

## Contexto

El 26 de noviembre hubo una lluvia moderada pero prolongada en Samán y hay viviendas dañadas. El gobierno regional tiene material de ayuda, pero no lo entrega mientras no sepa a qué viviendas llevarlo. Las autoridades le piden a Juveco un padrón de las viviendas afectadas y de quiénes viven en ellas.

A mediano plazo Juveco quiere un censo por familias (acceso a agua, luz y desagüe; educación, salud, economía) para presentar propuestas al gobierno distrital y provincial. Lo urgente es lo primero; lo segundo define cómo deben quedar los datos para no rehacerlos.

Juveco es la organización que usa esta app. Quienes la usan son sus administradores (`ADMIN`, `SUPERADMIN`); un `USER` no entra.

## Qué se quiere (fase 1, urgente)

Que un admin, desde el celular y en la calle, registre cada vivienda afectada y que al final se pueda sacar el padrón para entregarlo:

- **Vivienda:** ubicación por GPS del teléfono, barrio o sector, referencia escrita (calle, lote, «frente a…»).
- **Estado del daño:** 3 niveles, de *afectada* a *inhabitable*.
- **1 a 2 fotos** del daño, tomadas con la cámara.
- **Habitantes:** nombres completos, DNI, fecha de nacimiento, quién es el jefe de hogar y el parentesco de los demás con él.
- **Padrón exportable** (Excel) para entregarlo a las autoridades: una fila por persona con los datos de su vivienda, más un conteo de viviendas por estado.
- **Consulta** en la app: lista de viviendas filtrable por estado y barrio, detalle con fotos y habitantes, y la ubicación consultable (mapa o enlace a Google Maps con las coordenadas).

## Qué no se hace ahora

- La encuesta social completa (servicios, educación, salud, economía). **Pero** vivienda y habitantes son la base de ese censo: el diseño tiene que poder crecer a eso sin rehacer la fase 1.
- Nada de esto aparece en la portada pública.

## Datos

**Pedidos por las autoridades:**
- nombres completos de quienes viven en la casa, separados por vivienda, con fecha de nacimiento y DNI;
- 1 a 2 fotos del daño;
- estado: afectada / (nivel intermedio) / inhabitable.

**Que Thony suma:**
- coordenadas GPS de la vivienda.

**Que se podrían sumar (las propuestas dicen cuáles van en fase 1 y cuáles después):**
- teléfono de contacto del jefe de hogar;
- señales de vulnerabilidad por persona o por vivienda: menores, adultos mayores, gestantes, discapacidad (sirven para priorizar la ayuda);
- material de la vivienda (adobe, ladrillo, otro) y tenencia (propia, alquilada, cedida);
- quién empadronó y cuándo (sale solo de la sesión);
- observación libre.

## Condiciones de campo

- Se registra desde el celular, con señal irregular; varias personas pueden estar empadronando a la vez.
- Las fotos salen de la cámara del teléfono y pesan varios MB: hay que reducirlas antes de subir.
- El GPS se toma del teléfono en el momento; debe poder corregirse a mano.
- Una vivienda se registra en menos de 5 minutos.

## Restricciones técnicas

- Stack actual del repo (Hono + Drizzle/D1 + React/Vite en Cloudflare), convenciones de `docs/tecnico/convenciones.md` y reglas de `../CLAUDE.md` (largos máximos en zod, `PageContainer`, `PageBox isFill`, `Loadable`).
- **Hoy no hay almacenamiento de archivos.** Cloudflare R2 está disponible en la misma cuenta; la propuesta decide cómo guardar las fotos.
- DNI y fechas de nacimiento, incluidas las de menores, son datos sensibles: solo los ven los admins.
- Sin pruebas automáticas. Thony prueba a mano cada slice.

## Criterios de aceptación (fase 1)

1. Desde el celular, un admin registra una vivienda con GPS, estado, 1–2 fotos y sus habitantes, en menos de 5 minutos.
2. La lista de viviendas se filtra por estado y barrio; el detalle muestra fotos, habitantes y ubicación consultable.
3. Se exporta el padrón a Excel: una fila por persona con los datos de su vivienda, y un conteo de viviendas por estado.
4. Una persona no se registra dos veces con el mismo DNI; el sistema avisa y permite ir a la que ya existe.
5. La fase 2 (encuesta social) se agrega sobre estas tablas sin rehacerlas.

## Decisiones de Thony (2026-11-27, tras la primera síntesis)

1. **Apellido paterno y materno en campos separados**, para poder cruzar parentescos después.
2. **Teléfono obligatorio:** al menos 1 (mejor 2) de contacto por vivienda; por persona, el que se tenga.
3. **Edad sale de la fecha de nacimiento.** Discapacidad y gestante se marcan como sí/no por persona (se pueden contar); el detalle va en la nota.
4. **Material: el predominante de las paredes**, como en el censo del INEI.
5. **Ubicación:** coordenadas tomadas de Google Maps y un enlace a Maps generado a partir de ellas.
6. **Fotos en Google Drive**, no en almacenamiento propio: una carpeta por barrio y, dentro, una por vivienda con su código.
7. **Niveles de daño como constantes** con su etiqueta; se renombran sin tocar el resto.
8. **No hay barrios nuevos:** solo Samán, con los barrios que ya están en el sistema.
9. **Se hace en la app, ya** (Thony tiene tiempo ahora). Lo que llegue en papel o por WhatsApp lo transcribe Thony en la misma app, así que el formulario tiene que ser rápido de llenar también desde escritorio.
10. **Fotos:** la app no sube archivos. Cada vivienda guarda el **enlace a su carpeta de Drive**. Nada de R2.
11. **Exportar:** CSV (Excel lo abre); no se agrega una librería de Excel.
12. **Dos familias en una casa:** mientras Thony no diga otra cosa, un solo jefe por vivienda; a los demás se les pone el parentesco con ese jefe.

## Plazo y tamaño

- **Urgente: la ayuda espera este padrón.** El slice 1 tiene que dejar registrando viviendas y personas el mismo día.
- **Máximo 3 slices**, en este orden: (1) vivienda con sus habitantes, (2) lista con filtros y detalle, (3) exportar CSV y conteo por estado.
- Fuera de la fase 1: visitas «confirmadas», varias visitas por vivienda, control de concurrencia más allá del DNI único, subida de fotos, trabajo sin señal.

## Preguntas abiertas y supuestos

Mientras Thony no diga otra cosa, las propuestas trabajan con estos supuestos y los dejan fáciles de cambiar:

- **Nombre exacto de los 3 niveles de daño.** Thony recuerda «afectada» e «inhabitable» como extremos y no el intermedio. Referencia: el EDAN de INDECI usa *afectada / inhabitable / destruida*; el municipio puede usar otros. Supuesto: constantes con etiqueta en `packages/shared`, como los roles; se renombran sin migrar.
- **Barrios.** La app tiene 5; las viviendas afectadas pueden estar en otros sectores. Supuesto: se agregan como barrios nuevos por la vía que ya existe.
- **Quién empadrona.** Supuesto: admins con la app.
- **¿Las personas empadronadas van en `users` o en una tabla propia?** No es un supuesto: es una decisión de diseño que cada propuesta tiene que justificar (costo, quién se ve afectado, deuda, impacto en consultas).
- **¿No bastaría un Excel?** Cada propuesta responde con honestidad qué aporta la app frente a una hoja compartida, y si la fase 1 cabe en 4 slices. Si no cabe, recomienda qué usar como puente mientras se construye.
