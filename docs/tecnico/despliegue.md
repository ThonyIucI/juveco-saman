# Despliegue a Cloudflare

Misma cuenta que electrolitos y yiya (la de gaiamundo.com). Todos los comandos se corren desde la raíz del repo.

| Pieza | Nombre | URL |
|---|---|---|
| API (Worker) | `juveco-api` | https://juveco-api.gaiamundo.com |
| Web (Pages) | `juveco-saman` | https://juveco-saman.gaiamundo.com |
| Base de datos (D1) | `juveco-db` | — |

## Primera vez

1. **Entrar a Cloudflare**
   ```bash
   pnpm --filter server exec wrangler login
   pnpm --filter server exec wrangler whoami
   ```
2. **Crear la base D1**
   ```bash
   pnpm --filter server exec wrangler d1 create juveco-db
   ```
   Pega el `database_id` en `apps/server/wrangler.jsonc`. Si pregunta si se conecta a un recurso remoto para desarrollo local, responde **no** y no dejes `"remote": true` en el binding.
3. **Migraciones en remoto** (crea las tablas y carga los barrios)
   ```bash
   pnpm db:migrate:remote
   ```
4. **Secrets del Worker**
   ```bash
   cd apps/server
   pnpm exec wrangler secret put BETTER_AUTH_SECRET   # openssl rand -base64 32
   pnpm exec wrangler secret put SEED_TOKEN           # otro valor aleatorio
   cd ../..
   ```
5. **Desplegar la API**
   ```bash
   pnpm deploy:server
   curl https://juveco-api.gaiamundo.com/api/v1/health
   ```
   La ruta es `custom_domain`: wrangler crea el DNS y el certificado.
6. **Desplegar el front**
   ```bash
   pnpm --filter web exec wrangler pages project create juveco-saman --production-branch=main
   pnpm deploy:web
   ```
   El build toma `VITE_SERVER_URL` de `apps/web/.env.production`.
7. **Dominio del front**: en Workers & Pages → `juveco-saman` → Custom domains, agregar `juveco-saman.gaiamundo.com`.
8. **Crear el superadmin**
   ```bash
   curl -X POST https://juveco-api.gaiamundo.com/api/v1/internal/seed-superadmin \
     -H "x-seed-token: EL_SEED_TOKEN" -H "content-type: application/json" \
     -d '{"email":"TU_CORREO","password":"TU_CLAVE_8+","name":"Thony"}'
   ```
9. **Cerrar el seed**: `cd apps/server && pnpm exec wrangler secret delete SEED_TOKEN`.

## Cada vez que cambia el código

- Cambió la API o el esquema: `pnpm db:migrate:remote` (si hay migración nueva) y `pnpm deploy:server`.
- Cambió el front: `pnpm deploy:web`.
- `CORS_ORIGIN` y `BETTER_AUTH_URL` están en `apps/server/wrangler.jsonc`: cualquier cambio de dominio exige redesplegar la API.

## Problemas conocidos

- **`Failed to fetch` en el front, antes del login**: casi siempre CORS. El origen del front tiene que estar en `CORS_ORIGIN` (hoy `https://juveco-saman.gaiamundo.com` y `https://juveco-saman.pages.dev`). Si Pages asigna otro subdominio `*.pages.dev`, agrégalo y redespliega la API.
- **Un barrio nuevo**: va en `packages/shared/src/neighborhoods.ts` **y** en una migración nueva; si no, el test de barrios falla.
- **Respaldo de la base**: `pnpm --filter server db:backup`.
