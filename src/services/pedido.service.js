const Pedido = require("../models/pedido.model");
const Pago = require("../models/pago.model");
const Productor = require("../models/productor.model");
const OpcionEntrega = require("../models/opcion-entrega.model");
const { transaccion } = require("../config/db");
const mercadopago = require("../config/mercadopago");
const HttpError = require("../utils/HttpError");
const { esEnteroPositivo, esTextoVacio, validarId } = require("../utils/validaciones");
const { validarCarrito, cargarCarrito, cotizarEnvio, CP_VALIDO } = require("./entrega.service");

const COMISION_PLATAFORMA = 0;
const TELEFONO_VALIDO = /^[0-9]{10,15}$/;
const ESTADOS = ["pendiente_pago", "pagado", "enviado", "entregado", "cancelado"];
const TRANSICIONES = {
  pendiente_pago: ["cancelado"],
  pagado: ["enviado", "cancelado"],
  enviado: ["entregado"],
  entregado: [],
  cancelado: [],
};
const ESTADO_ENVIO = { enviado: "en_transito", entregado: "entregado" };

// Estado de la order de Mercado Pago -> estado de PAGO
const ESTADOS_MP = {
  processed: "aprobado",
  failed: "rechazado",
  canceled: "rechazado",
  expired: "rechazado",
  refunded: "reembolsado",
};

const redondear = (n) => Math.round(n * 100) / 100;

const CAMPOS_DIRECCION = {
  destinatario: 120, telefono: 15, calle: 150, colonia: 120, ciudad: 120, entidad_federativa: 60, cp: 5,
};

const validarDireccion = (envio) => {
  const errores = [];
  const limpio = {};
  for (const [campo, maximo] of Object.entries(CAMPOS_DIRECCION)) {
    if (esTextoVacio(envio[campo])) errores.push(`envio.${campo} es obligatorio`);
    else if (envio[campo].trim().length > maximo) errores.push(`envio.${campo} no puede pasar de ${maximo} caracteres`);
    else limpio[campo] = envio[campo].trim();
  }
  if (limpio.telefono && !TELEFONO_VALIDO.test(limpio.telefono)) errores.push("envio.telefono debe tener solo dígitos (10 a 15)");
  if (limpio.cp && !CP_VALIDO.test(limpio.cp)) errores.push("envio.cp debe tener 5 dígitos");
  if (errores.length) throw new HttpError(400, "Datos de envío inválidos", errores);
  return limpio;
};

// Calcula el envío según la opción elegida; en 'envia' vuelve a cotizar para no confiar en el costo del cliente
const resolverEnvio = async (taller, opcion, carrito, envio) => {
  if (opcion.tipo === "recoger_taller") return { opcion_entrega_id: opcion.id, costo: 0 };

  const direccion = validarDireccion(envio);
  if (opcion.tipo === "costo_fijo") return { opcion_entrega_id: opcion.id, costo: opcion.costo_fijo, ...direccion };

  if (esTextoVacio(envio.paqueteria) || esTextoVacio(envio.servicio)) {
    throw new HttpError(400, "Datos de envío inválidos", ["envio.paqueteria y envio.servicio son obligatorios; tómalos de /api/envios/cotizar"]);
  }
  const opciones = await cotizarEnvio(taller, carrito, direccion);
  const elegida = opciones.find((o) => o.paqueteria === envio.paqueteria && o.servicio === envio.servicio.trim());
  if (!elegida) throw new HttpError(400, "La paquetería elegida ya no está disponible; vuelve a cotizar el envío");
  return { opcion_entrega_id: opcion.id, costo: redondear(elegida.costo), paqueteria: elegida.paqueteria, servicio: elegida.servicio, ...direccion };
};

