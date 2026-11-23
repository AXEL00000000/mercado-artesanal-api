// Acceso a datos de COMUNIDAD. Solo SQL; las reglas van en el servicio.
const { query } = require("../config/db");

// Comunidades con cuántos talleres aprobados tiene cada una.
// Si llega region, filtra por ella.
const listar = async (region) => {
  const { rows } = await query(
    `SELECT c.id, c.nombre, c.municipio, c.distrito, c.region,
            COUNT(pr.id)::int AS total_productores
       FROM comunidad c
       LEFT JOIN productor pr ON pr.comunidad_id = c.id AND pr.estado_verificacion = 'aprobado'
      WHERE ($1::text IS NULL OR c.region = $1)
      GROUP BY c.id
      ORDER BY c.region, c.nombre`,
    [region || null]
  );
  return rows;
};

const buscarPorId = async (id) => {
  const { rows } = await query(
    `SELECT c.id, c.nombre, c.municipio, c.distrito, c.region,
            COUNT(pr.id)::int AS total_productores
       FROM comunidad c
       LEFT JOIN productor pr ON pr.comunidad_id = c.id AND pr.estado_verificacion = 'aprobado'
      WHERE c.id = $1
      GROUP BY c.id`,
    [id]
  );
  return rows[0] || null;
};

// Regiones que tienen al menos una comunidad registrada.
const listarRegiones = async () => {
  const { rows } = await query(
    `SELECT region, COUNT(*)::int AS total_comunidades
       FROM comunidad
      GROUP BY region
      ORDER BY region`
  );
  return rows;
};

const CAMPOS = "id, nombre, municipio, distrito, region";

const crear = async ({ nombre, municipio, distrito, region }) => {
  const { rows } = await query(
    `INSERT INTO comunidad (nombre, municipio, distrito, region) VALUES ($1, $2, $3, $4) RETURNING ${CAMPOS}`,
    [nombre, municipio, distrito ?? null, region]
  );
  return rows[0];
};

const actualizar = async (id, cambios) => {
  const columnas = ["nombre", "municipio", "distrito", "region"].filter((c) => cambios[c] !== undefined);
  const sets = columnas.map((c, i) => `${c} = $${i + 2}`);
  const { rows } = await query(
    `UPDATE comunidad SET ${sets.join(", ")} WHERE id = $1 RETURNING ${CAMPOS}`,
    [id, ...columnas.map((c) => cambios[c])]
  );
  return rows[0];
};

const buscarDuplicada = async ({ nombre, municipio }, excluirId) => {
  const { rows } = await query(
    `SELECT id FROM comunidad
      WHERE lower(nombre) = lower($1) AND lower(municipio) = lower($2) AND ($3::bigint IS NULL OR id <> $3)`,
    [nombre, municipio, excluirId || null]
  );
  return rows[0] || null;
};

// Talleres de cualquier estado que pertenecen a la comunidad
const contarProductores = async (id) => {
  const { rows } = await query("SELECT COUNT(*)::int AS total FROM productor WHERE comunidad_id = $1", [id]);
  return rows[0].total;
};

const eliminar = (id) => query("DELETE FROM comunidad WHERE id = $1", [id]);

module.exports = {
  listar, buscarPorId, listarRegiones, crear, actualizar, buscarDuplicada, contarProductores, eliminar,
};
