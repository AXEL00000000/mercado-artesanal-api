const Consulta = require("../models/consulta.model");
const Producto = require("../models/producto.model");
const HttpError = require("../utils/HttpError");
const { esEnteroPositivo, validarId } = require("../utils/validaciones");

const ORIGENES = ["boton_tratar", "link_dudas"];
const CANALES = ["web", "app"];

const MENSAJES = {
  boton_tratar: (nombre) => `Hola, me interesa "${nombre}" que vi en Mercado Artesanal. ¿Podemos platicar el precio?`,
  link_dudas: (nombre) => `Hola, tengo una duda sobre "${nombre}" que vi en Mercado Artesanal.`,
};

const registrar = async ({ producto_id, origen, canal } = {}, usuario) => {
  const errores = [];
  if (!esEnteroPositivo(producto_id)) errores.push("producto_id debe ser un número entero positivo");
  if (!ORIGENES.includes(origen)) errores.push(`origen debe ser uno de: ${ORIGENES.join(", ")}`);
  if (!CANALES.includes(canal)) errores.push(`canal debe ser uno de: ${CANALES.join(", ")}`);
  if (errores.length) throw new HttpError(400, "Datos inválidos", errores);

  const [producto] = await Producto.buscarPublicosPorIds([producto_id]);
  if (!producto) throw new HttpError(404, "Producto no encontrado");
  if (origen === "boton_tratar" && producto.modo_venta !== "tratar") {
    throw new HttpError(400, "El botón de tratar solo aplica a productos con precio a tratar");
  }

  const consulta = await Consulta.crear({
    productoId: producto.id,
    usuarioId: usuario && usuario.id,
    origen,
    canal,
  });
  const mensaje = MENSAJES[origen](producto.nombre);
  return { ...consulta, whatsapp_url: `https://wa.me/${producto.whatsapp}?text=${encodeURIComponent(mensaje)}` };
};

const listarDeTaller = async (productor, filtros) => {
  const productoId = filtros.producto_id === undefined ? null : validarId(filtros.producto_id, "producto_id");
  const limite = filtros.limite === undefined ? 50 : validarId(filtros.limite, "limite");
  if (limite > 200) throw new HttpError(400, "limite no puede ser mayor a 200");

  const [por_producto, consultas] = await Promise.all([
    Consulta.contarPorProducto(productor.id),
    Consulta.listarDeProductor(productor.id, { productoId, limite }),
  ]);
  const total = por_producto.reduce((suma, p) => suma + p.total, 0);
  return { total, por_producto, consultas };
};

module.exports = { registrar, listarDeTaller };
