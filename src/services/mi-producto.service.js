const crypto = require("crypto");
const Producto = require("../models/producto.model");
const Imagen = require("../models/imagen.model");
const Categoria = require("../models/categoria.model");
const storage = require("../config/storage");
const HttpError = require("../utils/HttpError");
const { esEnteroPositivo, esTextoVacio, validarId, generarSlug } = require("../utils/validaciones");

const MODOS = ["fijo", "tratar"];
const EXTENSIONES = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
const PRECIO_MAXIMO = 99999999.99;

const esEnteroNoNegativo = (v) => Number.isInteger(v) && v >= 0;
const esPositivo = (v) => typeof v === "number" && Number.isFinite(v) && v > 0;

// En modo parcial solo se validan los campos que llegan
const validarProducto = async (d, parcial) => {
  const errores = [];
  const llega = (campo) => !parcial || d[campo] !== undefined;
  const limpio = {};

  if (llega("categoria_id")) {
    if (!esEnteroPositivo(d.categoria_id)) errores.push("categoria_id debe ser un número entero positivo");
    else if (!(await Categoria.buscarPorId(d.categoria_id))) errores.push("categoria_id no existe");
    else limpio.categoria_id = d.categoria_id;
  }
  if (llega("nombre")) {
    if (esTextoVacio(d.nombre)) errores.push("nombre es obligatorio");
    else if (d.nombre.trim().length > 150) errores.push("nombre no puede pasar de 150 caracteres");
    else if (!generarSlug(d.nombre)) errores.push("nombre debe tener letras o números");
    else limpio.nombre = d.nombre.trim();
  }
  if (llega("modo_venta")) {
    if (!MODOS.includes(d.modo_venta)) errores.push("modo_venta debe ser fijo o tratar");
    else limpio.modo_venta = d.modo_venta;
  }
  if (llega("precio")) {
    if (!esPositivo(d.precio) || d.precio > PRECIO_MAXIMO) errores.push("precio debe ser un número mayor a 0");
    else limpio.precio = Math.round(d.precio * 100) / 100;
  }
  if (d.stock !== undefined) {
    if (d.stock !== null && !esEnteroNoNegativo(d.stock)) errores.push("stock debe ser un entero mayor o igual a 0");
    else limpio.stock = d.stock;
  }
  for (const campo of ["descripcion", "material", "tecnica"]) {
    if (d[campo] === undefined) continue;
    if (d[campo] !== null && typeof d[campo] !== "string") errores.push(`${campo} debe ser texto`);
    else if (campo !== "descripcion" && d[campo] && d[campo].trim().length > 150) errores.push(`${campo} no puede pasar de 150 caracteres`);
    else limpio[campo] = d[campo] && d[campo].trim() ? d[campo].trim() : null;
  }
  if (d.peso_g !== undefined) {
    if (d.peso_g !== null && !esEnteroPositivo(d.peso_g)) errores.push("peso_g debe ser un entero mayor a 0");
    else limpio.peso_g = d.peso_g;
  }
  for (const campo of ["alto_cm", "ancho_cm", "largo_cm"]) {
    if (d[campo] === undefined) continue;
    if (d[campo] !== null && (!esPositivo(d[campo]) || d[campo] >= 100000)) errores.push(`${campo} debe ser un número mayor a 0`);
    else limpio[campo] = d[campo] === null ? null : Math.round(d[campo] * 10) / 10;
  }

  if (errores.length) throw new HttpError(400, "Datos inválidos", errores);
  return limpio;
};

const validarStockSegunModo = (modo, stock) => {
  if (modo === "fijo" && (stock === null || stock === undefined)) {
    throw new HttpError(400, "Datos inválidos", ["stock es obligatorio en productos de precio fijo"]);
  }
};

const slugUnico = async (nombre, excluirId) => {
  const base = generarSlug(nombre).slice(0, 160).replace(/-+$/, "");
  const existentes = new Set(await Producto.slugsSimilares(base, excluirId));
  if (!existentes.has(base)) return base;
  let n = 2;
  while (existentes.has(`${base}-${n}`)) n++;
  return `${base}-${n}`;
};

