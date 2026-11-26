// Acceso a datos de CATEGORIA. Solo SQL; las reglas van en el servicio.
const { query } = require("../config/db");

// Todas las categorías con cuántos productos activos tiene cada una.
const listar = async () => {
  const { rows } = await query(
    `SELECT c.id, c.nombre, c.slug, c.descripcion,
            COUNT(p.id)::int AS total_productos
       FROM categoria c
       LEFT JOIN producto p ON p.categoria_id = c.id AND p.activo AND NOT p.eliminado
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
       LEFT JOIN producto p ON p.categoria_id = c.id AND p.activo AND NOT p.eliminado
      WHERE c.slug = $1
      GROUP BY c.id`,
    [slug]
  );
  return rows[0] || null;
};

const buscarPorId = async (id) => {
  const { rows } = await query("SELECT id, nombre, slug, descripcion FROM categoria WHERE id = $1", [id]);
  return rows[0] || null;
};

const crear = async ({ nombre, slug, descripcion }) => {
  const { rows } = await query(
    `INSERT INTO categoria (nombre, slug, descripcion) VALUES ($1, $2, $3)
     RETURNING id, nombre, slug, descripcion`,
    [nombre, slug, descripcion ?? null]
  );
  return rows[0];
};

const actualizar = async (id, cambios) => {
  const columnas = ["nombre", "slug", "descripcion"].filter((c) => cambios[c] !== undefined);
  const sets = columnas.map((c, i) => `${c} = $${i + 2}`);
  const { rows } = await query(
    `UPDATE categoria SET ${sets.join(", ")} WHERE id = $1 RETURNING id, nombre, slug, descripcion`,
    [id, ...columnas.map((c) => cambios[c])]
  );
  return rows[0];
};

// Busca otra categoría con el mismo nombre o slug
const buscarDuplicada = async ({ nombre, slug }, excluirId) => {
  const { rows } = await query(
    `SELECT id, nombre, slug FROM categoria
      WHERE (lower(nombre) = lower($1) OR slug = $2) AND ($3::bigint IS NULL OR id <> $3)`,
    [nombre ?? null, slug ?? null, excluirId || null]
  );
  return rows[0] || null;
};

const contarProductos = async (id) => {
  const { rows } = await query("SELECT COUNT(*)::int AS total FROM producto WHERE categoria_id = $1", [id]);
  return rows[0].total;
};

const eliminar = (id) => query("DELETE FROM categoria WHERE id = $1", [id]);

module.exports = { listar, buscarPorSlug, buscarPorId, crear, actualizar, buscarDuplicada, contarProductos, eliminar };
