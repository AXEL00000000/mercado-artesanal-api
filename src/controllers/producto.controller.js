const productoService = require("../services/producto.service");

const listar = async (req, res) => {
  res.json(await productoService.listar(req.query));
};

const obtener = async (req, res) => {
  res.json(await productoService.obtener(req.params.slug));
};

module.exports = { listar, obtener };
