// Recibe la petición HTTP, llama al servicio y responde.
const categoriaService = require("../services/categoria.service");

const listar = async (req, res) => {
  res.json(await categoriaService.listar());
};

const obtener = async (req, res) => {
  res.json(await categoriaService.obtener(req.params.slug));
};

module.exports = { listar, obtener };
