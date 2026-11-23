const productorService = require("../services/productor.service");

const listar = async (req, res) => {
  res.json(await productorService.listar(req.query.comunidad));
};

const obtener = async (req, res) => {
  res.json(await productorService.obtener(req.params.id));
};

module.exports = { listar, obtener };
