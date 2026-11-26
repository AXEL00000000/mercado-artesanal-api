const { query } = require("../config/db");

const CAMPOS = `id, pedido_id, proveedor, mp_preference_id, mp_payment_id, estado, monto,
                comision_plataforma, monto_artesano, liquidado_simulado, created_at`;

const crear = async (cliente, { pedidoId, mpOrderId, monto, comision }) => {
  const { rows } = await cliente.query(
    `INSERT INTO pago (pedido_id, mp_preference_id, monto, comision_plataforma, monto_artesano)
     VALUES ($1, $2, $3, $4, $3::numeric - $4::numeric)
     RETURNING ${CAMPOS}`,
    [pedidoId, mpOrderId, monto, comision]
  );
  return rows[0];
};

const bloquearPorOrden = async (cliente, mpOrderId) => {
  const { rows } = await cliente.query(`SELECT ${CAMPOS} FROM pago WHERE mp_preference_id = $1 FOR UPDATE`, [mpOrderId]);
  return rows[0] || null;
};

// Último pago pendiente del pedido que tiene order en Mercado Pago
const bloquearPendiente = async (cliente, pedidoId) => {
  const { rows } = await cliente.query(
    `SELECT ${CAMPOS} FROM pago
      WHERE pedido_id = $1 AND estado = 'pendiente' AND mp_preference_id IS NOT NULL
      ORDER BY id DESC
      LIMIT 1
        FOR UPDATE`,
    [pedidoId]
  );
  return rows[0] || null;
};

const actualizar = (cliente, id, { estado, mpPaymentId }) =>
  cliente.query(
    "UPDATE pago SET estado = $2, mp_payment_id = COALESCE($3, mp_payment_id) WHERE id = $1",
    [id, estado, mpPaymentId ?? null]
  );

const listarDePedido = async (pedidoId) => {
  const { rows } = await query(`SELECT ${CAMPOS} FROM pago WHERE pedido_id = $1 ORDER BY id DESC`, [pedidoId]);
  return rows;
};

const marcarLiquidado = (cliente, pedidoId) =>
  cliente.query("UPDATE pago SET liquidado_simulado = TRUE WHERE pedido_id = $1 AND estado = 'aprobado'", [pedidoId]);

module.exports = { crear, bloquearPendiente, bloquearPorOrden, actualizar, listarDePedido, marcarLiquidado };
