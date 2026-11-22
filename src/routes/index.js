// Registro de todas las rutas de la API. Cada módulo agrega aquí una línea.
const { Router } = require("express");

const router = Router();

router.use("/health", require("./health.routes"));
router.use("/categorias", require("./categorias.routes"));
router.use("/comunidades", require("./comunidades.routes"));

module.exports = router;
