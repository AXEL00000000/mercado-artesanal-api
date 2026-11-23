// Cliente de Mercado Pago (Checkout Pro vía API de Orders) con credenciales de prueba.
const crypto = require("crypto");
const { MercadoPagoConfig, Order } = require("mercadopago");

let ordenes = null;

const obtenerCliente = () => {
  if (!ordenes) {
    if (!process.env.MP_ACCESS_TOKEN) throw new Error("Falta MP_ACCESS_TOKEN en el archivo .env");
    ordenes = new Order(new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN, options: { timeout: 15000 } }));
  }
  return ordenes;
};

const crearOrden = (body) =>
  obtenerCliente().create({ body, requestOptions: { idempotencyKey: crypto.randomUUID() } });

const obtenerOrden = (id) => obtenerCliente().get({ id });

// Valida el header x-signature ("ts=...,v1=...") con MP_WEBHOOK_SECRET
const firmaValida = ({ firma, requestId, dataId }) => {
  const partes = Object.fromEntries((firma || "").split(",").map((p) => p.trim().split("=")));
  if (!partes.ts || !partes.v1) return false;
  const manifiesto = `id:${String(dataId).toLowerCase()};request-id:${requestId};ts:${partes.ts};`;
  const esperado = crypto.createHmac("sha256", process.env.MP_WEBHOOK_SECRET).update(manifiesto).digest("hex");
  return esperado.length === partes.v1.length && crypto.timingSafeEqual(Buffer.from(esperado), Buffer.from(partes.v1));
};

module.exports = { crearOrden, obtenerOrden, firmaValida };
