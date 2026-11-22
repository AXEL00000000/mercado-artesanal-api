const { Router } = require("express");
const { listar, obtener } = require("../controllers/categoria.controller");

const router = Router();

/**
 * @openapi
 * tags:
 *   - name: Categorías
 *     description: Ramas artesanales según la clasificación de FONART
 *
 * components:
 *   schemas:
 *     Categoria:
 *       type: object
 *       properties:
 *         id: { type: integer, example: 1 }
 *         nombre: { type: string, example: Alfarería y cerámica }
 *         slug: { type: string, example: alfareria-y-ceramica }
 *         descripcion: { type: string, example: Piezas de barro modelado y cocido. }
 *         total_productos: { type: integer, description: Productos activos en la categoría, example: 12 }
 *
 * /api/categorias:
 *   get:
 *     tags: [Categorías]
 *     summary: Lista todas las categorías con su número de productos activos
 *     responses:
 *       200:
 *         description: Lista de categorías ordenada por nombre
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/Categoria' }
 *
 * /api/categorias/{slug}:
 *   get:
 *     tags: [Categorías]
 *     summary: Obtiene una categoría por su slug
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema: { type: string }
 *         example: textiles
 *     responses:
 *       200:
 *         description: La categoría
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Categoria' }
 *       404:
 *         description: No existe una categoría con ese slug
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.get("/", listar);
router.get("/:slug", obtener);

module.exports = router;