const crear = async (usuario, { productor_id, productos, opcion_entrega_id, envio, nota } = {}) => {
  const errores = [];
  if (!esEnteroPositivo(productor_id)) errores.push("productor_id debe ser un número entero positivo");
  if (!esEnteroPositivo(opcion_entrega_id)) errores.push("opcion_entrega_id debe ser un número entero positivo");
  if (nota !== undefined && nota !== null && typeof nota !== "string") errores.push("nota debe ser texto");
  if (errores.length) throw new HttpError(400, "Datos inválidos", errores);
  const items = validarCarrito(productos);

  const taller = await Productor.buscarTallerPorId(productor_id);
  if (!taller || taller.estado_verificacion !== "aprobado") throw new HttpError(404, "Taller no encontrado");
  if (taller.usuario_id === usuario.id) throw new HttpError(400, "No puedes comprar en tu propio taller");

  const opcion = await OpcionEntrega.buscar(opcion_entrega_id, taller.id);
  if (!opcion || !opcion.activo) throw new HttpError(400, "La opción de entrega no existe o no está activa en este taller");

  const carrito = await cargarCarrito(taller.id, items);
  const datosEnvio = await resolverEnvio(taller, opcion, carrito, envio || {});

  const pedidoId = await transaccion(async (cliente) => {
    const filas = await Pedido.bloquearProductos(cliente, carrito.map((p) => p.id));
    const actuales = new Map(filas.map((f) => [f.id, f]));
    const sinStock = carrito.filter((p) => {
      const actual = actuales.get(p.id);
      return !actual || !actual.activo || actual.stock < p.cantidad;
    });
    if (sinStock.length) {
      throw new HttpError(409, "Algunos productos se agotaron mientras hacías tu pedido", sinStock.map((p) => p.nombre));
    }

    const detalle = carrito.map((p) => ({
      producto_id: p.id,
      nombre: actuales.get(p.id).nombre,
      cantidad: p.cantidad,
      precio: actuales.get(p.id).precio,
    }));
    const subtotal = redondear(detalle.reduce((suma, d) => suma + d.precio * d.cantidad, 0));

    const id = await Pedido.crear(cliente, {
      compradorId: usuario.id,
      productorId: taller.id,
      subtotal,
      costoEnvio: datosEnvio.costo,
      nota: nota && nota.trim() ? nota.trim() : null,
    });
    for (const d of detalle) await Pedido.agregarDetalle(cliente, id, d);
    await Pedido.agregarEnvio(cliente, id, datosEnvio);
    return id;
  });

  return Pedido.buscarPorId(pedidoId);
};

const listarMios = (usuario) => Pedido.listar({ compradorId: usuario.id });

const obtenerMio = async (usuario, idTexto) => {
  const pedido = await Pedido.buscarPorId(validarId(idTexto));
  if (!pedido || pedido.comprador.id !== usuario.id) throw new HttpError(404, "Pedido no encontrado");
  return pedido;
};

const urlDeRegreso = (pedidoId, resultado) => `${process.env.FRONT_URL}/pedidos/${pedidoId}?pago=${resultado}`;

const VIGENCIA_ORDEN_MS = 24 * 60 * 60 * 1000;
const ESTADOS_EN_PROCESO = ["processing", "action_required"];

const errorMp = (accion, err) => {
  console.error(`Error al ${accion} en Mercado Pago:`, err.status, err.message || err.error, JSON.stringify(err.errors || err.causes || ""));
  return new HttpError(502, "No se pudo iniciar el pago con Mercado Pago, intenta más tarde");
};

const crearOrdenMp = async (pedido) => {
  const items = pedido.productos.map((p) => ({
    title: p.nombre_producto,
    quantity: p.cantidad,
    unit_price: p.precio_unitario.toFixed(2),
    external_code: String(p.producto_id),
  }));
  if (pedido.costo_envio > 0) {
    items.push({ title: "Envío", quantity: 1, unit_price: pedido.costo_envio.toFixed(2), external_code: "envio" });
  }

  const online = {
    success_url: urlDeRegreso(pedido.id, "aprobado"),
    failure_url: urlDeRegreso(pedido.id, "rechazado"),
    pending_url: urlDeRegreso(pedido.id, "pendiente"),
    callback_url: `${process.env.API_URL}/api/pagos/webhook`,
  };
  if (process.env.FRONT_URL && process.env.FRONT_URL.startsWith("https://")) online.auto_return = "approved";

  try {
    return await mercadopago.crearOrden({
      type: "online",
      processing_mode: "manual",
      total_amount: pedido.total.toFixed(2),
      external_reference: String(pedido.id),
      description: `Pedido ${pedido.id} · ${pedido.productor.nombre_taller}`,
      expiration_time: "P1D",
      items,
      config: { online },
    });
  } catch (err) {
    throw errorMp("crear la order", err);
  }
};

