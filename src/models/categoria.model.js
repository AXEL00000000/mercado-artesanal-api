// Acceso a datos de CATEGORIA. Solo SQL; las reglas van en el servicio.
const { query } = require("../config/db");

// Todas las categorías con cuántos productos activos tiene cada una.
const listar = async () => {
  const { rows } = await query(
    `SELECT c.id, c.nombre, c.slug, c.descripcion,
            COUNT(p.id)::int AS total_productos
       FROM categoria c
       LEFT JOIN producto p ON p.categoria_id = c.id AND p.activo
      GROUP BY c.id
      ORDER BY c.nombre`
  );
  return rows;
};

const buscarPorSlug = async (slug) => {
  const { rows } = await query(
    `SELECT c.id, c.nombre, c.slug, c.descripcion,
            COUNT(p.id)::int AS total_productos
       FROM categoria c
       LEFT JOIN producto p ON p.categoria_id = c.id AND p.activo
      WHERE c.slug = $1
      GROUP BY c.id`,
    [slug]
  );
  return rows[0] || null;
};

module.exports = { listar, buscarPorSlug };
