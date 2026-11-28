// Convierte cada archivo pendiente de src/data-migrations/ en una migración de drizzle.
// Corre después de `drizzle-kit generate`, así los datos van detrás del cambio de esquema.
// Por cada `<nombre>.sql`: crea la migración vacía con `--custom`, le pone el SQL y borra el pendiente.
import { execSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const PENDING_DIR = "src/data-migrations";
const MIGRATIONS_DIR = "src/migrations";
const JOURNAL = join(MIGRATIONS_DIR, "meta/_journal.json");

const pending = existsSync(PENDING_DIR)
  ? readdirSync(PENDING_DIR).filter((f) => f.endsWith(".sql")).sort()
  : [];

for (const file of pending) {
  const name = file.replace(/\.sql$/, "");
  if (!/^[a-z0-9_]+$/.test(name)) {
    console.error(`✗ ${file}: el nombre solo puede tener minúsculas, números y _`);
    process.exit(1);
  }

  execSync(`drizzle-kit generate --custom --name=${name}`, { stdio: "inherit" });

  const { entries } = JSON.parse(readFileSync(JOURNAL, "utf8"));
  const { tag } = entries[entries.length - 1];
  if (!tag.endsWith(`_${name}`)) {
    console.error(`✗ La última migración (${tag}) no es la de ${name}. Revisa a mano.`);
    process.exit(1);
  }

  const sql = readFileSync(join(PENDING_DIR, file), "utf8");
  writeFileSync(join(MIGRATIONS_DIR, `${tag}.sql`), sql.endsWith("\n") ? sql : `${sql}\n`);
  unlinkSync(join(PENDING_DIR, file));
  console.log(`✓ ${tag}.sql (datos)`);
}