const respuestaPago = (pago, orden, reutilizado) => ({
  pago_id: pago.id,
  pedido_id: pago.pedido_id,
  mp_order_id: orden.id,
  estado: pago.estado,
  checkout_url: orden.checkout_url,
  reutilizado,
});

// Reutiliza la order pendiente si sigue pagable; si no, la cierra y crea otra.
// El pedido queda bloqueado para que dos peticiones a la vez no creen dos orders.
const crearPago = async (usuario, idTexto) => {
  const { id } = await obtenerMio(usuario, idTexto);

  const resultado = await transaccion(async (cliente) => {
    const bloqueado = await Pedido.bloquear(cliente, id);
    if (bloqueado.estado !== "pendiente_pago") {
      return { error: new HttpError(409, `El pedido ya no se puede pagar; está ${bloqueado.estado}`) };
    }

    const pendiente = await Pago.bloquearPendiente(cliente, id);
    if (pendiente) {
      let orden;
      try {
        orden = await mercadopago.obtenerOrden(pendiente.mp_preference_id);
      } catch (err) {
        throw errorMp("consultar la order", err);
      }

      const edad = Date.now() - new Date(orden.created_date || pendiente.created_at).getTime();
      if (orden.status === "created" && edad < VIGENCIA_ORDEN_MS) return respuestaPago(pendiente, orden, true);
      if (ESTADOS_EN_PROCESO.includes(orden.status)) {
        return { error: new HttpError(409, "Ya hay un pago en proceso para este pedido; espera la confirmación de Mercado Pago") };
      }
      if (orden.status === "created") {
        try {
          orden = await mercadopago.cancelarOrden(orden.id);
        } catch (err) {
          throw errorMp("cancelar la order vencida", err);
        }
      }

      const aplicado = await aplicarOrdenEn(cliente, orden);
      if (aplicado.estado === "aprobado") {
        return { error: new HttpError(409, "El pedido ya fue pagado") };
      }
    }

    const pedido = await Pedido.buscarPorId(id);
    const orden = await crearOrdenMp(pedido);
    const pago = await Pago.crear(cliente, { pedidoId: id, mpOrderId: orden.id, monto: pedido.total, comision: COMISION_PLATAFORMA });
    return respuestaPago(pago, orden, false);
  });

  if (resultado.error) throw resultado.error;
  return resultado;
};

// Aplica a la base el estado de una order de Mercado Pago. Es idempotente.
const aplicarOrdenEn = async (cliente, orden) => {
  const pago = await Pago.bloquearPorOrden(cliente, orden.id);
  if (!pago) return { aplicado: false, motivo: "La order no corresponde a ningún pago" };
  if (pago.estado === "aprobado" || pago.estado === "reembolsado") {
    if (pago.estado === "aprobado" && ESTADOS_MP[orden.status] === "reembolsado") {
      await Pago.actualizar(cliente, pago.id, { estado: "reembolsado" });
      return { aplicado: true, estado: "reembolsado" };
    }
    return { aplicado: false, motivo: `El pago ya estaba ${pago.estado}` };
  }

  const estado = ESTADOS_MP[orden.status] || "pendiente";
  const pagoMp = orden.transactions && orden.transactions.payments && orden.transactions.payments[0];
  await Pago.actualizar(cliente, pago.id, { estado, mpPaymentId: pagoMp && pagoMp.id });

  if (estado === "aprobado") {
    const pedido = await Pedido.bloquear(cliente, pago.pedido_id);
    if (pedido.estado === "pendiente_pago") {
      const movidos = await Pedido.moverStock(cliente, pedido.id, -1);
      movidos
        .filter((m) => m.stock === 0)
        .forEach((m) => console.warn(`Producto ${m.id} quedó sin stock con el pedido ${pedido.id}`));
      await Pedido.cambiarEstado(cliente, pedido.id, "pagado");
    } else {
      console.warn(`Pago aprobado para el pedido ${pedido.id} que está ${pedido.estado}`);
    }
  }
  return { aplicado: true, estado };
};

