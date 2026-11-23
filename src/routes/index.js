// Registro de todas las rutas de la API. Cada módulo agrega aquí una línea.
const { Router } = require("express");

const router = Router();

router.use("/health", require("./health.routes"));
router.use("/categorias", require("./categorias.routes"));
router.use("/comunidades", require("./comunidades.routes"));
router.use("/auth", require("./auth.routes"));
router.use("/productos", require("./productos.routes"));
router.use("/productores", require("./productores.routes"));
router.use("/mi-taller", require("./mi-taller.routes"));

module.exports = router;
