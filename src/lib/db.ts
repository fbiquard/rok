import { neon } from "@neondatabase/serverless";

/**
 * Cliente único de Neon Postgres.
 * Uso (tagged template literals, evita SQL injection):
 *
 *   const orders = await sql`SELECT * FROM orders WHERE status = ${status}`;
 */
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL no está seteada. Si estás en local, corré `vercel env pull .env.local --environment=preview`.",
  );
}

export const sql = neon(databaseUrl);
