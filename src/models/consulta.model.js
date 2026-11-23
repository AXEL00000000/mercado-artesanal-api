const { query } = require("../config/db");

const crear = async ({ productoId, usuarioId, origen, canal }) => {
  const { rows } = await query(
    `INSERT INTO consulta (producto_id, usuario_id, origen, canal)
     VALUES ($1, $2, $3, $4)
     RETURNING id, producto_id, origen, canal, created_at`,
    [productoId, usuarioId || null, origen, canal]
  );
  return rows[0];
};

// Productos del taller con consultas, del más consultado al menos
const contarPorProducto = async (productorId) => {
  const { rows } = await query(
    `SELECT p.id AS producto_id, p.nombre, p.slug,
            COUNT(*)::int AS total,
            COUNT(*) FILTER (WHERE co.origen = 'boton_tratar')::int AS boton_tratar,
            COUNT(*) FILTER (WHERE co.origen = 'link_dudas')::int AS link_dudas,
            MAX(co.created_at) AS ultima
       FROM consulta co
       JOIN producto p ON p.id = co.producto_id
      WHERE p.productor_id = $1
      GROUP BY p.id
      ORDER BY total DESC, ultima DESC`,
    [productorId]
  );
  return rows;
};

const listarDeProductor = async (productorId, { productoId, limite }) => {
  const { rows } = await query(
    `SELECT co.id, co.origen, co.canal, co.created_at,
            p.id AS producto_id, p.nombre AS producto_nombre,
            u.id AS usuario_id, u.nombre AS usuario_nombre
       FROM consulta co
       JOIN producto p ON p.id = co.producto_id
       LEFT JOIN usuario u ON u.id = co.usuario_id
      WHERE p.productor_id = $1
        AND ($2::bigint IS NULL OR p.id = $2)
      ORDER BY co.created_at DESC, co.id DESC
      LIMIT $3`,
    [productorId, productoId || null, limite]
  );
  return rows.map((f) => ({
    id: f.id,
    origen: f.origen,
    canal: f.canal,
    created_at: f.created_at,
    producto: { id: f.producto_id, nombre: f.producto_nombre },
    usuario: f.usuario_id ? { id: f.usuario_id, nombre: f.usuario_nombre } : null,
  }));
};

module.exports = { crear, contarPorProducto, listarDeProductor };
