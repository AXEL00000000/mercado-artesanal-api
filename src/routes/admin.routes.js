const { Router } = require("express");
const { listarProductores, decidirProductor } = require("../controllers/admin.controller");
const { autenticar, permitirRoles } = require("../middlewares/auth.middleware");

const router = Router();

/**
 * @openapi
 * tags:
 *   - name: Administración
 *     description: Revisión de talleres y catálogos (solo rol admin)
 *
 * components:
 *   schemas:
 *     TallerAdmin:
 *       allOf:
 *         - $ref: '#/components/schemas/MiTaller'
 *         - type: object
 *           properties:
 *             artesano:
 *               type: object
 *               properties:
 *                 id: { type: integer, example: 6 }
 *                 nombre: { type: string, example: Prueba Artesano }
 *                 email: { type: string, example: artesano@example.com }
 *                 telefono: { type: string, nullable: true, example: "9510000000" }
 *             total_productos: { type: integer, description: Activos e inactivos, example: 4 }
 *
 * /api/admin/productores:
 *   get:
 *     tags: [Administración]
 *     summary: Lista los talleres en cualquier estado, del más antiguo al más nuevo
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: query, name: estado, schema: { type: string, enum: [pendiente, aprobado, rechazado] }, example: pendiente }
 *     responses:
 *       200:
 *         description: Talleres con los datos de contacto del artesano
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/TallerAdmin' }
 *       400:
 *         description: El estado no es válido
 *         content:
 *           application/json:
 *             example: { error: "estado debe ser uno de: pendiente, aprobado, rechazado" }
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
 *
 * /api/admin/productores/{id}:
 *   patch:
 *     tags: [Administración]
 *     summary: Aprueba o rechaza un taller
 *     description: >
 *       Solo los talleres aprobados aparecen en el catálogo público. Al rechazar es obligatorio el motivo,
 *       que el artesano ve en GET /api/mi-taller; al aprobar, el motivo anterior se borra.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer }, example: 4 }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [estado]
 *             properties:
 *               estado: { type: string, enum: [aprobado, rechazado], example: rechazado }
 *               motivo: { type: string, maxLength: 500, description: Obligatorio si estado es rechazado, example: Las fotos del taller no muestran piezas propias. }
 *     responses:
 *       200:
 *         description: Taller con su nuevo estado y motivo_rechazo
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/MiTaller' }
 *             example:
 *               id: 4
 *               nombre_taller: Taller de Prueba
 *               estado_verificacion: rechazado
 *               motivo_rechazo: Las fotos del taller no muestran piezas propias.
 *       400:
 *         description: El estado, el motivo o el id no son válidos
 *         content:
 *           application/json:
 *             examples:
 *               estado:
 *                 value: { error: "estado debe ser aprobado o rechazado" }
 *               sinMotivo:
 *                 value: { error: "motivo es obligatorio al rechazar un taller" }
 *               motivoLargo:
 *                 value: { error: "motivo no puede pasar de 500 caracteres" }
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
 *         description: No existe el taller
 *         content:
 *           application/json:
 *             example: { error: "Taller no encontrado" }
 */
router.use(autenticar, permitirRoles("admin"));

router.get("/productores", listarProductores);
router.patch("/productores/:id", decidirProductor);

module.exports = router;
