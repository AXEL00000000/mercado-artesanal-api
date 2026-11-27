const entregaService = require("../services/entrega.service");

const listarMias = async (req, res) => {
  res.json(await entregaService.listarMias(req.productor));
};

const crear = async (req, res) => {
  res.status(201).json(await entregaService.crear(req.productor, req.body || {}));
};

const actualizar = async (req, res) => {
  res.json(await entregaService.actualizar(req.productor, req.params.id, req.body || {}));
};

const eliminar = async (req, res) => {
  await entregaService.eliminar(req.productor, req.params.id);
  res.status(204).end();
};

const listarPublicas = async (req, res) => {
  res.json(await entregaService.listarPublicas(req.params.id));
};

const cotizar = async (req, res) => {
  res.json(await entregaService.cotizar(req.body || {}));
};

const buscarCodigoPostal = async (req, res) => {
  res.json(await entregaService.buscarCodigoPostal(req.params.cp));
};

module.exports = { listarMias, crear, actualizar, eliminar, listarPublicas, cotizar, buscarCodigoPostal };
