const { query } = require("../config/db");

const aProductor = (f) => ({
  id: f.id,
  nombre_taller: f.nombre_taller,
  artesano: f.artesano,
  biografia: f.biografia,
  foto_url: f.foto_url,
  whatsapp: f.whatsapp,
  comunidad: { id: f.comunidad_id, nombre: f.comunidad_nombre, municipio: f.municipio, region: f.region },
  total_productos: f.total_productos,
});

const CONSULTA_BASE = `
  SELECT pr.id, pr.nombre_taller, pr.biografia, pr.foto_url, pr.whatsapp,
         u.nombre AS artesano,
         c.id AS comunidad_id, c.nombre AS comunidad_nombre, c.municipio, c.region,
         COUNT(p.id)::int AS total_productos
    FROM productor pr
    JOIN usuario u ON u.id = pr.usuario_id
    JOIN comunidad c ON c.id = pr.comunidad_id
    LEFT JOIN producto p ON p.productor_id = pr.id AND p.activo
   WHERE pr.estado_verificacion = 'aprobado'`;

// Talleres aprobados; si llega comunidad, filtra por ella
const listar = async (comunidad) => {
  const { rows } = await query(
    `${CONSULTA_BASE}
       AND ($1::bigint IS NULL OR c.id = $1)
     GROUP BY pr.id, u.nombre, c.id
     ORDER BY pr.nombre_taller`,
    [comunidad || null]
  );
  return rows.map(aProductor);
};

const buscarPorId = async (id) => {
  const { rows } = await query(
    `${CONSULTA_BASE}
       AND pr.id = $1
     GROUP BY pr.id, u.nombre, c.id`,
    [id]
  );
  return rows[0] ? aProductor(rows[0]) : null;
};

module.exports = { listar, buscarPorId };
