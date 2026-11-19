# DESIGN.md: Juveco Samán, administración de campeonatos

Este documento describe el sistema de diseño de **Juveco Samán** y las pantallas que usa un administrador para manejar un campeonato. Sirve para generar una vista previa.

Juveco es una organización juvenil de barrio que junta fondos para sus eventos, como la Chocolatada 2026. La app la usan pocos administradores, casi siempre desde el celular y en la cancha. Por eso lo que se hace seguido tiene que quedar a uno o dos toques.

Todo el texto de la interfaz va en **español de Perú**. Los montos van en soles: `S/ 200.00`.

---

## 1. Identidad

Los colores salen del logo: un medallón de manos de colores que forman una estrella, un aro dorado y una cinta azul rey con el nombre.

- **Azul rey (cinta):** acciones y marca.
- **Oro (aro):** lo que se celebra, como premios, campeón y lo recaudado.
- **Seis colores de las manos:** solo como dato (estados, métodos de pago, gráficos) y en una franja arcoíris fina arriba de la cabecera. Nunca como fondo de una pantalla entera.
- **Texto:** azul noche, nunca negro puro.

Tono: cercano y claro, sin tecnicismos. Ejemplos: «Registrar resultado», «Por cobrar», «Clasificado como mejor perdedor».

---

## 2. Color

Hay modo claro y modo oscuro. La vista previa se pide en **oscuro**, que es el que más se usa; el claro va en la tabla como referencia.

### Modo oscuro (por capas: el fondo es lo más oscuro y cada superficie encima es un poco más clara)

| Rol | Valor | Uso |
|---|---|---|
| Fondo de página | `#0A0E17` | Detrás de todo, también la barra lateral |
| Caja / card / modal | `#131A29` | Cajas de página, cards, modales, paneles |
| Encabezado de card / muted | `#1A2335` | Franja gris del encabezado de una card y de la cabecera de tablas |
| Hover / accent | `#1E2840` | Fila o ítem con el mouse encima |
| Botón de ícono con borde | `#232E44`, borde `#34425C` | Más claro que donde va |
| Borde general | `#222C3F` | Cards, tablas, separadores |
| Campo de texto | fondo `#131A29`, borde `#34425C` | Mismo fondo que la modal; lo marca el borde |
| Texto | `#F1F5F9` | |
| Texto secundario | `#94A3B8` | |
| Label de campo | `#CBD5E1` | |
| Placeholder | `#7C8799` | |
| Primario | `#1D4ED8`, texto blanco | Botón principal |
| Foco | `#3B82F6` | Anillo de foco |
| Oro | ≈ `#E7C25A` | Campeón, premios |
| Éxito | ≈ `#6EDB8A` | Pagado, ganó |
| Advertencia | ≈ `#F0D35A` | Pagó una parte |
| Error / peligro | ≈ `#F28B8B` | Por cobrar sin pagar, eliminar, eliminado |

### Modo claro

| Rol | Valor |
|---|---|
| Fondo de página (escritorio, detrás de las cajas) | ≈ `#F3F5F9` |
| Caja / card / campo | `#FFFFFF` |
| Encabezado de card / muted | ≈ `#F3F5F9` |
| Borde | ≈ `#E1E5EE` |
| Texto | `#14214A` |
| Texto secundario | ≈ `#5E6782` |
| Label / placeholder | `#495057` / `#9AA1AB` |
| Primario | `#1C3D96`, texto blanco |
| Oro (fondo / texto) | `#C99A2E` / ≈ `#8C6A1C` |
| Éxito / advertencia / error | ≈ `#2E8540` / `#8A6D10` / `#CC2B2B` |

Los valores con ≈ vienen de `oklch` y están convertidos de forma aproximada.

### Badges de estado

Fondo del color al 10–15 % con texto e ícono del color pleno, y radio de 6 px. Llevan siempre un ícono, nunca solo color.

| Badge | Ícono | Color |
|---|---|---|
| Pagado · `S/ 0.00` | check en círculo | éxito |
| Pagó una parte · `S/ 80.00` | reloj | advertencia |
| Sin pagar · `S/ 200.00` | x en círculo | error |
| Ganó | trofeo | éxito |
| Mejor perdedor | estrella | oro |
| Eliminado | x | gris (texto secundario) |
| Campeón | trofeo | oro relleno |
| Por jugar / Jugado | reloj / check | gris / azul |

---

## 3. Tipografía

- **Plus Jakarta Sans** para todo el texto.
- **IBM Plex Mono** para números alineados: montos en tablas, marcadores y minutos. Si no se puede, Plus Jakarta Sans con números tabulares.

