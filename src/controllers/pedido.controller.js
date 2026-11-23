const pedidoService = require("../services/pedido.service");

const crear = async (req, res) => {
  res.status(201).json(await pedidoService.crear(req.usuario, req.body || {}));
};

const listarMios = async (req, res) => {
  res.json(await pedidoService.listarMios(req.usuario));
};

const obtenerMio = async (req, res) => {
  res.json(await pedidoService.obtenerMio(req.usuario, req.params.id));
};

const crearPago = async (req, res) => {
  res.status(201).json(await pedidoService.crearPago(req.usuario, req.params.id));
};

const webhook = async (req, res) => {
  res.json(await pedidoService.procesarWebhook({ query: req.query, body: req.body, headers: req.headers }));
};

const listarDeTaller = async (req, res) => {
  res.json(await pedidoService.listarDeTaller(req.productor, req.query));
};

const cambiarEstado = async (req, res) => {
  res.json(await pedidoService.cambiarEstado(req.productor, req.params.id, req.body || {}));
};

module.exports = { crear, listarMios, obtenerMio, crearPago, webhook, listarDeTaller, cambiarEstado };
