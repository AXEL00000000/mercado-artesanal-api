// Manejo central de errores. Express 5 manda aquí también los errores
// de funciones async, así que los controladores no necesitan try/catch.

const HttpError = require("../utils/HttpError");

// Errores de PostgreSQL que vienen de las reglas del esquema (db/schema.sql)
const ERRORES_PG = {
  "23505": { status: 409, mensaje: "Ya existe un registro con ese valor" },          // UNIQUE
  "23503": { status: 409, mensaje: "El registro relacionado no existe o está en uso" }, // FOREIGN KEY
  "23514": { status: 400, mensaje: "Los datos no cumplen las reglas de la base" },   // CHECK
  "23502": { status: 400, mensaje: "Falta un dato obligatorio" },                     // NOT NULL
  "22P02": { status: 400, mensaje: "Formato de dato inválido" },                       // tipo inválido
};

const noEncontrado = (req, res) => {
  res.status(404).json({ error: `No existe la ruta ${req.method} ${req.originalUrl}` });
};

// eslint-disable-next-line no-unused-vars
const manejarErrores = (err, req, res, next) => {
  // JSON mal formado en el body
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ error: "El cuerpo de la petición no es un JSON válido" });
  }

  const pg = ERRORES_PG[err.code];
  if (pg) {
    return res.status(pg.status).json({ error: pg.mensaje, detalle: err.constraint || err.column });
  }

  const status = err.status || 500;
  const esPropio = err instanceof HttpError;
  if (status >= 500 && !esPropio) console.error(err);

  res.status(status).json({
    error: status >= 500 && !esPropio ? "Error interno del servidor" : err.message,
    ...(err.detalles && { detalles: err.detalles }),
  });
};

module.exports = { noEncontrado, manejarErrores };