const buscarPropio = async (productor, idTexto) => {
  const producto = await Producto.buscarDeProductor(validarId(idTexto), productor.id);
  if (!producto) throw new HttpError(404, "Producto no encontrado en tu taller");
  return producto;
};

const listar = (productor) => Producto.listarDeProductor(productor.id);

const obtener = async (productor, idTexto) => {
  const producto = await buscarPropio(productor, idTexto);
  producto.imagenes = await Imagen.listarDeProducto(producto.id);
  return producto;
};

const crear = async (productor, datos) => {
  const limpio = await validarProducto(datos, false);
  validarStockSegunModo(limpio.modo_venta, limpio.stock);
  limpio.slug = await slugUnico(limpio.nombre);
  const id = await Producto.crear(productor.id, limpio);
  return obtener(productor, id);
};

const actualizar = async (productor, idTexto, datos) => {
  const actual = await buscarPropio(productor, idTexto);
  const limpio = await validarProducto(datos, true);
  if (!Object.keys(limpio).length) throw new HttpError(400, "No enviaste ningún campo para actualizar");

  validarStockSegunModo(
    limpio.modo_venta ?? actual.modo_venta,
    limpio.stock !== undefined ? limpio.stock : actual.stock
  );
  if (limpio.nombre && limpio.nombre !== actual.nombre) {
    limpio.slug = await slugUnico(limpio.nombre, actual.id);
  }

  await Producto.actualizar(actual.id, limpio);
  return obtener(productor, actual.id);
};

const cambiarActivo = async (productor, idTexto, { activo } = {}) => {
  if (typeof activo !== "boolean") throw new HttpError(400, "activo debe ser true o false");
  const actual = await buscarPropio(productor, idTexto);
  await Producto.actualizar(actual.id, { activo });
  return obtener(productor, actual.id);
};

const agregarImagen = async (productor, idTexto, archivo) => {
  const producto = await buscarPropio(productor, idTexto);
  if (!archivo) throw new HttpError(400, "Envía la imagen en el campo 'imagen'");

  const ruta = `${productor.id}/${producto.id}/${crypto.randomUUID()}.${EXTENSIONES[archivo.mimetype]}`;
  let url;
  try {
    url = await storage.subir(ruta, archivo.buffer, archivo.mimetype);
  } catch (err) {
    console.error("Error al subir a Supabase Storage:", err.message);
    throw new HttpError(502, "No se pudo subir la imagen al almacenamiento");
  }
  return Imagen.crear(producto.id, url);
};

const buscarImagenPropia = async (productor, idTexto, imagenIdTexto) => {
  const producto = await buscarPropio(productor, idTexto);
  const imagen = await Imagen.buscar(validarId(imagenIdTexto, "El id de la imagen"), producto.id);
  if (!imagen) throw new HttpError(404, "Imagen no encontrada en este producto");
  return { producto, imagen };
};

const eliminarImagen = async (productor, idTexto, imagenIdTexto) => {
  const { producto, imagen } = await buscarImagenPropia(productor, idTexto, imagenIdTexto);
  await Imagen.eliminar(imagen.id, producto.id);

  const ruta = storage.rutaDesdeUrl(imagen.url);
  if (ruta) {
    await storage.eliminar(ruta).catch((err) => console.error("No se borró del Storage:", err.message));
  }
};

const marcarPrincipal = async (productor, idTexto, imagenIdTexto) => {
  const { producto, imagen } = await buscarImagenPropia(productor, idTexto, imagenIdTexto);
  await Imagen.marcarPrincipal(imagen.id, producto.id);
  return Imagen.listarDeProducto(producto.id);
};

module.exports = {
  listar, obtener, crear, actualizar, cambiarActivo,
  agregarImagen, eliminarImagen, marcarPrincipal,
};
