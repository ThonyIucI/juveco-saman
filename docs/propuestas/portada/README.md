# Portada pública de Juveco Samán (propuesta, 2026-11-25)

La primera versión se armó como una pantalla del panel y no como una página web. Tenía estos problemas:

- cards en una columna angosta sobre fondo gris, con espacio vacío a los costados;
- un navbar que partía el nombre en dos líneas;
- «Ingresar» como si fuera la acción principal;
- las redes arriba y otra vez abajo;
- la Chocolatada por un lado y su balance por otro, sin relación entre los dos.

Esta propuesta parte de cero. Primero va la estructura; se codea cuando Thony la apruebe.

## Para quién es y qué tiene que lograr

- **Quién entra:** vecinos de Samán, casi siempre desde el celular, que llegan por un enlace de Facebook, TikTok o WhatsApp.
- **Qué tienen que sacar en 10 segundos:**
  1. qué es la Juveco y qué hace;
  2. qué está pasando ahora (la Chocolatada y sus actividades);
  3. que las cuentas son claras;
  4. dónde seguirla.
- **No es un panel.** Lleva secciones a todo el ancho con fondos que se alternan, fotos, un navbar y un footer de verdad. Las cards se usan solo para elementos que se repiten: proyectos, partidos y premios.

## Reglas de diseño

- **Ancho:** cada sección ocupa toda la pantalla. El contenido va en un contenedor de `max-w-6xl` (1152 px), con 16 px de margen en celular y 24 px desde tablet. Así el escritorio aprovecha el ancho con grillas de 2 a 4 columnas.
- **Fondos alternados:**
  - el carrusel lleva fotos;
  - la franja «Ahora» va en azul rey;
  - el resto de las secciones alterna blanco y gris claro;
  - el footer va en azul marino.
- **Colores:** los del logo. El azul rey es el principal, el dorado acompaña los botones del carrusel y los ganadores, y la franja de las seis manos es la firma, una sola vez bajo el navbar.
- **Tipografía:**
  - Plus Jakarta Sans, la misma de la app;
  - títulos de sección de 28 a 32 px (es una web, no el panel);
  - texto de 16 px como mínimo;
  - líneas de 65 a 75 caracteres como máximo.
- **Accesible para todos los vecinos:**
  - buen contraste;
  - botones de al menos 44 px;
  - el carrusel se detiene si el sistema pide menos movimiento;
  - cada foto con su texto alternativo.
- **Tema:** sigue al del sistema. El navbar no lleva el botón de tema, que es cosa del panel.
- **Nada se repite:**
  - las redes van en su sección y como íconos en el footer, como en cualquier web;
  - la entrada de la directiva va solo en el footer.

## Estructura (de arriba hacia abajo)

| # | Sección | Fondo | Qué lleva | De dónde salen los datos |
|---|---|---|---|---|
| — | **Navbar** | blanco, fijo arriba | Logo y «Juveco Samán» en una línea, con enlaces a las secciones. En celular, menú ☰. | — |
| 1 | **Carrusel** | fotos | Fotos que pasan con fundido. Encima: «Junta Vecinal Comunal Samán», el lema y dos botones. | fotos de Thony |
| 2 | **Ahora** | azul rey, franja baja | «Chocolatada 2026 · 23 de diciembre · 400 niños · faltan N días» y el enlace a la sección. | API |
| 3 | **Nosotros** | blanco | Qué es una Juveco y qué hace (4 funciones con íconos). Si se acuerda, la directiva 2026–2028. | código |
| 4 | **Proyectos** | gris | Cards con foto, nombre, estado (en curso, cumplido o próximo) y una línea. | código |
| 5 | **Chocolatada 2026** | blanco | Lo que está en curso contado como una sola historia (ver abajo). | API y código |
| 6 | **Síguenos** | gris | Lo último de TikTok y Facebook. En celular, un selector TikTok / Facebook para no hacer dos scrolls largos. | embeds |
| — | **Footer** | azul marino | Logo, nombre, gestión, enlaces a secciones, íconos de redes, contacto y «Acceso directiva». | código |

### La sección 5 cuenta una sola historia

La Chocolatada es la meta, las actividades juntan los fondos y las cuentas muestran de dónde vino y en qué se usó. Todo va dentro de la misma sección, con subtítulos:

