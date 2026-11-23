const { Router } = require("express");
const { listar, obtener, listarRegiones, crear, actualizar, eliminar } = require("../controllers/comunidad.controller");
const { autenticar, permitirRoles } = require("../middlewares/auth.middleware");

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
 *   put:
 *     tags: [Comunidades, Administración]
 *     summary: Edita una comunidad (solo admin); solo se cambian los campos enviados
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer }, example: 1 }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/ComunidadEntrada' }
 *           example: { distrito: Centro }
 *     responses:
 *       200:
 *         description: Comunidad actualizada
 *         content:
 *           application/json:
 *             example: { id: 1, nombre: San Bartolo Coyotepec, municipio: San Bartolo Coyotepec, distrito: Centro, region: Valles Centrales }
 *       400:
 *         description: Datos inválidos o cuerpo vacío
 *         content:
 *           application/json:
 *             example: { error: "No enviaste ningún campo para actualizar" }
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
 *         description: No existe una comunidad con ese id
 *         content:
 *           application/json:
 *             example: { error: "Comunidad no encontrada" }
 *       409:
 *         description: Ya hay otra comunidad con ese nombre y municipio
 *         content:
 *           application/json:
 *             example: { error: "Ya existe una comunidad con ese nombre en ese municipio" }
 *   delete:
 *     tags: [Comunidades, Administración]
 *     summary: Borra una comunidad sin talleres (solo admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer }, example: 10 }
 *     responses:
 *       204:
 *         description: Comunidad borrada
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
 *         description: No existe una comunidad con ese id
 *         content:
 *           application/json:
 *             example: { error: "Comunidad no encontrada" }
 *       409:
 *         description: Hay talleres registrados en la comunidad
 *         content:
 *           application/json:
 *             example: { error: "La comunidad está en uso por 2 taller(es); no se puede borrar" }
 */

/**
 * @openapi
 * components:
 *   schemas:
 *     ComunidadEntrada:
 *       type: object
 *       properties:
 *         nombre: { type: string, maxLength: 120, example: Santa María Atzompa }
 *         municipio: { type: string, maxLength: 120, example: Santa María Atzompa }
 *         distrito: { type: string, nullable: true, example: Centro }
 *         region: { type: string, enum: [Cañada, Costa, Istmo, Mixteca, Papaloapan, Sierra Norte, Sierra Sur, Valles Centrales], example: Valles Centrales }
 *
 * /api/comunidades:
 *   post:
 *     tags: [Comunidades, Administración]
 *     summary: Crea una comunidad (solo admin)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             allOf:
 *               - $ref: '#/components/schemas/ComunidadEntrada'
 *               - required: [nombre, municipio, region]
 *     responses:
 *       201:
 *         description: Comunidad creada
 *         content:
 *           application/json:
 *             example: { id: 11, nombre: Santa María Atzompa, municipio: Santa María Atzompa, distrito: Centro, region: Valles Centrales }
 *       400:
 *         description: Datos inválidos
 *         content:
 *           application/json:
 *             example: { error: "Datos inválidos", detalles: ["municipio es obligatorio"] }
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
 *         description: Ya existe esa comunidad
 *         content:
 *           application/json:
 *             example: { error: "Ya existe una comunidad con ese nombre en ese municipio" }
 */
// /regiones va antes de /:id para que Express no lo tome como un id
router.get("/", listar);
router.get("/regiones", listarRegiones);
router.get("/:id", obtener);
router.post("/", autenticar, permitirRoles("admin"), crear);
router.put("/:id", autenticar, permitirRoles("admin"), actualizar);
router.delete("/:id", autenticar, permitirRoles("admin"), eliminar);

module.exports = router;
