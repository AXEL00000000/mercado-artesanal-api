const OpcionEntrega = require("../models/opcion-entrega.model");
const Productor = require("../models/productor.model");
const Producto = require("../models/producto.model");
const envia = require("../config/envia");
const HttpError = require("../utils/HttpError");
const { esEnteroPositivo, validarId } = require("../utils/validaciones");

const TIPOS = ["envia", "costo_fijo", "recoger_taller"];
const CP_VALIDO = /^[0-9]{5}$/;
const ESTADO_ORIGEN = "OA";
const MAXIMO_PRODUCTOS = 30;

const validarOpcion = (d, tipo, parcial) => {
  const errores = [];
  const limpio = {};

  if (!parcial) {
    if (!TIPOS.includes(d.tipo)) errores.push(`tipo debe ser uno de: ${TIPOS.join(", ")}`);
    else limpio.tipo = d.tipo;
  } else if (d.tipo !== undefined) {
    errores.push("tipo no se puede cambiar; crea otra opción");
  }

  const tipoFinal = limpio.tipo || tipo;
  if (tipoFinal === "costo_fijo") {
    if ((!parcial || d.costo_fijo !== undefined) && (typeof d.costo_fijo !== "number" || !(d.costo_fijo >= 0) || d.costo_fijo > 99999)) {
      errores.push("costo_fijo es obligatorio y debe ser un número mayor o igual a 0");
    } else if (d.costo_fijo !== undefined) limpio.costo_fijo = Math.round(d.costo_fijo * 100) / 100;
  } else if (d.costo_fijo !== undefined && d.costo_fijo !== null) {
    errores.push("costo_fijo solo aplica a opciones de tipo costo_fijo");
  }

  if (d.instrucciones !== undefined) {
    if (d.instrucciones !== null && typeof d.instrucciones !== "string") errores.push("instrucciones debe ser texto");
    else limpio.instrucciones = d.instrucciones && d.instrucciones.trim() ? d.instrucciones.trim() : null;
  }
  if (d.activo !== undefined) {
    if (typeof d.activo !== "boolean") errores.push("activo debe ser true o false");
    else limpio.activo = d.activo;
  }

  if (errores.length) throw new HttpError(400, "Datos inválidos", errores);
  return limpio;
};

const buscarPropia = async (productor, idTexto) => {
  const opcion = await OpcionEntrega.buscar(validarId(idTexto), productor.id);
  if (!opcion) throw new HttpError(404, "Opción de entrega no encontrada en tu taller");
  return opcion;
};

const listarMias = (productor) => OpcionEntrega.listarDeProductor(productor.id, false);

const crear = async (productor, datos) => {
  const limpio = validarOpcion(datos, null, false);
  if (await OpcionEntrega.buscarPorTipo(productor.id, limpio.tipo)) {
    throw new HttpError(409, `Ya tienes una opción de entrega de tipo ${limpio.tipo}`);
  }
  return OpcionEntrega.crear(productor.id, limpio);
};

const actualizar = async (productor, idTexto, datos) => {
  const actual = await buscarPropia(productor, idTexto);
  const limpio = validarOpcion(datos, actual.tipo, true);
  if (!Object.keys(limpio).length) throw new HttpError(400, "No enviaste ningún campo para actualizar");
  return OpcionEntrega.actualizar(actual.id, limpio);
};

const eliminar = async (productor, idTexto) => {
  const actual = await buscarPropia(productor, idTexto);
  if (await OpcionEntrega.estaEnUso(actual.id)) {
    throw new HttpError(409, "La opción ya se usó en pedidos; desactívala en lugar de borrarla");
  }
  await OpcionEntrega.eliminar(actual.id);
};

const listarPublicas = async (idTexto) => {
  const id = validarId(idTexto);
  if (!(await Productor.buscarPorId(id))) throw new HttpError(404, "Taller no encontrado");
  return OpcionEntrega.listarDeProductor(id, true);
};

// Valida [{producto_id, cantidad}] y junta los productos repetidos
const validarCarrito = (productos) => {
  if (!Array.isArray(productos) || !productos.length) {
    throw new HttpError(400, "productos debe ser una lista con al menos un producto");
  }
  const cantidades = new Map();
  const errores = [];
  productos.forEach((p, i) => {
    if (!p || !esEnteroPositivo(p.producto_id)) errores.push(`productos[${i}].producto_id debe ser un entero positivo`);
    else if (!esEnteroPositivo(p.cantidad)) errores.push(`productos[${i}].cantidad debe ser un entero positivo`);
    else cantidades.set(p.producto_id, (cantidades.get(p.producto_id) || 0) + p.cantidad);
  });
  if (errores.length) throw new HttpError(400, "Datos inválidos", errores);
  if (cantidades.size > MAXIMO_PRODUCTOS) throw new HttpError(400, `Un pedido no puede tener más de ${MAXIMO_PRODUCTOS} productos distintos`);
  return [...cantidades].map(([producto_id, cantidad]) => ({ producto_id, cantidad }));
};

