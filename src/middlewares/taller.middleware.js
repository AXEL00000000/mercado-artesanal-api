const Productor = require("../models/productor.model");
const HttpError = require("../utils/HttpError");

// Carga el taller del usuario en req.productor. Va después de autenticar.
const requiereTaller = async (req, res, next) => {
  const productor = await Productor.buscarPorUsuario(req.usuario.id);
  if (!productor) throw new HttpError(403, "Primero debes registrar tu taller");
  req.productor = productor;
  next();
};

module.exports = { requiereTaller };
