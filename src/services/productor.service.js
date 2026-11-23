const Productor = require("../models/productor.model");
const Producto = require("../models/producto.model");
const HttpError = require("../utils/HttpError");

const validarId = (texto, campo) => {
  const id = Number(texto);
  if (!Number.isInteger(id) || id <= 0) {
    throw new HttpError(400, `${campo} debe ser un número entero positivo`);
  }
  return id;
};

const listar = async (comunidad) => {
  return Productor.listar(comunidad === undefined ? null : validarId(comunidad, "comunidad"));
};

// Perfil público del taller con sus productos activos
const obtener = async (idTexto) => {
  const id = validarId(idTexto, "El id");
  const productor = await Productor.buscarPorId(id);
  if (!productor) throw new HttpError(404, "Taller no encontrado");

  const { productos } = await Producto.listar({ productor: id, orden: "recientes", limite: 100, offset: 0 });
  return { ...productor, productos };
};

module.exports = { listar, obtener };
