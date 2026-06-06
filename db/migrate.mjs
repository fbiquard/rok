// Aplica el schema.sql a la DB Neon.
// Uso: node --env-file=.env.local db/migrate.mjs
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { neon } from "@neondatabase/serverless";

const __dirname = dirname(fileURLToPath(import.meta.url));

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL no está seteada.");
  process.exit(1);
}

const sql = neon(url);

const schema = readFileSync(join(__dirname, "schema.sql"), "utf-8");

// Neon HTTP driver acepta un solo statement por call.
// Partimos por ";" cuidando funciones plpgsql que tienen ";" internos.
const statements = schema
  .split(/(?=^CREATE|^DROP|^ALTER|^INSERT)/m)
  .map((s) => s.trim())
  .filter((s) => s.length > 0 && !s.startsWith("--"));

console.log(`📦 Aplicando ${statements.length} bloques SQL...`);

for (const [i, stmt] of statements.entries()) {
  const preview = stmt.slice(0, 60).replace(/\s+/g, " ");
  try {
    await sql.query(stmt);
    console.log(`  ✓ [${i + 1}/${statements.length}] ${preview}…`);
  } catch (err) {
    console.error(`  ✗ [${i + 1}/${statements.length}] ${preview}…`);
    console.error("   ", err.message);
    process.exit(1);
  }
}

console.log("✅ Schema aplicado.");
