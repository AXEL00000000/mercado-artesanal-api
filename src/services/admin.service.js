const Productor = require("../models/productor.model");
const HttpError = require("../utils/HttpError");
const { validarId } = require("../utils/validaciones");

const ESTADOS = ["pendiente", "aprobado", "rechazado"];
const DECISIONES = ["aprobado", "rechazado"];

const listarProductores = async ({ estado } = {}) => {
  if (estado !== undefined && !ESTADOS.includes(estado)) {
    throw new HttpError(400, `estado debe ser uno de: ${ESTADOS.join(", ")}`);
  }
  return Productor.listarParaAdmin(estado);
};

const decidirProductor = async (idTexto, { estado } = {}) => {
  const id = validarId(idTexto);
  if (!DECISIONES.includes(estado)) throw new HttpError(400, "estado debe ser aprobado o rechazado");

  const taller = await Productor.buscarTallerPorId(id);
  if (!taller) throw new HttpError(404, "Taller no encontrado");
  await Productor.cambiarEstado(id, estado);
  return Productor.buscarTallerPorId(id);
};

module.exports = { listarProductores, decidirProductor };
