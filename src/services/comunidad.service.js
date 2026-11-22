// Reglas de negocio de comunidades.
const Comunidad = require("../models/comunidad.model");
const HttpError = require("../utils/HttpError");

// Las 8 regiones de Oaxaca. Cualquier otro valor en ?region= es un error del cliente.
const REGIONES = [
  "Cañada",
  "Costa",
  "Istmo",
  "Mixteca",
  "Papaloapan",
  "Sierra Norte",
  "Sierra Sur",
  "Valles Centrales",
];

const listar = async (region) => {
  if (region && !REGIONES.includes(region)) {
    throw new HttpError(400, "Región no válida", { regiones_validas: REGIONES });
  }
  return Comunidad.listar(region);
};

const obtener = async (idTexto) => {
  const id = Number(idTexto);
  if (!Number.isInteger(id) || id <= 0) {
    throw new HttpError(400, "El id debe ser un número entero positivo");
  }
  const comunidad = await Comunidad.buscarPorId(id);
  if (!comunidad) throw new HttpError(404, "Comunidad no encontrada");
  return comunidad;
};

const listarRegiones = () => Comunidad.listarRegiones();

module.exports = { listar, obtener, listarRegiones, REGIONES };