1. **Línea de tiempo** en una fila: ① Campeonato Relámpago (22 y 29 nov) → ② Bingo II (28 nov) → ③ Chocolatada (23 dic). Cada paso lleva a su parte.
2. **Campeonato Relámpago:**
   - a la izquierda, los resultados en filas tipo marcador («Atlético Grau 3 – 3 Samán Chico · pen. 0–1») con los goleadores y las rojas en letra chica;
   - debajo de eso, la fecha 2 (semifinales y final);
   - a la derecha, el top de goleadores.
3. **Bingo II:**
   - la fecha y una grilla de premios (4 columnas en escritorio, 2 en celular), cada uno con quién lo donó;
   - después del sorteo, una línea dorada con el ganador.
4. **Cuentas claras:**
   - dos columnas, «Lo que entró» y «En qué se usó», con los conceptos por actividad y sin montos;
   - debajo, «Gracias a quienes apoyaron», con los nombres.

## Boceto de escritorio (1440 px)

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│ (logo) Juveco Samán        Inicio  Nosotros  Proyectos  Chocolatada  Síguenos     │ navbar 64px, 1 línea
├══════════════════════════ franja de las seis manos ═══════════════════════════════┤
│                                                                                  │
│  [ FOTO A TODO EL ANCHO, pasa con fundido cada 6 s ]                             │
│                                                                                  │
│   JUNTA VECINAL COMUNAL SAMÁN                                                    │ carrusel
│   Trabajamos juntos por nuestro barrio                          (H1, 48px)       │ ~70% del alto
│   Vecinos que se organizan para sacar adelante obras,                            │
│   actividades y proyectos.                                                       │
│   [ Ver la Chocolatada 2026 ]  [ Conócenos ]                     ● ○ ○ ○         │
├──────────────────────────────────────────────────────────────────────────────────┤
│ AHORA  Chocolatada 2026 · 23 de diciembre · 400 niños · faltan 28 días    Ver →  │ azul rey, 56px
├──────────────────────────────────────────────────────────────────────────────────┤
│        ┌─────────────────────────────┐   ┌────────────┐ ┌────────────┐            │
│        │ Nosotros                    │   │ (ícono)    │ │ (ícono)    │            │
│        │ Qué es una Juveco: 2 o 3    │   │ Obras y    │ │ Seguridad  │            │ blanco
│        │ líneas.                     │   │ servicios  │ │ ciudadana  │            │
│        │                             │   ├────────────┤ ├────────────┤            │
│        │ Directiva 2026–2028 (opc.)  │   │ Actividades│ │ Apoyo      │            │
│        └─────────────────────────────┘   │ y eventos  │ │ social     │            │
│                                          └────────────┘ └────────────┘            │
├──────────────────────────────────────────────────────────────────────────────────┤
│  Nuestros proyectos                                                              │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐                              │ gris
│  │   (foto)     │ │   (foto)     │ │   (foto)     │                              │
│  │ Chocolatada  │ │ Mural        │ │ Cámaras      │                              │
│  │ En curso     │ │ Próximo      │ │ Próximo      │                              │
│  └──────────────┘ └──────────────┘ └──────────────┘                              │
├──────────────────────────────────────────────────────────────────────────────────┤
│  Chocolatada 2026 · 23 de diciembre · 400 niños                                  │
│  ① Campeonato 22 y 29 nov ───── ② Bingo 28 nov ───── ③ Chocolatada 23 dic        │
│                                                                                  │
│  Campeonato Relámpago                                                            │
│  Fecha 1 · 22 nov                                   │ Goleadores                 │
│  Atlético Grau    3 – 3  Samán Chico  🏆 pen. 0–1   │ 1 Rudy Farías       3      │ blanco
│  La Palma         2 – 3  Calixto Romero 🏆          │ 2 Freddy Castro     3      │
│  La Noria 🏆      2 – 1  El Cane                    │ 3 ...               1      │
│  Fecha 2 · 29 nov:  La Noria vs Samán Chico ·       │                            │
│  Atlético Grau vs Calixto Romero · Final            │                            │
│                                                                                  │
│  Bingo II · 28 nov                                                               │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐                                     │
│  │Televisor│ │Licuadora│ │Bicicleta│ │ ...   │   cada uno: «Donó: X»              │
│  └────────┘ └────────┘ └────────┘ └────────┘   sorteado: «Ganó: Y · 0777»         │
│                                                                                  │
│  Cuentas claras                                                                  │
│  Lo que entró                     │ En qué se usó                                │
│  · Venta de cartillas (Bingo)     │ · Compra de premios                          │
│  · Inscripciones (Campeonato)     │ · Arbitrajes                                 │
│  Gracias a: (nombre) (nombre) (nombre) …                                         │
├──────────────────────────────────────────────────────────────────────────────────┤
│  Síguenos                                                                        │ gris
│  ┌──── TikTok (últimos videos) ────┐   ┌──── Facebook (publicaciones) ────┐      │
│  └─────────────────────────────────┘   └──────────────────────────────────┘      │
├──────────────────────────────────────────────────────────────────────────────────┤
│ (logo) Juveco Samán          Secciones        Síguenos       Contacto            │ azul marino
│ Junta Vecinal Comunal        Inicio …         (f) (tiktok)   WhatsApp …          │
│ Gestión 2026–2028                                                                │
│ © 2026 Junta Vecinal Comunal Samán                          Acceso directiva     │
└──────────────────────────────────────────────────────────────────────────────────┘
```

## Boceto de celular (375 px)

```
┌───────────────────────────┐
│ (logo) Juveco Samán    ☰  │  1 línea; ☰ abre el menú
├═══ franja de las manos ═══┤
│ [ FOTO ]                  │
│ JUNTA VECINAL COMUNAL     │
│ Trabajamos juntos por     │
│ nuestro barrio            │  carrusel, ~60% del alto
│ [Ver la Chocolatada]      │
│ [Conócenos]       ● ○ ○   │
├───────────────────────────┤
│ AHORA · Chocolatada 2026  │
│ 23 dic · faltan 28 días → │
├───────────────────────────┤
│ Nosotros                  │
│ texto                     │
│ [Obras ] [Seguridad]      │  2 columnas
│ [Activ.] [Apoyo    ]      │
├───────────────────────────┤
│ Proyectos  ← desliza →    │  carrusel horizontal
├───────────────────────────┤
│ Chocolatada 2026          │
│ ①─②─③ (vertical)          │
│ Campeonato: filas         │
│ Grau 3–3 Samán Ch. 🏆     │
│ pen. 0–1                  │
│ Goleadores (top 5)        │
│ Bingo: premios 2 col.     │
│ Cuentas claras (apilado)  │
├───────────────────────────┤
│ Síguenos [TikTok|Facebook]│  uno a la vez
├───────────────────────────┤
│ footer apilado            │
└───────────────────────────┘
```

## Cómo se construye

- **Sin librerías nuevas.** El carrusel se arma con `motion`, que ya está en la app:
  - fundido cada 6 s, con un zoom muy suave sobre la foto;
  - se pausa al pasar el mouse y cuando la pestaña no está a la vista;
  - si el sistema pide menos movimiento, queda fijo.
- **Fotos** en `apps/web/public/portada/` como `.webp` de unos 1600 px de ancho, cargadas solo cuando se necesitan, salvo la primera.
- **Textos institucionales** (nosotros, funciones, proyectos, directiva) en un archivo de contenido en código, igual que los resultados del campeonato. La Chocolatada, los premios, las cuentas y los que apoyaron siguen saliendo de `GET /public/home`.
- **Componentes:** un componente por sección, dentro de `modules/public/components/`. Se borran los de la primera versión que no sirvan.

## Decisiones de Thony (2026-11-25)

- **Aprobado el boceto.** Además pidió «efectos pro», con zonas que aparecen al deslizar:
  - cada sección y cada card aparece al llegar con el scroll, una tras otra;
  - la foto del carrusel se queda atrás al bajar (parallax) y tiene un zoom lento;
  - las cifras del evento cuentan desde cero;
  - la línea de tiempo se dibuja;
  - el navbar marca la sección que se está leyendo.

  Con «menos movimiento» en el sistema, todo queda quieto.
- **La chocolatada es un evento, no un proyecto.**
  - Los proyectos son obras como el mural, las cámaras y el pozo de agua, y de esos hay fotos.
  - El carrusel usa esas fotos.
- **La directiva va con cargos y nombres.**
- **Contacto:** WhatsApp con usuario, no con número.
- **Funciones:** quedan las 4 propuestas.

## Segunda vuelta (Thony, 2026-11-25): tres páginas

La versión de una sola página juntaba demasiado. Queda así:

- **Inicio (`/`):** solo presenta y menciona. Carrusel, franja «Ahora», Nosotros, Proyectos, el evento en curso y Síguenos.
  - El evento es una sola sección: a la izquierda, las actividades como filas con enlace; a la derecha, Cuentas claras (conceptos sin montos).
- **Campeonato (`/campeonatos/relampago-2026`):** resultados, fecha 2 y goleadores.
- **Bingo (`/bingos/ii-2026`):** premios en filas compactas (Premio, Donó, Ganó). Los donantes van aquí.
- La dirección sale del nombre de la actividad, sin migración.

Reglas que cambiaron respecto de lo de arriba:

- **Letra:** solo 12, 14, 16, 20 y 24 px. Títulos a 24 (también el del carrusel), subtítulos a 20, texto a 16.
- **Sin franja arcoíris** en el navbar y el footer públicos.
- **Una línea entre secciones**, además del fondo alternado.
- **Listas compactas:** sin cards de cifras, sin línea de tiempo y sin cards de premios con ícono.
- **Facebook:** solo el botón; el plugin se corta en celular.
- **Fotos que faltan:** el carrusel queda en azul liso y la card del proyecto va sin imagen.

## Tercera vuelta (Thony, 2026-11-25): que se vea diseñada — PROPUESTA, sin aprobar

Lo que Thony marcó: el cuadro de la fecha 2 decía «Ganador 1 vs Ganador 2», los nombres de equipo iban a 16 px, «Evento en curso» era una franja de texto separado por puntos, Facebook se quitó cuando solo había que arreglar su forma, y «Cuentas claras» era texto sin color ni cifras.

Regla nueva para todo lo público: **ningún dato separado por « · »**. Cada dato va con su ícono o en su propio bloque.

### 1. Campeonato: llave del torneo

La página del campeonato abre con la llave, no con una lista. Cada partido es una caja de dos filas (equipo y goles); el ganador va en negrita con su fila resaltada. Las casillas que aún no tienen equipo van punteadas y vacías, unidas por líneas al partido del que salen.

Escritorio:

```
 FECHA 1 · dom 22 nov            SEMIFINALES · dom 29 nov          FINAL

 ┌────────────────────┐
 │ Grau             3 │ ─ mejor perdedor ─┐
 │ Samán Chico  3 (p) │ ─────────┐        │   ┌────────────────────┐
 └────────────────────┘          └────────┼──▶│ La Noria           │
 ┌────────────────────┐          ┌────────┼──▶│ Samán Chico        │──┐
 │ La Noria         2 │ ─────────┘        │   └────────────────────┘  │   ┌──────────────────┐
 │ El Cane          1 │                   │                           ├──▶│ ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄ │
 └────────────────────┘                   │   ┌────────────────────┐  │   │ ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄ │──▶ CAMPEÓN
 ┌────────────────────┐                   └──▶│ Grau               │──┘   └──────────────────┘     (copa, vacío)
 │ La Palma         2 │ ─────────────────────▶│ Calixto Romero     │
 │ Calixto Romero   3 │                       └────────────────────┘
 └────────────────────┘
