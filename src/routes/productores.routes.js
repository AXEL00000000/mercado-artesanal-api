const { Router } = require("express");
const { listar, obtener } = require("../controllers/productor.controller");

const router = Router();

/**
 * @openapi
 * tags:
 *   - name: Talleres
 *     description: Perfiles públicos de los artesanos
 *
 * components:
 *   schemas:
 *     Taller:
 *       type: object
 *       properties:
 *         id: { type: integer, example: 2 }
 *         nombre_taller: { type: string, example: Barro Negro Doña Catalina }
 *         artesano: { type: string, example: Catalina Pérez }
 *         biografia: { type: string, example: Tercera generación de alfareras de barro negro. }
 *         foto_url: { type: string, nullable: true }
 *         whatsapp: { type: string, example: "529511000002" }
 *         comunidad:
 *           type: object
 *           properties:
 *             id: { type: integer, example: 1 }
 *             nombre: { type: string, example: San Bartolo Coyotepec }
 *             municipio: { type: string, example: San Bartolo Coyotepec }
 *             region: { type: string, example: Valles Centrales }
 *         total_productos: { type: integer, example: 4 }
 *
 * /api/productores:
 *   get:
 *     tags: [Talleres]
 *     summary: Lista los talleres aprobados
 *     parameters:
 *       - { in: query, name: comunidad, schema: { type: integer }, description: Id de la comunidad }
 *     responses:
 *       200:
 *         description: Talleres ordenados por nombre
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/Taller' }
 *       400:
 *         description: El id de comunidad no es válido
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *
 * /api/productores/{id}:
 *   get:
 *     tags: [Talleres]
 *     summary: Perfil público de un taller con sus productos
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *         example: 2
 *     responses:
 *       200:
 *         description: El taller y sus productos activos
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Taller'
 *                 - type: object
 *                   properties:
 *                     productos:
 *                       type: array
 *                       items: { $ref: '#/components/schemas/ProductoTarjeta' }
 *       400:
 *         description: El id no es válido
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       404:
 *         description: No existe o no está aprobado
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.get("/", listar);
router.get("/:id", obtener);

module.exports = router;
