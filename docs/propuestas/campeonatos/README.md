# Campeonato Relámpago 2026

Parte de la Chocolatada 2026. Seis equipos, dos fechas y premio solo para el primer y el segundo lugar. Acordado con Thony el 2026-11-19.

## Reglas del campeonato

- **Equipos:** 6.
- **Inscripción:** S/ 200 por equipo. Se puede pagar en partes.
- **Fecha 1, domingo 22/11:**
  - Tres partidos sorteados.
  - Pasan los 3 ganadores y el mejor perdedor.
- **Fecha 2, domingo 29/11:** semifinales y final, que define al campeón.
  - No se juega por el tercer lugar.
  - Solo se premia al primero y al segundo, por ser relámpago.
- **Ningún partido termina empatado.** Si hay empate se define por penales, y en la final también.
  - No hay tabla de puntos.
  - Se registra el ganador y quién hizo cada gol. El minuto es opcional.
- **Mejor perdedor:** primero gana quien perdió por penales, luego quien perdió por menos goles de diferencia, y luego quien hizo más goles.
- **Quién lo registra:** un admin anota los resultados y quién marcó cada gol.
- **Link público:** `/campeonatos/relampago-2026`, con resultados y tabla de posiciones, para que la gente y los equipos lo sigan.

## Datos

- **El campeonato es una actividad de tipo `CHAMPIONSHIP`.**
  - El precio por defecto de la actividad es la inscripción.
  - Se crea con una migración de seed dentro de la Chocolatada 2026, porque todavía no hay pantalla para crear actividades.
- **Equipos (`activity_teams`):**
  - nombre (máx. 120, no se repite en el campeonato sin importar mayúsculas);
  - delegado;
  - inscripción, que se copia de la actividad al crear el equipo;
  - nota.
- **El delegado va aparte de los jugadores.** Puede jugar o no. Si juega, se agrega también como jugador.
- **Jugadores (`activity_team_players`):**
  - Máximo 15 por equipo. No hay mínimo.
  - Cada jugador es una persona de la tabla de usuarios, y se puede crear desde el mismo formulario.
- **Un jugador no puede estar en dos equipos del mismo campeonato, por ahora.**
  - Lo controla la API y no la base.
  - Si la mesa decide otra cosa el día del campeonato, se quita sin migrar.
- **Pagos de la inscripción (`activity_team_payments`):** mismas reglas que los pagos de cartillas.
  - Se pueden registrar por Yape o en efectivo, en partes.
  - Nunca pasan de lo que falta cobrar.
  - Se elige quién cobró.
  - Un pago mal registrado se elimina y se registra de nuevo.
  - Un equipo que tiene pagos no se puede eliminar.
- **Gastos:** los arbitrajes van en `activity_expenses`, que ya existe.
- **Balance de la actividad:** suma las inscripciones a lo cobrado y a lo esperado, así que el avance de la Chocolatada las incluye.
- **Ingresos (ventas y otros):** serán genéricos por actividad, no exclusivos del campeonato.
- **Oficios:** no son ingresos. El aporte que sale de un oficio es su propio registro y aparece en Movimientos.

## Pantalla del admin

Toma el diseño de Stitch (exportado el 2026-11-19) como referencia, armado con los componentes de la app.

- **Ruta:** la misma `/actividades/$activityId`. Si la actividad es un campeonato, muestra su propia vista.
- **Encabezado:**
  - Título con el botón de sincronizar.
  - Fecha y precio de la inscripción.
  - «Agregar equipo» como única acción principal. En celular es el «+» flotante.
- **KPIs compactos, solo dos cards** (Thony: «sin mucho floro», sin ocupar espacio de más):
  - una con Ingresos y Egresos lado a lado;
  - otra llena con el Saldo.
  - No llevan barra de avance ni frases. Lo que falta cobrar se ve en la tabla.
- **Sin tabs de Por pagar y Pagados:** son pocos equipos y van todos en una lista, por número de inscripción.
- **Tabla de escritorio:**
  - Columnas: N.º, Equipo (con «N de 15 jugadores» debajo), Delegado (con su barrio debajo), Por cobrar y acciones.
  - Nada se parte en dos líneas.
- **Cards en celular:** el número y el nombre arriba, y debajo el delegado y lo que falta cobrar.
- **Acciones de cada equipo:**
  - «Registrar pago» va directo mientras falte cobrar.
  - Editar y eliminar van en el `⋯`.
- **Detalle lateral del equipo:** los pagos de la inscripción (se pueden eliminar), los jugadores y los datos.
- **Formulario del equipo:**
  - nombre, delegado y jugadores con un contador «N de 15»;
  - en el buscador no aparecen quienes ya juegan en otro equipo;
  - el botón «El delegado también juega» lo agrega a la lista.
- **Formulario de pago:** es el mismo de las cartillas (monto, cómo pagó, cobrado por).
- **Lo que no va del diseño de Stitch:**
  - «Fixture activo»;
  - «Estado operativo»;
  - buscador y filtro por barrio;
  - totales al pie de la tabla;
  - «Balance neto disponible». El saldo no es plata disponible mientras falte cobrar.

## Fases

| # | Qué queda funcionando | Para cuándo | Estado |
|---|---|---|---|
| 1 | Equipos, delegado, jugadores y cobro de la inscripción | Antes del 22/11 | Hecha el 2026-11-19, en prueba |
| 2 | Sorteo, resultados con goles y penales, posiciones y link público | Antes del 22/11 | Pendiente |
| 3 | Fecha 2, ventas y otros ingresos, tab Movimientos con ingresos y gastos | Antes del 29/11 | Pendiente |
