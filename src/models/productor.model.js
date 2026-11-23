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

const CAMPOS_TALLER = `
  pr.id, pr.usuario_id, pr.nombre_taller, pr.biografia, pr.foto_url, pr.whatsapp,
  pr.direccion_taller, pr.cp_taller, pr.estado_verificacion, pr.created_at,
  c.id AS comunidad_id, c.nombre AS comunidad_nombre, c.municipio, c.region`;

const aTaller = (f) => ({
  id: f.id,
  usuario_id: f.usuario_id,
  nombre_taller: f.nombre_taller,
  biografia: f.biografia,
  foto_url: f.foto_url,
  whatsapp: f.whatsapp,
  direccion_taller: f.direccion_taller,
  cp_taller: f.cp_taller,
  estado_verificacion: f.estado_verificacion,
  comunidad: { id: f.comunidad_id, nombre: f.comunidad_nombre, municipio: f.municipio, region: f.region },
  created_at: f.created_at,
});

// Taller de un usuario, en cualquier estado de verificación
const buscarPorUsuario = async (usuarioId) => {
  const { rows } = await query(
    `SELECT ${CAMPOS_TALLER}
       FROM productor pr
       JOIN comunidad c ON c.id = pr.comunidad_id
      WHERE pr.usuario_id = $1`,
    [usuarioId]
  );
  return rows[0] ? aTaller(rows[0]) : null;
};

// Taller por id, en cualquier estado de verificación
const buscarTallerPorId = async (id) => {
  const { rows } = await query(
    `SELECT ${CAMPOS_TALLER}
       FROM productor pr
       JOIN comunidad c ON c.id = pr.comunidad_id
      WHERE pr.id = $1`,
    [id]
  );
  return rows[0] ? aTaller(rows[0]) : null;
};

const crear = async (usuarioId, d) => {
  const { rows } = await query(
    `INSERT INTO productor (usuario_id, comunidad_id, nombre_taller, biografia, foto_url,
                            whatsapp, direccion_taller, cp_taller)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING id`,
    [usuarioId, d.comunidad_id, d.nombre_taller, d.biografia ?? null, d.foto_url ?? null,
     d.whatsapp, d.direccion_taller, d.cp_taller]
  );
  return rows[0].id;
};

const COLUMNAS_EDITABLES = ["comunidad_id", "nombre_taller", "biografia", "foto_url", "whatsapp", "direccion_taller", "cp_taller"];

const actualizar = async (id, cambios) => {
  const columnas = COLUMNAS_EDITABLES.filter((c) => cambios[c] !== undefined);
  if (!columnas.length) return;
  const sets = columnas.map((c, i) => `${c} = $${i + 2}`);
  await query(`UPDATE productor SET ${sets.join(", ")} WHERE id = $1`, [id, ...columnas.map((c) => cambios[c])]);
};

module.exports = { listar, buscarPorId, buscarPorUsuario, buscarTallerPorId, crear, actualizar };
