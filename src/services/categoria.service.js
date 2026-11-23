// Reglas de negocio de categorías.
const Categoria = require("../models/categoria.model");
const HttpError = require("../utils/HttpError");
const { esTextoVacio, generarSlug } = require("../utils/validaciones");

const listar = () => Categoria.listar();

const obtener = async (slug) => {
  const categoria = await Categoria.buscarPorSlug(slug);
  if (!categoria) throw new HttpError(404, "Categoría no encontrada");
  return categoria;
};

const validarCategoria = (d, parcial) => {
  const errores = [];
  const limpio = {};
  if (!parcial || d.nombre !== undefined) {
    if (esTextoVacio(d.nombre)) errores.push("nombre es obligatorio");
    else if (d.nombre.trim().length > 80) errores.push("nombre no puede pasar de 80 caracteres");
    else limpio.nombre = d.nombre.trim();
  }
  if (d.slug !== undefined) {
    if (typeof d.slug !== "string" || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(d.slug) || d.slug.length > 80) {
      errores.push("slug solo admite minúsculas, números y guiones");
    } else limpio.slug = d.slug;
  } else if (limpio.nombre) {
    limpio.slug = generarSlug(limpio.nombre).slice(0, 80);
  }
  if (d.descripcion !== undefined) {
    if (d.descripcion !== null && typeof d.descripcion !== "string") errores.push("descripcion debe ser texto");
    else limpio.descripcion = d.descripcion && d.descripcion.trim() ? d.descripcion.trim() : null;
  }
  if (errores.length) throw new HttpError(400, "Datos inválidos", errores);
  return limpio;
};

const revisarDuplicada = async (datos, excluirId) => {
  const otra = await Categoria.buscarDuplicada(datos, excluirId);
  if (otra) throw new HttpError(409, `Ya existe la categoría "${otra.nombre}" con ese nombre o slug`);
};

const crear = async (datos) => {
  const limpio = validarCategoria(datos, false);
  await revisarDuplicada(limpio);
  return Categoria.crear(limpio);
};

const actualizar = async (slug, datos) => {
  const actual = await obtener(slug);
  const limpio = validarCategoria(datos, true);
  if (!Object.keys(limpio).length) throw new HttpError(400, "No enviaste ningún campo para actualizar");
  await revisarDuplicada(limpio, actual.id);
  return Categoria.actualizar(actual.id, limpio);
};

const eliminar = async (slug) => {
  const actual = await obtener(slug);
  const total = await Categoria.contarProductos(actual.id);
  if (total) throw new HttpError(409, `La categoría está en uso por ${total} producto(s); no se puede borrar`);
  await Categoria.eliminar(actual.id);
};

module.exports = { listar, obtener, crear, actualizar, eliminar };
