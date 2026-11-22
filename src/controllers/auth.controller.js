const authService = require("../services/auth.service");

const registrar = async (req, res) => {
  res.status(201).json(await authService.registrar(req.body || {}));
};

const login = async (req, res) => {
  res.json(await authService.login(req.body || {}));
};

const perfil = async (req, res) => {
  res.json(await authService.perfil(req.usuario.id));
};

module.exports = { registrar, login, perfil };