| Elemento | Tamaño | Peso |
|---|---|---|
| Título de página | 20 px (máximo) | 600 |
| Título de modal | 20 px | 600 |
| Título de sección | 16–18 px | 600 |
| Nombre principal en una fila o card | 14–16 px | 500 |
| Dato secundario | 14 px | 400 |
| Label de campo | 14 px | 400 |
| Montos KPI, marcador, número de equipo | 18–28 px | 700 (solo aquí va bold) |
| Badge, texto de ayuda | 12 px | 500 |

No va todo en negrita: la jerarquía sale de los pesos.

---

## 4. Forma y medidas

- **Radios:**
  - campos y botones: 8 px;
  - cards: 8 px;
  - cajas de página: 12 px;
  - modales: 24 px arriba en celular (hoja que sube) y 24 px en escritorio;
  - badges: 6 px.
- **Alturas:**
  - campos y botones de formulario: **44 px**;
  - barra de la página (botón principal, buscador, filtros, botón de ícono al lado): **52 px**.
- **Sombras:**
  - las cards no llevan sombra: se separan por borde de 1 px;
  - solo modales y paneles llevan sombra profunda.
- **Espaciado:**
  - 16 px de margen en celular;
  - 20 px dentro de las cajas en escritorio;
  - 12–16 px entre cards.

---

## 5. Estructura de la app

**Cabecera:**
- franja arcoíris de 4 px arriba (las seis manos en segmentos);
- logo y nombre a la izquierda;
- a la derecha, cambio de tema y menú del usuario.

**Navegación:**
- escritorio: barra lateral fija de 256 px con Panel, Proyectos, Actividades y Usuarios, con íconos de línea (estilo lucide);
- celular: barra inferior con los mismos destinos.

**Página en escritorio:**
- fondo de página y, encima, **dos cajas** con borde fino;
- la **caja del encabezado** lleva título, subtítulo y acciones;
- la **caja del cuerpo** llega siempre hasta el final de la pantalla, aunque esté cargando o vacía.

**Página en celular:** sin cajas. El contenido va directo sobre el fondo, y la barra de búsqueda y los filtros quedan fijos arriba al hacer scroll.

**Listados:**
- escritorio: **tabla** con la cabecera en franja gris;
- celular: **cards**.

**Card:**
- borde de 1 px y radio de 8 px, sin sombra;
- **encabezado gris** con el dato principal y las acciones;
- **cuerpo** con el detalle.

**Carga:** esqueletos con la misma forma de lo que va a aparecer (filas, cards, KPIs), y el contenido entra con un fundido corto.

---

## 6. Componentes

**Botones:**
- **Solo una acción primaria por encabezado o barra**, en azul relleno.
- Las demás acciones van como **botón de ícono con borde**: cuadrado de 44 o 52 px, fondo un punto más claro que donde va y tooltip. Nunca dos botones grises iguales lado a lado.
- Lo que se usa seguido (cobrar, registrar resultado, editar) va **directo** como ícono en cada fila o card.
- Lo poco usado va en el menú `⋯`.
- En celular, las acciones del encabezado van como íconos para no aplastar el título. La acción de agregar va en un **botón flotante «+»** abajo a la derecha.

**Campos:**
- Label arriba.
- Placeholder del tipo «Ingresa el nombre del equipo» o «Elige al delegado», nunca ejemplos.
- El error va abajo, en rojo.

**Grupo de botones:**
- Botones pegados, cada uno con borde.
- El elegido va en **primario suave**: fondo azul al 10 %, borde y texto azules.
- Ejemplo: Yape | Efectivo, al lado del monto.

**Selector con búsqueda:** para elegir personas. Permite **crear una persona nueva** ahí mismo («Crear "Juan Pérez"»).

**Modal de formulario:**
- título y subtítulo (por ejemplo, el equipo);
- ✕ para cerrar, sin botón «Cancelar»;
- el pie tiene el botón principal a la derecha y, al crear, «Crear y seguir creando» en borde;
- en escritorio va ancho, con los campos en **dos columnas**;
- la «Nota» va siempre al final;
- si se cierra con cambios, pide confirmar.

**Panel lateral:** el detalle de un registro, que entra desde la derecha. En celular ocupa la pantalla.

**Tabs con contador:** por ejemplo «Por pagar 2 · Pagados 4».

**Estado vacío:** ícono de línea grande en gris, un título corto y, si aplica, un enlace a la acción («Agregar el primer equipo»).

---

## 7. El campeonato: reglas que la interfaz tiene que reflejar

- **Campeonato Relámpago 2026.** Es una actividad dentro del evento **Chocolatada 2026**.
- **6 equipos.** Cada uno se inscribe con **S/ 200**, que se puede pagar en partes. Lleva:
  - nombre;
  - número (del 1 al 6);
  - **delegado** (una persona con WhatsApp);
  - lista de **jugadores** (personas).
