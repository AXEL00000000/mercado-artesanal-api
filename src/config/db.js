// Conexión a PostgreSQL (Supabase) con un pool de conexiones.
const { Pool } = require("pg");

if (!process.env.DATABASE_URL) {
  throw new Error("Falta DATABASE_URL en el archivo .env");
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Supabase exige SSL. En una base local se desactiva con DB_SSL=false.
  ssl: process.env.DB_SSL === "false" ? false : { rejectUnauthorized: false },
  max: 10,
});

pool.on("error", (err) => {
  console.error("Error inesperado en el pool de PostgreSQL:", err.message);
});

// query(texto, valores): siempre con parámetros $1, $2... para evitar inyección SQL.
const query = (texto, valores) => pool.query(texto, valores);

module.exports = { pool, query };
