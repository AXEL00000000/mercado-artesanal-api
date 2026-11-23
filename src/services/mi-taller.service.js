const Productor = require("../models/productor.model");
const Comunidad = require("../models/comunidad.model");
const HttpError = require("../utils/HttpError");
const { esEnteroPositivo, esTextoVacio } = require("../utils/validaciones");

const WHATSAPP_VALIDO = /^[0-9]{10,15}$/;
const CP_VALIDO = /^[0-9]{5}$/;
const URL_VALIDA = /^https?:\/\/\S+$/;

// En modo parcial solo se validan los campos que llegan
const validarTaller = async (d, parcial) => {
  const errores = [];
  const llega = (campo) => !parcial || d[campo] !== undefined;
  const limpio = {};

  if (llega("comunidad_id")) {
    if (!esEnteroPositivo(d.comunidad_id)) errores.push("comunidad_id debe ser un número entero positivo");
    else if (!(await Comunidad.buscarPorId(d.comunidad_id))) errores.push("comunidad_id no existe");
    else limpio.comunidad_id = d.comunidad_id;
  }
  if (llega("nombre_taller")) {
    if (esTextoVacio(d.nombre_taller)) errores.push("nombre_taller es obligatorio");
    else if (d.nombre_taller.trim().length > 120) errores.push("nombre_taller no puede pasar de 120 caracteres");
    else limpio.nombre_taller = d.nombre_taller.trim();
  }
  if (llega("whatsapp")) {
    if (typeof d.whatsapp !== "string" || !WHATSAPP_VALIDO.test(d.whatsapp)) {
      errores.push("whatsapp debe tener solo dígitos con lada (10 a 15), por ejemplo 529511234567");
    } else limpio.whatsapp = d.whatsapp;
  }
  if (llega("direccion_taller")) {
    if (esTextoVacio(d.direccion_taller)) errores.push("direccion_taller es obligatoria");
    else limpio.direccion_taller = d.direccion_taller.trim();
  }
  if (llega("cp_taller")) {
    if (typeof d.cp_taller !== "string" || !CP_VALIDO.test(d.cp_taller)) errores.push("cp_taller debe tener 5 dígitos");
    else limpio.cp_taller = d.cp_taller;
  }
  if (d.biografia !== undefined) {
    if (d.biografia !== null && typeof d.biografia !== "string") errores.push("biografia debe ser texto");
    else limpio.biografia = d.biografia ? d.biografia.trim() : null;
  }
  if (d.foto_url !== undefined) {
    if (d.foto_url !== null && (typeof d.foto_url !== "string" || !URL_VALIDA.test(d.foto_url))) {
      errores.push("foto_url debe ser una URL http(s)");
    } else limpio.foto_url = d.foto_url || null;
  }

  if (errores.length) throw new HttpError(400, "Datos inválidos", errores);
  return limpio;
};

const crear = async (usuarioId, datos) => {
  if (await Productor.buscarPorUsuario(usuarioId)) {
    throw new HttpError(409, "Ya tienes un taller registrado");
  }
  const limpio = await validarTaller(datos, false);
  await Productor.crear(usuarioId, limpio);
  return Productor.buscarPorUsuario(usuarioId);
};

const actualizar = async (productor, datos) => {
  const limpio = await validarTaller(datos, true);
  if (!Object.keys(limpio).length) throw new HttpError(400, "No enviaste ningún campo para actualizar");
  await Productor.actualizar(productor.id, limpio);
  return Productor.buscarPorUsuario(productor.usuario_id);
};

module.exports = { crear, actualizar };