- **Fecha 1, domingo 22 nov:**
  - los cruces se **sortean**: 3 partidos;
  - pasan los 3 ganadores y **el mejor perdedor**.
- **Fecha 2, domingo 29 nov:**
  - 2 semifinales con los 4 clasificados;
  - **la final**, entre los ganadores de las semifinales;
  - no hay partido por el tercer puesto: se premian solo el 1.º y el 2.º.
- **Partidos:**
  - siempre hay un ganador; si empatan, se define por **penales**;
  - el admin registra cada gol: **qué jugador** lo anotó y el **minuto**, que es opcional;
  - el marcador sale de los goles.
- **Mejor perdedor:**
  1. perdió por penales (va antes que haber perdido en el tiempo reglamentario);
  2. perdió por menos diferencia de goles;
  3. hizo más goles.

  Si aun así empatan, el admin lo elige.
- **Plata de la actividad:**
  - **inscripciones** (cobros por equipo, con quién cobró);
  - **ingresos** (ventas del día y otros);
  - **gastos** (árbitros y otros).
  - Todo se ve junto en **Movimientos**.
- **Público:** hay un link público, `/campeonatos/relampago-2026`. Solo muestra equipos, partidos, goleadores y posiciones, sin plata ni teléfonos.

Nombres de ejemplo para la vista previa:
- **Equipos:**
  1. Los Halcones
  2. Real Samán
  3. Deportivo Nueva Esperanza
  4. Atlético El Patio
  5. Juventud Santa Rosa
  6. Unión Ramón Castilla
- **Barrios** (badge de color al lado del delegado): Nueva Esperanza (verde), El Patio (ladrillo), Ramón Castilla (dorado), María Auxiliadora (celeste) y Santa Rosa (rosado).

---

## 8. Pantallas a generar (vista del administrador)

Genera cada pantalla en **celular (390 px)** y en **escritorio (1440 px)**.

### 8.1 Detalle del campeonato

**Caja del encabezado:**
- volver («← Chocolatada 2026»);
- título «Campeonato Relámpago 2026» con el badge «Abierto»;
- subtítulo «Campeonato · 22 nov 2026 – 29 nov 2026 · Inscripción S/ 200.00»;
- acción primaria según el momento: «Agregar equipo» mientras faltan equipos, «Sortear fecha 1» con 6 equipos, y luego «Registrar resultado»;
- botón de ícono con borde para editar.

**Fila de KPIs**, cuatro tarjetas pequeñas:
- Inscripciones cobradas: `S/ 920.00 de S/ 1,200.00`, con barra de avance;
- Ingresos: `S/ 350.00`;
- Gastos: `S/ 180.00`;
- **Saldo** en primario relleno: `S/ 1,090.00`.

**Tabs:** Equipos · Partidos · Posiciones · Movimientos.

### 8.2 Tab Equipos

**Escritorio:** tabla con estas columnas:
- N.º;
- Equipo;
- Delegado, con el badge de barrio;
- Jugadores (cantidad);
- Inscripción, con el badge de por cobrar;
- Acciones:
  - cobrar, ícono directo mientras falte cobrar;
  - editar, ícono directo;
  - `⋯` con «Eliminar».

**Celular:**
- card con el encabezado gris: `#3 Deportivo Nueva Esperanza` y el ícono de cobrar;
- en el cuerpo, el delegado con su barrio, «12 jugadores» y el badge «Por cobrar: S/ 80.00»;
- el «+» flotante agrega un equipo.

Arriba van los tabs «Por pagar 2 · Pagados 4» y un buscador.

Al tocar un equipo se abre el **panel lateral** con:
- nombre y número;
- delegado con un botón de WhatsApp;
- la inscripción, con la lista de pagos (monto, método, fecha, «cobró X» y un ícono para eliminar);
- los jugadores, cada uno con sus goles en el campeonato.

### 8.3 Modal «Agregar equipo»

**Campos:**
- Nombre del equipo.
- Número, que viene sugerido.
- Delegado: selector de personas que permite crear una nueva.
- Inscripción: monto en soles, que viene en `200.00`.

**Sección «Jugadores»**, separada con una línea fina:
- un buscador de personas que agrega cada jugador a una lista debajo;
- la lista muestra un avatar con iniciales, el nombre y una ✕ para quitarlo;
- se puede crear una persona nueva con solo nombres y apellidos;
- aviso si el jugador ya está en otro equipo del campeonato.

Nota al final.

**Pie:** «Crear y seguir creando» (borde) y «Crear» (primario).

### 8.4 Modal «Registrar pago»

- Por cobrar: `S/ 120.00`.
- En una fila: Monto y Cómo pagó (grupo Yape | Efectivo).
- Debajo, «Cobrado por» (selector de admins), con el admin de la sesión puesto.

