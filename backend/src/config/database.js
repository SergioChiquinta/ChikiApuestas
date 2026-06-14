const { Pool } = require("pg");

if (!process.env.DATABASE_URL) {
  throw new Error("La variable DATABASE_URL no está configurada");
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  keepAlive: true,
});

pool.on("error", (error) => {
  console.error("Error inesperado de PostgreSQL:", error);
});

module.exports = pool;