```

Celular: las tres rondas apiladas (Fecha 1, Semifinales, Final), con la línea que baja de una ronda a la siguiente y la final al pie con sus dos casillas punteadas.

- Nombres de equipo a **14 px**; el marcador a 16 en negrita. Nada a 20 dentro de la llave.
- Debajo de la llave: detalle por partido (goleadores, penales, rojas) con ícono de balón, de tarjeta roja y de penal, sin puntos. Al costado, goleadores del torneo.
- Cuando se carguen los resultados del 29, las casillas se llenan solas desde `relampago-2026.ts`.

### 2. Evento en curso: cartel que monta sobre el carrusel

La franja azul de una línea se va. En su lugar, un cartel blanco que se monta sobre el borde inferior del carrusel:

```
        ┌───────────────────────────────────────────────────────────────────────┐
        │ ┌─────┐  EVENTO EN CURSO                              ┌────┐          │
        │ │ DIC │  Chocolatada 2026                             │ 28 │ días     │
        │ │ 23  │  [regalo] 300 niños y niñas                   └────┘          │
        │ └─────┘  [ticket] Bingo sáb 28 nov   [balón] Final dom 29 nov  [Ver] │
        └───────────────────────────────────────────────────────────────────────┘
```

- Bloque de fecha tipo calendario (mes arriba en azul, día grande).
- Cada dato con su ícono; las actividades son pastillas que llevan a su página.
- Cuenta regresiva en su propio bloque dorado.
- En celular: lo mismo en dos filas, el bloque de fecha a la izquierda.

**Aviso flotante (opcional):** al pasar el carrusel, una pastilla abajo a la derecha con lo próximo («Bingo, sábado 28») que se puede cerrar y lleva a su página. Recomendación: sí, pero solo para la actividad más cercana y solo hasta su fecha.

### 3. Sección de la Chocolatada

Fondo azul marino a todo el ancho (rompe la secuencia blanco/gris). Las actividades dejan de ser filas de texto: dos piezas grandes lado a lado, cada una con su bloque de fecha, su ícono y su estado («Se juega la final», «Faltan 3 días»).

### 4. Cuentas claras — DEPENDE DE UNA DECISIÓN

El 25 nov Thony pidió «solo el concepto, no deben ir montos». Sin montos no hay gráfico posible: solo quedan palabras. Tres salidas:

- **A. Con montos por concepto (recomendada).** Tres cifras arriba (Entró, Se usó, Queda para la chocolatada), una barra de colores por origen (cartillas, inscripciones, donaciones) y debajo cada concepto con su monto. Nunca cuánto dio cada persona: los que apoyaron van como lista de nombres, sin cifra.
- **B. Solo totales.** Las tres cifras y la barra; los conceptos sin monto.
- **C. Sin montos.** Conceptos como etiquetas de color por origen y la lista de quienes apoyaron. Es lo de hoy con color; seguirá viéndose pobre.

A y B cambian la API pública (hoy no envía montos) y su test.

```
 Cuentas claras
 ┌──────────────┐ ┌──────────────┐ ┌──────────────────────┐
 │ Entró        │ │ Se usó       │ │ Para la chocolatada  │
 │ S/ 0.000     │ │ S/ 000       │ │ S/ 0.000             │
 └──────────────┘ └──────────────┘ └──────────────────────┘
 ████████████████████▓▓▓▓▓▓▓▓░░░░   cartillas · inscripciones · donaciones (leyenda con color)
 Lo que entró                  En qué se usó
 [■] Venta de cartillas  S/…   [■] Premios        S/…
 [■] Inscripciones       S/…   [■] Arbitraje      S/…
 Gracias a: Fulano, Mengano, Zutano (sin montos)