// Carga los productos del carrito y revisa que sean del taller, de precio fijo y con stock
const cargarCarrito = async (productorId, items) => {
  const filas = await Producto.buscarPublicosPorIds(items.map((i) => i.producto_id));
  const porId = new Map(filas.map((f) => [f.id, f]));
  const errores = [];

  const productos = items.map(({ producto_id, cantidad }) => {
    const p = porId.get(producto_id);
    if (!p) errores.push(`El producto ${producto_id} no existe o no está disponible`);
    else if (p.productor_id !== productorId) errores.push(`"${p.nombre}" es de otro taller; un pedido es de un solo taller`);
    else if (p.modo_venta !== "fijo") errores.push(`"${p.nombre}" es de precio a tratar y se consulta por WhatsApp`);
    else if (p.stock < cantidad) errores.push(`"${p.nombre}" solo tiene ${p.stock} en existencia`);
    return p && { ...p, cantidad };
  });

  if (errores.length) throw new HttpError(400, "Hay productos que no se pueden comprar", errores);
  return productos;
};

// Cotiza con Envia; destino lleva al menos { cp } y opcionalmente los datos del destinatario
const cotizarEnvio = async (taller, productos, destino) => {
  const sinMedidas = productos.filter((p) => !p.peso_g || !p.alto_cm || !p.ancho_cm || !p.largo_cm);
  if (sinMedidas.length) {
    throw new HttpError(400, "Hay productos sin peso o medidas para cotizar el envío",
      sinMedidas.map((p) => `"${p.nombre}" no tiene peso_g, alto_cm, ancho_cm y largo_cm`));
  }

  const lugar = await envia.buscarCp(destino.cp);
  if (!lugar) throw new HttpError(400, `El código postal ${destino.cp} no existe`);

  return envia.cotizar({
    origen: {
      name: taller.nombre_taller,
      phone: taller.whatsapp.slice(-10),
      street: taller.direccion_taller,
      city: taller.comunidad.municipio,
      state: ESTADO_ORIGEN,
      country: "MX",
      postalCode: taller.cp_taller,
    },
    destino: {
      name: destino.destinatario || "Cliente",
      phone: destino.telefono || "0000000000",
      street: destino.calle || "Por definir",
      city: destino.ciudad || lugar.ciudad,
      state: lugar.estado,
      country: "MX",
      postalCode: destino.cp,
    },
    paquetes: productos.map((p) => ({
      type: "box",
      content: "Artesanía",
      amount: p.cantidad,
      declaredValue: p.precio,
      lengthUnit: "CM",
      weightUnit: "KG",
      weight: Math.max(p.peso_g / 1000, 0.01),
      dimensions: { length: p.largo_cm, width: p.ancho_cm, height: p.alto_cm },
    })),
  });
};

const cotizar = async ({ productor_id, cp_destino, productos } = {}) => {
  const errores = [];
  if (!esEnteroPositivo(productor_id)) errores.push("productor_id debe ser un número entero positivo");
  if (typeof cp_destino !== "string" || !CP_VALIDO.test(cp_destino)) errores.push("cp_destino debe tener 5 dígitos");
  if (errores.length) throw new HttpError(400, "Datos inválidos", errores);
  const items = validarCarrito(productos);

  const taller = await Productor.buscarTallerPorId(productor_id);
  if (!taller || taller.estado_verificacion !== "aprobado") throw new HttpError(404, "Taller no encontrado");
  const opcion = await OpcionEntrega.buscarPorTipo(taller.id, "envia");
  if (!opcion || !opcion.activo) throw new HttpError(400, "Este taller no ofrece envío por paquetería");

  const carrito = await cargarCarrito(taller.id, items);
  const opciones = await cotizarEnvio(taller, carrito, { cp: cp_destino });
  return { opcion_entrega_id: opcion.id, opciones: opciones.sort((a, b) => a.costo - b.costo) };
};

module.exports = {
  listarMias, crear, actualizar, eliminar, listarPublicas, cotizar,
  validarCarrito, cargarCarrito, cotizarEnvio, CP_VALIDO,
};
