# Juveco Samán

Página de JUVECO (Junta Vecinal Comunal Samán). Empieza con el registro de personas y sus
barrios; luego suma el bingo (ventas, pagos, premios), proyectos, quiénes somos, etc.

Misma base y flujo de deploy que `yiya-accounts` y `electrolitos`: monorepo pnpm con
`apps/server` (Hono + Drizzle + better-auth en Cloudflare Workers + D1) y `apps/web`
(Vite + React + TanStack Router en Cloudflare Pages).

| Pieza | Local | Producción |
|---|---|---|
| Web | http://localhost:3012 | https://juveco-saman.gaiamundo.com |
| API | http://localhost:3013 | https://juveco-api.gaiamundo.com |
| Base D1 | `apps/server/.wrangler/` | `juveco-db` |

## Probar en local

```bash
pnpm install
cp apps/server/.dev.vars.example apps/server/.dev.vars   # y cambia BETTER_AUTH_SECRET
pnpm db:migrate:local   # crea las tablas y carga los 5 barrios
pnpm dev
# En otra terminal, crear tu superadmin local:
curl -X POST localhost:3013/api/v1/internal/seed-superadmin \
  -H "x-seed-token: seed-local-dev-token" -H "content-type: application/json" \
  -d '{"email":"tu@correo.com","password":"minimo-8-caracteres","name":"Thony"}'
```

## Comandos

| Comando | Qué hace |
|---|---|
| `pnpm check-types` | Revisa tipos de todo el monorepo |
| `pnpm test` | Tests del server (D1 en memoria) |
| `pnpm db:generate` | Genera la migración a partir del esquema (nunca SQL a mano) |
| `pnpm db:migrate:local` / `:remote` | Aplica migraciones |
| `pnpm deploy:server` / `deploy:web` | Publica API / web |

## Modelo

- **`users`**: todas las personas (nombres, apellidos, barrio, WhatsApp, nota) con su rol:
  `USER` (no entra), `ADMIN` (el superadmin le dio acceso) o `SUPERADMIN`.
- **`auth_*`**: tablas de better-auth. `auth_users` es solo el login (correo + contraseña) y
  apunta a su persona con `user_id`. La sesión trae la persona y su rol (`customSession`).
- **`neighborhoods`**: la tabla existe para la llave foránea, pero el código lee los barrios de
  `packages/shared/src/neighborhoods.ts` (IDs UUID v7 fijos), como las monedas de id-backend.
  Un barrio nuevo va en esas constantes **y** en una migración nueva.

## Documentación

- [Estado y pendientes](docs/estado.md): qué está hecho, qué falta y en qué orden.
- [Despliegue a Cloudflare](docs/tecnico/despliegue.md): paso a paso y problemas conocidos.

## Hoja de ruta (por partes, cada una se prueba antes de seguir)

1. ✅ Base, login y usuarios con barrios; dar acceso a administradores
2. 🚧 Despliegue a Cloudflare (falta redesplegar la API con el CORS corregido y crear el superadmin)
3. Bingos (serie, comprador, administrador que vendió, precio por defecto S/ 10) y series repetidas
4. Pagos (Yape / efectivo, parciales) y deuda calculada
5. Premios y panel con KPIs (recaudado, deuda, cobertura de premios, saldo)
6. Secciones de Juveco: proyectos, quiénes somos…
