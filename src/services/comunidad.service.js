// Reglas de negocio de comunidades.
const Comunidad = require("../models/comunidad.model");
const HttpError = require("../utils/HttpError");
const { esTextoVacio } = require("../utils/validaciones");

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

const LIMITES = { nombre: 120, municipio: 120, distrito: 120 };

const validarComunidad = (d, parcial) => {
  const errores = [];
  const limpio = {};
  for (const [campo, maximo] of Object.entries(LIMITES)) {
    const obligatorio = campo !== "distrito";
    if (d[campo] === undefined && (parcial || !obligatorio)) continue;
    if (!obligatorio && d[campo] === null) limpio[campo] = null;
    else if (esTextoVacio(d[campo])) errores.push(`${campo} es obligatorio`);
    else if (d[campo].trim().length > maximo) errores.push(`${campo} no puede pasar de ${maximo} caracteres`);
    else limpio[campo] = d[campo].trim();
  }
  if (!parcial || d.region !== undefined) {
    if (!REGIONES.includes(d.region)) errores.push(`region debe ser una de: ${REGIONES.join(", ")}`);
    else limpio.region = d.region;
  }
  if (errores.length) throw new HttpError(400, "Datos inválidos", errores);
  return limpio;
};

const crear = async (datos) => {
  const limpio = validarComunidad(datos, false);
  if (await Comunidad.buscarDuplicada(limpio)) {
    throw new HttpError(409, "Ya existe una comunidad con ese nombre en ese municipio");
  }
  return Comunidad.crear(limpio);
};

const actualizar = async (idTexto, datos) => {
  const actual = await obtener(idTexto);
  const limpio = validarComunidad(datos, true);
  if (!Object.keys(limpio).length) throw new HttpError(400, "No enviaste ningún campo para actualizar");
  const final = { nombre: limpio.nombre ?? actual.nombre, municipio: limpio.municipio ?? actual.municipio };
  if (await Comunidad.buscarDuplicada(final, actual.id)) {
    throw new HttpError(409, "Ya existe una comunidad con ese nombre en ese municipio");
  }
  return Comunidad.actualizar(actual.id, limpio);
};

const eliminar = async (idTexto) => {
  const actual = await obtener(idTexto);
  const total = await Comunidad.contarProductores(actual.id);
  if (total) throw new HttpError(409, `La comunidad está en uso por ${total} taller(es); no se puede borrar`);
  await Comunidad.eliminar(actual.id);
};

module.exports = { listar, obtener, listarRegiones, crear, actualizar, eliminar, REGIONES };