const aplicarOrden = (orden) => transaccion((cliente) => aplicarOrdenEn(cliente, orden));

const procesarWebhook = async ({ query, body, headers }) => {
  const tipo = (body && body.type) || query.type || query.topic;
  const dataId = (body && body.data && body.data.id) || query["data.id"] || query.id;
  if (tipo !== "order" || !dataId) return { recibido: true, aplicado: false, motivo: "Notificación ignorada" };

  if (process.env.MP_WEBHOOK_SECRET) {
    const valida = mercadopago.firmaValida({ firma: headers["x-signature"], requestId: headers["x-request-id"], dataId });
    if (!valida) throw new HttpError(401, "Firma de Mercado Pago inválida");
  }

  let orden;
  try {
    orden = await mercadopago.obtenerOrden(dataId);
  } catch (err) {
    console.error("Error al consultar la order en Mercado Pago:", err.status, err.message || err.error);
    throw new HttpError(502, "No se pudo consultar la order en Mercado Pago");
  }
  return { recibido: true, ...(await aplicarOrden(orden)) };
};

const listarDeTaller = async (productor, { estado } = {}) => {
  if (estado !== undefined && !ESTADOS.includes(estado)) {
    throw new HttpError(400, `estado debe ser uno de: ${ESTADOS.join(", ")}`);
  }
  return Pedido.listar({ productorId: productor.id, estado });
};

const cambiarEstado = async (productor, idTexto, { estado, guia, tracking_url } = {}) => {
  const id = validarId(idTexto);
  if (!ESTADOS.includes(estado)) throw new HttpError(400, `estado debe ser uno de: ${ESTADOS.join(", ")}`);
  const errores = [];
  if (guia !== undefined && (esTextoVacio(guia) || guia.length > 60)) errores.push("guia debe ser texto de hasta 60 caracteres");
  if (tracking_url !== undefined && (typeof tracking_url !== "string" || !/^https?:\/\/\S+$/.test(tracking_url))) {
    errores.push("tracking_url debe ser una URL http(s)");
  }
  if ((guia !== undefined || tracking_url !== undefined) && estado !== "enviado") {
    errores.push("guia y tracking_url solo se envían al pasar a enviado");
  }
  if (errores.length) throw new HttpError(400, "Datos inválidos", errores);

  await transaccion(async (cliente) => {
    const pedido = await Pedido.bloquear(cliente, id);
    if (!pedido || pedido.productor_id !== productor.id) throw new HttpError(404, "Pedido no encontrado en tu taller");
    if (!TRANSICIONES[pedido.estado].includes(estado)) {
      throw new HttpError(409, `Un pedido ${pedido.estado} no puede pasar a ${estado}`);
    }

    await Pedido.cambiarEstado(cliente, id, estado);
    if (ESTADO_ENVIO[estado]) {
      await Pedido.actualizarEnvio(cliente, id, { estado_envio: ESTADO_ENVIO[estado], guia: guia && guia.trim(), tracking_url });
    }
    if (estado === "cancelado" && pedido.estado === "pagado") await Pedido.moverStock(cliente, id, 1);
    if (estado === "entregado") await Pago.marcarLiquidado(cliente, id);
  });

  return Pedido.buscarPorId(id);
};

module.exports = { crear, listarMios, obtenerMio, crearPago, procesarWebhook, aplicarOrden, listarDeTaller, cambiarEstado };
