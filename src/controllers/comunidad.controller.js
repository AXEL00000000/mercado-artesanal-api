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

module.exports = { listar, obtener, listarRegiones };
