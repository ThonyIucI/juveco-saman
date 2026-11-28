# Empadronamiento de viviendas, familias y personas de Samán

Fecha: 2026-11-27. Reemplaza a `empadronamiento-lluvias.md`, que quedó atado a la lluvia. Tamaño: **M**, máximo 4 slices.

Complejidad: alta — cambia `users`, que ya tiene datos (separar apellidos), y crea un dominio nuevo de varias tablas que tiene que servir para ayudas futuras de cualquier tipo.

## Para qué sirve

Juveco quiere conocer, vivienda por vivienda, quiénes viven en Samán y en qué condiciones, para que las autoridades puedan llevar ayuda a donde hace falta y presentar soluciones a los gobiernos distrital, provincial y regional.

Es un **censo genérico**. Servirá para cualquier ayuda: desastres, donativos, útiles escolares, herramientas agrícolas. Más adelante se le sumarán preguntas sociales (agua, luz, desagüe, educación, salud, economía).

**El primer uso es urgente.** El 26 de noviembre una lluvia prolongada dañó viviendas. El gobierno regional tiene material de ayuda, pero no lo entrega mientras no sepa a qué viviendas llevarlo. Juveco necesita **la data actual, ya**.

Quienes registran son los admins de la app. Thony también transcribe lo que otros llenen en papel o le manden por WhatsApp, así que el formulario tiene que ser rápido en celular y en escritorio.

## Cómo es la realidad que se modela

- **Vivienda:** la casa física. Su código es el **número del medidor de luz**, que de paso es un dato útil. Solo se registran las viviendas donde se encuentra a alguien.
- **Familia:** en una vivienda pueden vivir **varias familias**. Cada familia tiene su **jefe de hogar**, que es su contacto.
- **Persona:** cada integrante de una familia, con su parentesco respecto al jefe de su familia.
- **Datos actuales, sin historial.** Un censo posterior **actualiza** a las personas que ya existen y crea solo a las nuevas. No se guarda un registro por cada censo ni por cada evento.

## Decisiones de Thony (mandan sobre cualquier propuesta)

**Personas**
1. **Una persona censada es un usuario de la app** (la tabla `users` que ya existe), no una tabla aparte. Los datos del censo que no tienen todos los usuarios (DNI, fecha de nacimiento, género, condiciones) van en una **tabla de detalle** ligada al usuario. Si una propuesta prefiere otra forma, la justifica.
2. **Apellido paterno y apellido materno en campos separados**, para poder relacionar parentescos después. Esto toca a todos los usuarios: la propuesta dice qué pasa con los que ya tienen un solo campo de apellidos.
3. **DNI opcional.** Un recién nacido puede no tenerlo y sigue siendo habitante. Si se pone, no se repite.
4. **La edad sale de la fecha de nacimiento.** Menores y adultos mayores no se marcan a mano.
5. **Condiciones de prioridad por persona**, como opciones fijas que se pueden ampliar: gestante, dio a luz recientemente y con discapacidad. La prioridad de una familia sale de sus integrantes. Por ejemplo, es prioritaria si tiene niños pequeños, adultos mayores o alguna de esas condiciones. El detalle va en la nota.
6. **Teléfono:** el de contacto es el del jefe de cada familia; al resto, si lo tienen. **Nunca bloquea el registro**: puede vivir un anciano solo sin teléfono. En ese caso se pide el de un vecino o familiar como contacto (con a quién pertenece), y si no hay ninguno se guarda igual y la familia queda **marcada sin contacto**, visible en la lista y en el Excel.
6b. **Los censados aparecen en los selectores** de comprador, jugador, etc., como cualquier usuario. No es un problema: un usuario con vivienda es uno censado; los demás simplemente no tienen vivienda.

**Vivienda**

7. **Código de vivienda = número del medidor de luz.** Si no tiene medidor, la app genera un código con el prefijo del barrio y un correlativo (`SR-0001` para Santa Rosa). **Antes de guardar una vivienda sin medidor se pide confirmación** («Esta vivienda no tiene medidor, se le asignará SR-0001»), para no dejar una sin su medidor por olvido.
8. **Ubicación:** coordenadas y enlace a Google Maps. Da igual si casas vecinas comparten coordenadas aproximadas; en el lugar se distinguen.
9. **Estado de la vivienda:** 3 niveles, de afectada a inhabitable. Es un dato **actual** de la vivienda (no de la lluvia), con los nombres como constantes con etiqueta. Por ahora, «Afectada», «Muy afectada» e «Inhabitable»; se renombran después sin tocar el resto.
10. **Material:** el predominante de las paredes.
11. **Fotos:** la app no sube archivos. Cada vivienda guarda el enlace a su carpeta de Google Drive.
12. **Barrios:** solo los de Samán que ya están en el sistema. No hay barrios nuevos.
13. **Observación y nota:** opcionales.

**Padrón en Excel (`.xlsx`)**

14. **Se exporta todo**; se filtra en el mismo Excel.
15. **Una hoja de resumen** (conteos por barrio y por estado de vivienda, familias, personas y prioridades) y **una hoja por barrio**.
16. En la hoja de cada barrio, una fila por persona, agrupadas:
    - la celda de la **vivienda** se combina sobre todas sus filas;
    - la celda de la **familia** se combina sobre sus integrantes;
    - el **jefe de hogar** va primero, resaltado y con su teléfono;
    - después van los datos de cada persona (nombres, apellidos, DNI, fecha de nacimiento, edad, parentesco, condiciones);
    - **al final, el estado de la vivienda y los riesgos**, que es como más fácil se lee.
17. Para combinar celdas hace falta una librería de Excel; la propuesta elige cuál y dónde se genera el archivo.

**Alcance**

18. Se hace en la app, ya. **Máximo 4 slices**, en orden de flujo: primero registrar (vivienda, familias y personas), después consultar, al final exportar.
19. **Fuera de esta fase:** encuesta social, entregas de ayuda por campaña, historial, subir fotos, trabajo sin señal y flujo para actualizar un censo anterior. Nada de esto se construye ahora, pero el diseño no debe impedirlo.
20. Nada de esto aparece en la portada pública. DNI, fechas de nacimiento y condiciones son datos sensibles; los ven solo los admins.

## Lo que la propuesta tiene que resolver

- **Persona repetida.** Por DNI cuando lo tiene. Sin DNI, por ejemplo un bebé, avisar si hay alguien con el mismo nombre y la misma fecha de nacimiento.
- **Una persona en dos familias.** No debería pasar con los datos actuales; la propuesta dice cómo se evita.
- **Cambiar al jefe de una familia** sin rehacerla.

## Criterios de aceptación

1. Desde el celular, un admin registra una vivienda con sus familias e integrantes en menos de 5 minutos, y Thony puede transcribir una ficha de papel igual de rápido desde escritorio.
2. La lista de viviendas se filtra por barrio, estado y prioridad. El detalle muestra las familias, sus integrantes, la ubicación en Maps y la carpeta de fotos.
3. El Excel tiene la hoja de resumen y una hoja por barrio, con las celdas combinadas como dice la decisión 16.
4. Un DNI no se repite. Si alguien ya existe, el sistema avisa y lleva a su registro.
5. Una campaña de ayuda futura, de cualquier tipo, se puede colgar de viviendas, familias o personas sin rehacer estas tablas.
