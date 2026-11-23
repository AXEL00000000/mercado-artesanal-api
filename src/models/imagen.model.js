const { query, transaccion } = require("../config/db");

const listarDeProducto = async (productoId) => {
  const { rows } = await query(
    `SELECT id, url, orden, es_principal
       FROM imagen_producto
      WHERE producto_id = $1
      ORDER BY es_principal DESC, orden, id`,
    [productoId]
  );
  return rows;
};

const buscar = async (id, productoId) => {
  const { rows } = await query(
    `SELECT id, url, orden, es_principal
       FROM imagen_producto
      WHERE id = $1 AND producto_id = $2`,
    [id, productoId]
  );
  return rows[0] || null;
};

// Se agrega al final; si el producto no tiene imágenes, queda como principal
const crear = async (productoId, url) => {
  const { rows } = await query(
    `INSERT INTO imagen_producto (producto_id, url, orden, es_principal)
     SELECT $1, $2,
            COALESCE(MAX(orden) + 1, 0),
            COUNT(*) = 0
       FROM imagen_producto
      WHERE producto_id = $1
     RETURNING id, url, orden, es_principal`,
    [productoId, url]
  );
  return rows[0];
};

// Si se borra la principal, la siguiente por orden pasa a ser principal
const eliminar = (id, productoId) =>
  transaccion(async (cliente) => {
    const { rows } = await cliente.query(
      "DELETE FROM imagen_producto WHERE id = $1 AND producto_id = $2 RETURNING es_principal",
      [id, productoId]
    );
    if (rows[0] && rows[0].es_principal) {
      await cliente.query(
        `UPDATE imagen_producto SET es_principal = TRUE
          WHERE id = (SELECT id FROM imagen_producto WHERE producto_id = $1 ORDER BY orden, id LIMIT 1)`,
        [productoId]
      );
    }
  });

const marcarPrincipal = (id, productoId) =>
  transaccion(async (cliente) => {
    await cliente.query(
      "UPDATE imagen_producto SET es_principal = FALSE WHERE producto_id = $1 AND es_principal",
      [productoId]
    );
    await cliente.query(
      "UPDATE imagen_producto SET es_principal = TRUE WHERE id = $1 AND producto_id = $2",
      [id, productoId]
    );
  });

module.exports = { listarDeProducto, buscar, crear, eliminar, marcarPrincipal };
