# Gestión de fondos: proyectos, gastos y donantes

Propuesta del 2026-11-15. Se puede hacer sobre lo que ya existe y no hay que rehacer nada del bingo. Lo que más cambia es la parte de gastos: hoy son solo de una actividad y pasan a ser del proyecto.

## Documentos

| # | Documento | Qué queda funcionando |
|---|---|---|
| 1 | [Proyectos y quién cobró](01-proyectos-y-cobros.md) | Crear eventos y proyectos, ver el bingo dentro de la Chocolatada y corregir quién cobró cada pago |
| 2 | [Artículos y gastos](02-articulos-y-gastos.md) | Registrar compras con artículo, cantidad y monto, y verlas agrupadas por artículo en el balance |
| 3 | [Donantes, oficios y aportes](03-donantes-oficios-aportes.md) | Negocios e instituciones, seguimiento de oficios, aportes de dinero, insumos o apoyo, y la lista de quiénes apoyaron |

El orden sigue a los datos:
- Los gastos y los aportes son de un proyecto, así que primero tienen que existir los proyectos.
- Los aportes de insumos usan el catálogo de artículos, así que primero va el catálogo.

**Paso 3, fuera de esta propuesta:** la caja, con las entregas entre integrantes, el estado de cuenta agrupado y la vista «¿Quién tiene la plata?». Esta propuesta deja guardado lo que ese paso necesita: quién cobró, quién pagó y quién recibió cada aporte en dinero. Así no se pierde nada mientras tanto.

Quedan para después:
- el resumen por barrio;
- la lista para publicar;
- los locales y el mapa de los negocios;
- nuevos tipos de actividad y la pantalla para crearlas.

## Acordado

- **Proyectos:**
  - Una sola tabla `projects` con tipo evento o proyecto.
  - Un proyecto se cierra y la siguiente etapa es otro proyecto, como «Ampliación de cámaras».
  - Llevan fecha de inicio, fecha de fin opcional, meta de recaudación opcional y beneficiarios aproximados opcionales.
- **Quién maneja plata:** quien tiene rol ADMIN o SUPERADMIN, con o sin acceso a la app. Es la misma regla que hoy tienen los vendedores.
- **Cobros:** guardan quién cobró, que no siempre es el vendedor.
- **Negocios e instituciones:** son una ficha propia, sin barrio. El barrio es de la persona. El aporte guarda el negocio y la persona que apoyó ese día; si el negocio cambia de dueño, lo anterior queda con el dueño anterior.
- **Aportes:**
  - Pueden ser de dinero, de insumos (artículo y cantidad, sin valor) o de apoyo (mano de obra, préstamos).
  - Pueden ir al proyecto o a una de sus actividades, como los premios del bingo.
  - El oficio es opcional, porque a muchos se les pide de palabra.
- **Oficios:** son del proyecto, para pedir dinero o insumos para el evento en sí. Llevan estado y el integrante que les hace seguimiento.
- **Compras:** cada compra es su propia línea, con artículo, cantidad y monto total. Si los platos se compran dos veces a distinto precio, se ven las dos líneas y el total.
- **Reconocimiento:** el admin ve el tipo y el monto de cada aporte. Lo que se publique llevará solo nombres.
- **Textos:** el largo máximo se valida en el servidor: nombre 120, concepto 160, nota 500.
- **Toda actividad pertenece a un proyecto.** Una migración crea «Chocolatada 2026» y le asigna el Bingo II.
- **Una sola tabla de gastos** para el proyecto y sus actividades, con la actividad opcional. Los gastos actuales del bingo pasan ahí.
  - Los premios comprados **no** se mueven: cada premio sigue guardando su costo y el balance los resta aparte, como hoy.
  - En la tabla de gastos solo va lo que no es premio: cartones, impresiones, alquileres, compras del evento.
- **Premios donados:** el donante pasa a guardarse como un aporte de insumo del bingo, y el premio apunta a ese aporte.
- **«Cobrado por»:** viene por defecto con el admin que registra el pago y se puede cambiar.
- **Categorías de artículos:** lista fija en el código (Alimentos, Descartables, Juguetes, Materiales, Otros), como los barrios. No se editan desde la app; una nueva se agrega con un cambio chico. Los artículos sí se crean desde la app.
- **Aportes de insumos:** una fila por artículo. El formulario deja agregar varias líneas en un solo guardado.
- **«Pagado por», opcional desde ya**, en los gastos y en los premios comprados, para que la caja del paso 3 sepa quién pagó cada cosa.
- **Cerrar un proyecto** bloquea registrar cosas nuevas en él y en sus actividades. Solo el superadmin lo reabre.
- **Emitir el balance** (2026-11-17, propuesto en el [documento 1](01-proyectos-y-cobros.md), entregable 3): se puede previsualizar y, ya cerrado el proyecto, emitir. Emitido, el proyecto no se reabre. Va después de los documentos 2 y 3, cuando el balance del proyecto esté completo.

## Decisiones pendientes

Ninguna. Todas quedaron acordadas el 2026-11-17.

## Riesgos comunes

- **Mover datos en la base remota.** Hay que asignar el bingo a la Chocolatada, pasar los gastos actuales a la tabla nueva y convertir los premios donados en aportes. Son migraciones de datos, no solo de estructura. Si una falla a la mitad, el balance del bingo puede mostrar cifras incompletas. Conviene probarlas primero en la base local con una copia de los datos reales.
- **El balance y los KPIs del bingo dependen de los gastos.** La ganancia de la lista de cartillas, el resumen y el balance leen la tabla de gastos actual. Si el cambio de tabla no se hace junto con esas pantallas, la ganancia se descuadra.
- **Eliminar personas.** Hoy no se puede eliminar a quien tiene cartillas o donó un premio. Cada tabla nueva que apunta a una persona (contacto de un negocio, oficio, aporte, quién cobró, quién pagó) tiene que sumarse a esa protección. Si falta una, eliminar a esa persona da un error de la base en vez del aviso en español.