### 8.5 Tab Partidos

Dos secciones, **Fecha 1 · dom 22 nov** y **Fecha 2 · dom 29 nov**.

**Card de partido:**
- encabezado gris con «Partido 2» y el badge del estado;
- cuerpo con los dos equipos uno sobre otro, cada uno con su número y su marcador grande a la derecha;
- el ganador va en peso 600 con el ícono de trofeo verde;
- si hubo penales, debajo va «Penales 4 – 3»;
- acción directa: «Registrar resultado» si falta jugarse, o el ícono de editar si ya se jugó.

**Fecha 2:**
- **llave** de dos semifinales que llevan a la final;
- en escritorio va horizontal; en celular, en columna;
- los cruces que todavía no se conocen muestran «Ganador semifinal 1»;
- la final lleva un borde y un trofeo dorados.

**Estado antes del sorteo:** vacío, con «Sortea los cruces de la fecha 1 cuando estén los 6 equipos».

### 8.6 Modal «Registrar resultado»

- **Título:** «Partido 2 · Fecha 1». **Subtítulo:** «Real Samán vs Juventud Santa Rosa».
- **Marcador grande arriba**, calculado de los goles: `2 – 2`.
- **Goles:**
  - dos columnas, una por equipo, cada una con «Agregar gol»;
  - agregar un gol pide el jugador (solo los de ese equipo) y el minuto (opcional);
  - cada gol se ve como «⚽︎ 34' Luis Chunga» con una ✕ para quitarlo. El balón va como ícono de línea, no como emoji.
- **Penales:** si el marcador queda empatado, aparece la sección con un número de penales por equipo. No se puede guardar empatado.
- **Ganador:** se muestra calculado: «Gana Real Samán por penales».
- **Pie:** «Guardar resultado».

### 8.7 Tab Posiciones

Muestra la clasificación de la fecha 1. La tabla tiene estas columnas:
- puesto;
- equipo;
- resultado («Ganó 3–1», «Perdió por penales 2–2 (3–4)», «Perdió 0–2»);
- diferencia de goles;
- goles a favor;
- estado.

**Estado de cada fila:**
- Los 3 ganadores llevan el badge «Clasificado».
- El **mejor perdedor** va resaltado con fondo oro suave y el badge «Mejor perdedor».
- Los otros dos perdedores, en gris, llevan el badge «Eliminado».

Debajo, una nota pequeña con el orden de desempate. Si hay empate entre perdedores, aparece el aviso «Elige al mejor perdedor» con un botón.

**Goleadores:** una tabla corta debajo con jugador, equipo y goles.

En celular, cada fila es una card compacta.

### 8.8 Tab Movimientos

Lista junta, de la más reciente a la más antigua.

**Escritorio:** tabla con fecha, concepto, origen, método, quién, entrada y salida.
- Origen: Inscripción · Los Halcones / Venta / Gasto.
- Las entradas van en verde y las salidas en rojo, con signo.

**Celular:** cards con el concepto, el origen como badge, el monto con signo y la fecha.

**Arriba:**
- filtros: Todo · Entradas · Salidas;
- totales: Entradas `S/ 1,270.00`, Salidas `S/ 180.00` y Saldo `S/ 1,090.00` en primario relleno.

**Acciones:**
- primaria: «Registrar ingreso»;
- botón de ícono con borde: «Registrar gasto»;
- en celular, el «+» flotante abre un menú con Ingreso o Gasto.

**Modales:**
- **Registrar ingreso:** concepto («Venta de gaseosas»), y en una fila Monto y Cómo pagó (Yape | Efectivo); debajo, Cobrado por, Fecha y Nota.
- **Registrar gasto:** concepto («Pago de árbitros»), Monto, Pagado por, Fecha y Nota.

### 8.9 (Opcional) Vista pública `/campeonatos/relampago-2026`

- Sin barra lateral y sin login, pensada para el celular, para compartir por WhatsApp.
- **Encabezado:** logo, «Campeonato Relámpago 2026 · Chocolatada 2026» y la franja arcoíris.
- **Secciones:** Próximos partidos, Resultados, Posiciones (con el mejor perdedor resaltado), Llave de la fecha 2 y Goleadores.
- Con un campeón, arriba va una tarjeta dorada «Campeón: Real Samán».
- No muestra montos, pagos ni teléfonos.

---

## 9. Qué no hacer

- Más de un botón primario en la misma barra.
- Cards con sombra o con radio grande (16 px o más).
- Todo en negrita, o títulos de página de más de 20 px.
- Colores de las manos como fondo de una sección entera.
- Emojis como íconos: van íconos de línea.
- Botones de solo ícono sin tooltip.
- Placeholders con ejemplos («Ej. Juan»).
- Cajas recortadas a la altura de su contenido en escritorio.
