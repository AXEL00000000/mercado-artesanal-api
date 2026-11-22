// Reglas de negocio de categorías.
const Categoria = require("../models/categoria.model");
const HttpError = require("../utils/HttpError");

const listar = () => Categoria.listar();

const obtener = async (slug) => {
  const categoria = await Categoria.buscarPorSlug(slug);
  if (!categoria) throw new HttpError(404, "Categoría no encontrada");
  return categoria;
};

module.exports = { listar, obtener };
