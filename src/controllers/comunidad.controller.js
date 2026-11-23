// Recibe la petición HTTP, llama al servicio y responde.
const comunidadService = require("../services/comunidad.service");

const listar = async (req, res) => {
  res.json(await comunidadService.listar(req.query.region));
};

const obtener = async (req, res) => {
  res.json(await comunidadService.obtener(req.params.id));
};

const listarRegiones = async (req, res) => {
  res.json(await comunidadService.listarRegiones());
};

const crear = async (req, res) => {
  res.status(201).json(await comunidadService.crear(req.body || {}));
};

const actualizar = async (req, res) => {
  res.json(await comunidadService.actualizar(req.params.id, req.body || {}));
};

const eliminar = async (req, res) => {
  await comunidadService.eliminar(req.params.id);
  res.status(204).end();
};

module.exports = { listar, obtener, listarRegiones, crear, actualizar, eliminar };
