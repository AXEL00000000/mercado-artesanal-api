const consultaService = require("../services/consulta.service");

const registrar = async (req, res) => {
  res.status(201).json(await consultaService.registrar(req.body || {}, req.usuario));
};

const listarDeTaller = async (req, res) => {
  res.json(await consultaService.listarDeTaller(req.productor, req.query));
};

module.exports = { registrar, listarDeTaller };
