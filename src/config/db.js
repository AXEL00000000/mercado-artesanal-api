// Conexión a PostgreSQL (Supabase) con un pool de conexiones.
const { Pool, types } = require("pg");

// pg devuelve BIGINT (ids) y NUMERIC (precios) como texto para no perder precisión.
// Nuestros ids y precios caben de sobra en un número de JavaScript, así que se convierten.
types.setTypeParser(20, (valor) => parseInt(valor, 10));  // BIGINT
types.setTypeParser(1700, (valor) => parseFloat(valor));  // NUMERIC

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
