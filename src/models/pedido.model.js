const { query } = require("../config/db");

// Bloquea las filas de los productos hasta terminar la transacción
const bloquearProductos = async (cliente, ids) => {
  const { rows } = await cliente.query(
    `SELECT id, nombre, precio, stock, activo, modo_venta
       FROM producto
      WHERE id = ANY($1::bigint[])
      ORDER BY id
        FOR UPDATE`,
    [ids]
  );
  return rows;
};

const crear = async (cliente, { compradorId, productorId, subtotal, costoEnvio, nota }) => {
  const { rows } = await cliente.query(
    `INSERT INTO pedido (comprador_id, productor_id, subtotal, costo_envio, total, nota)
     VALUES ($1, $2, $3, $4, $3::numeric + $4::numeric, $5)
     RETURNING id`,
    [compradorId, productorId, subtotal, costoEnvio, nota]
  );
  return rows[0].id;
};

const agregarDetalle = (cliente, pedidoId, { producto_id, nombre, cantidad, precio }) =>
  cliente.query(
    `INSERT INTO detalle_pedido (pedido_id, producto_id, nombre_producto, cantidad, precio_unitario, subtotal)
     VALUES ($1, $2, $3, $4, $5, $4::int * $5::numeric)`,
    [pedidoId, producto_id, nombre, cantidad, precio]
  );

const agregarEnvio = (cliente, pedidoId, e) =>
  cliente.query(
    `INSERT INTO envio (pedido_id, opcion_entrega_id, costo, paqueteria, servicio, destinatario, telefono,
                        calle, colonia, ciudad, entidad_federativa, cp)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
    [pedidoId, e.opcion_entrega_id, e.costo, e.paqueteria ?? null, e.servicio ?? null, e.destinatario ?? null,
     e.telefono ?? null, e.calle ?? null, e.colonia ?? null, e.ciudad ?? null, e.entidad_federativa ?? null, e.cp ?? null]
  );

const CAMPOS_PEDIDO = `
  pe.id, pe.comprador_id, pe.productor_id, pe.estado, pe.subtotal, pe.costo_envio, pe.total, pe.nota,
  pe.created_at, pe.updated_at,
  pr.nombre_taller, u.nombre AS comprador_nombre, u.email AS comprador_email,
  en.id AS envio_id, en.costo AS envio_costo, en.paqueteria, en.servicio, en.destinatario, en.telefono,
  en.calle, en.colonia, en.ciudad, en.entidad_federativa, en.cp, en.guia, en.tracking_url, en.estado_envio,
  oe.id AS opcion_entrega_id, oe.tipo AS opcion_tipo,
  (SELECT pa.estado FROM pago pa WHERE pa.pedido_id = pe.id ORDER BY pa.id DESC LIMIT 1) AS estado_pago`;

const DESDE_PEDIDO = `
  FROM pedido pe
  JOIN productor pr ON pr.id = pe.productor_id
  JOIN usuario u ON u.id = pe.comprador_id
  LEFT JOIN envio en ON en.pedido_id = pe.id
  LEFT JOIN opcion_entrega oe ON oe.id = en.opcion_entrega_id`;

const aPedido = (f) => ({
  id: f.id,
  estado: f.estado,
  estado_pago: f.estado_pago,
  subtotal: f.subtotal,
  costo_envio: f.costo_envio,
  total: f.total,
  nota: f.nota,
  productor: { id: f.productor_id, nombre_taller: f.nombre_taller },
  comprador: { id: f.comprador_id, nombre: f.comprador_nombre, email: f.comprador_email },
  envio: f.envio_id
    ? {
        tipo: f.opcion_tipo,
        opcion_entrega_id: f.opcion_entrega_id,
        costo: f.envio_costo,
        paqueteria: f.paqueteria,
        servicio: f.servicio,
        destinatario: f.destinatario,
        telefono: f.telefono,
        calle: f.calle,
        colonia: f.colonia,
        ciudad: f.ciudad,
        entidad_federativa: f.entidad_federativa,
        cp: f.cp,
        guia: f.guia,
        tracking_url: f.tracking_url,
        estado_envio: f.estado_envio,
      }
    : null,
  created_at: f.created_at,
  updated_at: f.updated_at,
});

const listarDetalles = async (pedidoIds) => {
  const { rows } = await query(
    `SELECT d.pedido_id, d.producto_id, d.nombre_producto, d.cantidad, d.precio_unitario, d.subtotal,
            img.url AS imagen
       FROM detalle_pedido d
       LEFT JOIN imagen_producto img ON img.producto_id = d.producto_id AND img.es_principal
      WHERE d.pedido_id = ANY($1::bigint[])
      ORDER BY d.id`,
    [pedidoIds]
  );
  return rows;
};

const conDetalles = async (filas) => {
  const pedidos = filas.map(aPedido);
  if (!pedidos.length) return pedidos;
  const detalles = await listarDetalles(pedidos.map((p) => p.id));
  pedidos.forEach((p) => {
    p.productos = detalles
      .filter((d) => d.pedido_id === p.id)
      .map(({ pedido_id, ...d }) => d);
  });
  return pedidos;
};

const listar = async ({ compradorId, productorId, estado }) => {
  const { rows } = await query(
    `SELECT ${CAMPOS_PEDIDO} ${DESDE_PEDIDO}
      WHERE ($1::bigint IS NULL OR pe.comprador_id = $1)
        AND ($2::bigint IS NULL OR pe.productor_id = $2)
        AND ($3::text IS NULL OR pe.estado = $3)
      ORDER BY pe.created_at DESC, pe.id DESC`,
    [compradorId || null, productorId || null, estado || null]
  );
  return conDetalles(rows);
};

const buscarPorId = async (id) => {
  const { rows } = await query(`SELECT ${CAMPOS_PEDIDO} ${DESDE_PEDIDO} WHERE pe.id = $1`, [id]);
  const [pedido] = await conDetalles(rows);
  return pedido || null;
};

const bloquear = async (cliente, id) => {
  const { rows } = await cliente.query("SELECT id, estado, productor_id FROM pedido WHERE id = $1 FOR UPDATE", [id]);
  return rows[0] || null;
};

const cambiarEstado = (cliente, id, estado) =>
  cliente.query("UPDATE pedido SET estado = $2, updated_at = NOW() WHERE id = $1", [id, estado]);

const actualizarEnvio = (cliente, pedidoId, { estado_envio, guia, tracking_url }) =>
  cliente.query(
    `UPDATE envio SET estado_envio = COALESCE($2, estado_envio),
                      guia = COALESCE($3, guia),
                      tracking_url = COALESCE($4, tracking_url)
      WHERE pedido_id = $1`,
    [pedidoId, estado_envio ?? null, guia ?? null, tracking_url ?? null]
  );

// Suma (+) o resta (-) del stock las cantidades del pedido; el stock no baja de 0
const moverStock = async (cliente, pedidoId, signo) => {
  const { rows } = await cliente.query(
    `UPDATE producto p
        SET stock = GREATEST(p.stock + $2::int * d.cantidad, 0), updated_at = NOW()
       FROM detalle_pedido d
      WHERE d.pedido_id = $1 AND d.producto_id = p.id AND p.stock IS NOT NULL
     RETURNING p.id, p.stock, d.cantidad`,
    [pedidoId, signo]
  );
  return rows;
};

module.exports = {
  bloquearProductos, crear, agregarDetalle, agregarEnvio,
  listar, buscarPorId, bloquear, cambiarEstado, actualizarEnvio, moverStock,
};
