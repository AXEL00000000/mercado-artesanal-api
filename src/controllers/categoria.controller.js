// Recibe la petición HTTP, llama al servicio y responde.
const categoriaService = require("../services/categoria.service");

const listar = async (req, res) => {
  res.json(await categoriaService.listar());
};

const obtener = async (req, res) => {
  res.json(await categoriaService.obtener(req.params.slug));
};

const crear = async (req, res) => {
  res.status(201).json(await categoriaService.crear(req.body || {}));
};

const actualizar = async (req, res) => {
  res.json(await categoriaService.actualizar(req.params.slug, req.body || {}));
};

const eliminar = async (req, res) => {
  await categoriaService.eliminar(req.params.slug);
  res.status(204).end();
};

module.exports = { listar, obtener, crear, actualizar, eliminar };
