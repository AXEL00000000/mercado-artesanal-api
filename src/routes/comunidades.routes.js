const { Router } = require("express");
const { listar, obtener, listarRegiones } = require("../controllers/comunidad.controller");

const router = Router();

/**
 * @openapi
 * tags:
 *   - name: Comunidades
 *     description: Localidades de Oaxaca de donde son los talleres
 *
 * components:
 *   schemas:
 *     Comunidad:
 *       type: object
 *       properties:
 *         id: { type: integer, example: 1 }
 *         nombre: { type: string, example: San Bartolo Coyotepec }
 *         municipio: { type: string, example: San Bartolo Coyotepec }
 *         distrito: { type: string, example: Centro }
 *         region: { type: string, example: Valles Centrales }
 *         total_productores: { type: integer, description: Talleres aprobados en la comunidad, example: 3 }
 *
 * /api/comunidades:
 *   get:
 *     tags: [Comunidades]
 *     summary: Lista las comunidades, opcionalmente filtradas por región
 *     parameters:
 *       - in: query
 *         name: region
 *         required: false
 *         schema:
 *           type: string
 *           enum: [Cañada, Costa, Istmo, Mixteca, Papaloapan, Sierra Norte, Sierra Sur, Valles Centrales]
 *     responses:
 *       200:
 *         description: Lista de comunidades ordenada por región y nombre
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/Comunidad' }
 *       400:
 *         description: La región no es una de las 8 regiones de Oaxaca
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *
 * /api/comunidades/regiones:
 *   get:
 *     tags: [Comunidades]
 *     summary: Lista las regiones que tienen comunidades registradas
 *     responses:
 *       200:
 *         description: Regiones con su número de comunidades
 *         content:
 *           application/json:
 *             example: [{ region: Istmo, total_comunidades: 1 }, { region: Valles Centrales, total_comunidades: 9 }]
 *
 * /api/comunidades/{id}:
 *   get:
 *     tags: [Comunidades]
 *     summary: Obtiene una comunidad por su id
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *         example: 1
 *     responses:
 *       200:
 *         description: La comunidad
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Comunidad' }
 *       400:
 *         description: El id no es un número válido
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       404:
 *         description: No existe una comunidad con ese id
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
// /regiones va antes de /:id para que Express no lo tome como un id
router.get("/", listar);
router.get("/regiones", listarRegiones);
router.get("/:id", obtener);

module.exports = router;
