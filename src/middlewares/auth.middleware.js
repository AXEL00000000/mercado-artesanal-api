const jwt = require("jsonwebtoken");
const HttpError = require("../utils/HttpError");

// Verifica el token "Authorization: Bearer <token>" y deja el usuario en req.usuario
const autenticar = (req, res, next) => {
  const [tipo, token] = (req.headers.authorization || "").split(" ");
  if (tipo !== "Bearer" || !token) {
    throw new HttpError(401, "Falta el token de acceso");
  }

  try {
    const datos = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = { id: datos.sub, rol: datos.rol };
    next();
  } catch {
    throw new HttpError(401, "Token inválido o expirado");
  }
};

// Si llega un token válido deja el usuario en req.usuario; si no, sigue sin usuario.
const autenticarOpcional = (req, res, next) => {
  const [tipo, token] = (req.headers.authorization || "").split(" ");
  if (tipo === "Bearer" && token) {
    try {
      const datos = jwt.verify(token, process.env.JWT_SECRET);
      req.usuario = { id: datos.sub, rol: datos.rol };
    } catch {
      req.usuario = undefined;
    }
  }
  next();
};

// Solo deja pasar a los roles indicados. Va después de autenticar.
const permitirRoles = (...roles) => (req, res, next) => {
  if (!roles.includes(req.usuario.rol)) {
    throw new HttpError(403, "No tienes permiso para esta acción");
  }
  next();
};

module.exports = { autenticar, autenticarOpcional, permitirRoles };