```

### 5. Facebook vuelve, bien encajado

- **Ahora:** el plugin oficial de la página, pero con el ancho calculado desde su contenedor (se cortaba porque el plugin fija su ancho al cargar, máximo 500 px, y no se adapta solo). En celular ocupa el ancho de la pantalla; en escritorio va al lado de TikTok, las dos columnas con la misma altura.
- **Después del bingo:** galería propia con las fotos de las últimas publicaciones. Facebook solo entrega esas fotos por su API con una llave de la página (hay que crear una app en Meta); sin llave no hay forma legítima de sacarlas.

### 6. Fotos

Cinco proyectos (mural, cámaras, pozo, sillas de ruedas, letras céntricas) y carrusel de seis fotos (las cinco más monitoreo de cámaras). Las PNG de `docs/carrusel/` se convierten a webp en `apps/web/public/portada/proyectos/`.

## Dónde se completa el contenido

Todo en `apps/web/src/modules/public/data/site.ts`:

- `BOARD`: los cargos y nombres de la directiva. Mientras esté vacío, no se muestra.
- `PROJECTS`: la descripción y el estado de cada proyecto (`DONE`, `IN_PROGRESS` o `PLANNED`).
- `SITE.whatsappUsername`: el usuario de WhatsApp, sin «@».
- Las fotos van en `apps/web/public/portada/proyectos/` con el nombre de cada proyecto (`mural.webp`, `camaras.webp`, `pozo.webp`). Mientras no estén, se ve el azul de la cinta.

## Lo que faltaba definir (respondido arriba)

1. **Fotos del carrusel y de los proyectos:** cuántas hay y de qué. Sin fotos, el carrusel muestra el azul rey con el logo.
2. **Funciones de la Juveco:** propongo Obras y servicios, Seguridad ciudadana, Actividades y eventos, y Apoyo social. ¿Son esas?
3. **Directiva 2026–2028:** ¿se muestran nombres y cargos?
4. **Proyectos:** además de la Chocolatada, cuáles van (¿mural, cámaras?), con su estado y una línea.
5. **Contacto:** ¿un WhatsApp público y dónde se reúnen? Si no, el footer va sin contacto.
