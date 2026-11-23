const { Router } = require("express");
const { listar, obtener, crear, actualizar, eliminar } = require("../controllers/categoria.controller");
const { autenticar, permitirRoles } = require("../middlewares/auth.middleware");

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
 *   put:
 *     tags: [Categorías, Administración]
 *     summary: Edita una categoría (solo admin); si cambia el nombre y no se envía slug, el slug se regenera
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: slug, required: true, schema: { type: string }, example: textiles }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/CategoriaEntrada' }
 *           example: { descripcion: Telar de pedal y de cintura. }
 *     responses:
 *       200:
 *         description: Categoría actualizada
 *         content:
 *           application/json:
 *             example: { id: 2, nombre: Textiles, slug: textiles, descripcion: Telar de pedal y de cintura. }
 *       400:
 *         description: Datos inválidos o cuerpo vacío
 *         content:
 *           application/json:
 *             example: { error: "Datos inválidos", detalles: ["slug solo admite minúsculas, números y guiones"] }
 *       401:
 *         description: Falta el token o no es válido
 *         content:
 *           application/json:
 *             example: { error: "Falta el token de acceso" }
 *       403:
 *         description: El usuario no es admin
 *         content:
 *           application/json:
 *             example: { error: "No tienes permiso para esta acción" }
 *       404:
 *         description: No existe una categoría con ese slug
 *         content:
 *           application/json:
 *             example: { error: "Categoría no encontrada" }
 *       409:
 *         description: Otra categoría ya usa ese nombre o slug
 *         content:
 *           application/json:
 *             example: { error: "Ya existe la categoría \"Madera\" con ese nombre o slug" }
 *   delete:
 *     tags: [Categorías, Administración]
 *     summary: Borra una categoría sin productos (solo admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: slug, required: true, schema: { type: string }, example: cereria }
 *     responses:
 *       204:
 *         description: Categoría borrada
 *       401:
 *         description: Falta el token o no es válido
 *         content:
 *           application/json:
 *             example: { error: "Falta el token de acceso" }
 *       403:
 *         description: El usuario no es admin
 *         content:
 *           application/json:
 *             example: { error: "No tienes permiso para esta acción" }
 *       404:
 *         description: No existe una categoría con ese slug
 *         content:
 *           application/json:
 *             example: { error: "Categoría no encontrada" }
 *       409:
 *         description: Hay productos en la categoría
 *         content:
 *           application/json:
 *             example: { error: "La categoría está en uso por 3 producto(s); no se puede borrar" }
 */

/**
 * @openapi
 * components:
 *   schemas:
 *     CategoriaEntrada:
 *       type: object
 *       properties:
 *         nombre: { type: string, maxLength: 80, example: Cerería }
 *         slug: { type: string, description: Si no se envía, se genera del nombre, example: cereria }
 *         descripcion: { type: string, nullable: true, example: Velas y figuras de cera escamada. }
 *
 * /api/categorias:
 *   post:
 *     tags: [Categorías, Administración]
 *     summary: Crea una categoría (solo admin)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             allOf:
 *               - $ref: '#/components/schemas/CategoriaEntrada'
 *               - required: [nombre]
 *     responses:
 *       201:
 *         description: Categoría creada
 *         content:
 *           application/json:
 *             example: { id: 12, nombre: Cerería, slug: cereria, descripcion: Velas y figuras de cera escamada. }
 *       400:
 *         description: Datos inválidos
 *         content:
 *           application/json:
 *             example: { error: "Datos inválidos", detalles: ["nombre es obligatorio"] }
 *       401:
 *         description: Falta el token o no es válido
 *         content:
 *           application/json:
 *             example: { error: "Falta el token de acceso" }
 *       403:
 *         description: El usuario no es admin
 *         content:
 *           application/json:
 *             example: { error: "No tienes permiso para esta acción" }
 *       409:
 *         description: Ya existe una categoría con ese nombre o slug
 *         content:
 *           application/json:
 *             example: { error: "Ya existe la categoría \"Cerería\" con ese nombre o slug" }
 */
router.get("/", listar);
router.get("/:slug", obtener);
router.post("/", autenticar, permitirRoles("admin"), crear);
router.put("/:slug", autenticar, permitirRoles("admin"), actualizar);
router.delete("/:slug", autenticar, permitirRoles("admin"), eliminar);

module.exports = router;
