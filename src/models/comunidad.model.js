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

module.exports = { listar, buscarPorId, listarRegiones };
