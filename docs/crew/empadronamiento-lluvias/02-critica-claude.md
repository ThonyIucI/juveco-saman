# Crítica a la propuesta de Codex: empadronamiento-lluvias

## 1. Lo mejor de la otra propuesta

- **Envío único que se puede repetir.** `POST /rain-reports` lleva un UUID que crea el celular, se guarda todo en un solo `db.batch` y, si se pierde la respuesta, se reenvía la misma captura. Con señal irregular es lo más sólido de las dos propuestas. La mía deja la vivienda a medias si la señal se cae entre pasos.
- **Separa el episodio de la vivienda (`rain_reports`).** Resuelve desde el inicio lo que yo dejé como pregunta 2. Si hay otra emergencia, se agrega otro reporte sin migrar ni copiar datos.
- **Prueba concreta de la privacidad de las fotos.** El slice 3 abre la URL de una foto en incógnito para comprobar que pide sesión. Es fácil de hacer y comprueba algo que importa.

## 2. Problemas

1. **No hay forma de editar ni de borrar.** La API solo tiene alta, consulta y lookup: no hay `PATCH` ni `DELETE` de vivienda, habitante ni foto. En la calle es seguro que habrá un DNI mal tipeado, un hijo olvidado o una coordenada para corregir. Además, «GPS corregible» pide corregirlo después, no solo al capturar. Agregaría `PATCH`/`DELETE` por recurso, como en `activity-teams`.
2. **DNI obligatorio y «exactamente un jefe».** Muchos bebés y adultos mayores de zona rural no tienen DNI. La propuesta misma admite que un número inventado rompe el control de duplicados, y aun así lo exige. En la práctica, la persona no se registra o se registra con un número falso. Lo haría nulo con índice único: SQLite permite varios `NULL`, igual que `users_phone_uidx` en `packages/db/src/schema/users.ts:33`.
3. **El slice 1 no guarda nada y el slice 2 carga casi todo.** El slice 1 termina en «vista previa». El slice 2 junta esquema, R2, alta, lookup e idempotencia en uno solo. Thony no puede probar a mano algo real hasta el slice 2, que es el más grande. Rompe la idea de «cada parte se prueba antes de seguir» (`docs/estado.md`). Cortaría por entidad, con lo guardado desde el primer slice.
4. **Infraestructura que falta y no se nombra.** «Una tarea recoge los [objetos] de más de 24 horas» necesita un cron trigger, y `wrangler.jsonc` no tiene `triggers`. «La fecha del episodio viene de configuración»: esa configuración no existe en el repo. Las dos cosas suman trabajo que no está en ningún slice. Para la fecha, usaría una constante en `shared`. Para los huérfanos, lo dejaría como riesgo aceptado.
5. **Se pierde lo cargado si se cierra la pestaña.** La captura atómica guarda todo en memoria hasta el final, así que cerrar la pestaña o que el celular la descargue borra una familia entera (lo admite en Riesgos). Además, base64 en JSON suma alrededor de 33 % de tráfico justo con mala señal. El tope de 350 KB no define tamaño en píxeles ni calidad, así que no se sabe si la compresión llega. Al menos, guardaría el borrador en `localStorage`.
6. **Deja fuera teléfono y nota a pesar de que cuestan casi nada.** El teléfono del jefe es lo que usará el gobierno para coordinar la entrega, y ya existen `phoneSchema` y `PhoneInput`. La nota va en todas las entidades del repo (`noteSchema`). Sacarlas no ahorra un slice y le quita a la entrega datos útiles.

## 3. Errores de hecho sobre el código

Ninguno grave. Lo que afirma del repo se confirma: `/api/v1` (`packages/shared/src/api.ts:20`), `UserSearch` filtra en memoria y `apiRequest` manda la cookie. Un índice único parcial (`uniqueIndex().where()`) es posible en Drizzle, pero ninguna tabla lo usa todavía: es un patrón nuevo, no uno que ya exista.

## 4. Lo que adoptaría de la otra en la mía

- **Tabla de reportes por episodio.** Tomaría `rain_reports` (yo lo llamaría `household_damage_reports`), con daño, fotos, empadronador y fecha, en lugar de dejarlo abierto como pregunta.
- **UUID que crea el cliente para la vivienda.** Así el `POST` se puede reintentar sin duplicar, aunque los pasos sigan separados.
- **`POST /residents/lookup` con el DNI en el cuerpo, no en la URL.** Sirve para el aviso después de un 409, sin depender de la lista cargada.
- **Excel:** DNI como texto, para no perder el cero inicial, y el resumen con los niveles en cero.
- **Largo del nombre.** Corrijo mis 60 por campo a 120, que es el largo estándar de `../CLAUDE.md`.

## 5. Desacuerdos que mantengo

- **Pasos separados en vez de un solo envío.** Si la señal se cae, se repite un paso y no la familia entera. Las fotos van aparte, sin base64.
- **Nombres y apellidos en campos separados en vez de `full_name`.** Es la forma de `users` y permite ordenar por apellido. En el Excel se juntan sin costo.
- **Exportar lo filtrado en vez del padrón completo.** Las autoridades suelen pedirlo por sector. Si se exporta sin filtros, sale todo igual.
- **Teléfono y nota en la fase 1.** Reusan `phoneSchema`, `PhoneInput` y `noteSchema`, y el teléfono es el contacto para la entrega.
