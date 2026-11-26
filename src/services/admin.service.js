const Productor = require("../models/productor.model");
const HttpError = require("../utils/HttpError");
const { validarId, esTextoVacio } = require("../utils/validaciones");

const ESTADOS = ["pendiente", "aprobado", "rechazado"];
const DECISIONES = ["aprobado", "rechazado"];

const listarProductores = async ({ estado } = {}) => {
  if (estado !== undefined && !ESTADOS.includes(estado)) {
    throw new HttpError(400, `estado debe ser uno de: ${ESTADOS.join(", ")}`);
  }
  return Productor.listarParaAdmin(estado);
};

const MOTIVO_MAXIMO = 500;

const decidirProductor = async (idTexto, { estado, motivo } = {}) => {
  const id = validarId(idTexto);
  if (!DECISIONES.includes(estado)) throw new HttpError(400, "estado debe ser aprobado o rechazado");
  if (estado === "rechazado") {
    if (esTextoVacio(motivo)) throw new HttpError(400, "motivo es obligatorio al rechazar un taller");
    if (motivo.trim().length > MOTIVO_MAXIMO) throw new HttpError(400, `motivo no puede pasar de ${MOTIVO_MAXIMO} caracteres`);
  }

  const taller = await Productor.buscarTallerPorId(id);
  if (!taller) throw new HttpError(404, "Taller no encontrado");
  await Productor.cambiarEstado(id, estado, estado === "rechazado" ? motivo.trim() : null);
  return Productor.buscarTallerPorId(id);
};

module.exports = { listarProductores, decidirProductor };
