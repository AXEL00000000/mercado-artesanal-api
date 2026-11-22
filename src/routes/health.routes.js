const { Router } = require("express");
const { revisar } = require("../controllers/health.controller");

const router = Router();

/**
 * @openapi
 * tags:
 *   - name: Sistema
 *     description: Estado del servicio
 *
 * /api/health:
 *   get:
 *     tags: [Sistema]
 *     summary: Revisa que la API y la base de datos respondan
 *     responses:
 *       200:
 *         description: Todo en orden
 *         content:
 *           application/json:
 *             example: { status: ok, db: ok }
 *       503:
 *         description: La API responde pero la base de datos no
 *         content:
 *           application/json:
 *             example: { status: ok, db: error }
 */
router.get("/", revisar);

module.exports = router;
