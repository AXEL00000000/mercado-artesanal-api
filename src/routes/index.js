// Registro de todas las rutas de la API. Cada módulo agrega aquí una línea.
const { Router } = require("express");

const router = Router();

router.use("/health", require("./health.routes"));

module.exports = router;
