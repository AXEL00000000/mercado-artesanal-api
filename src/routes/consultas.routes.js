const { Router } = require("express");
const { registrar, listarDeTaller } = require("../controllers/consulta.controller");
const { autenticar, autenticarOpcional } = require("../middlewares/auth.middleware");
const { requiereTaller } = require("../middlewares/taller.middleware");

const router = Router();

/**
 * @openapi
 * tags:
 *   - name: Consultas
 *     description: Clics a WhatsApp desde la ficha de un producto
 *
 * /api/consultas:
 *   post:
 *     tags: [Consultas]
 *     summary: Registra una consulta y devuelve el enlace de WhatsApp con el mensaje prellenado
 *     description: >
 *       El token es opcional; si llega y es válido, la consulta queda ligada al usuario.
 *       'boton_tratar' solo aplica a productos con modo_venta 'tratar'.
 *     security:
 *       - {}
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [producto_id, origen, canal]
 *             properties:
 *               producto_id: { type: integer, example: 1 }
 *               origen: { type: string, enum: [boton_tratar, link_dudas], example: boton_tratar }
 *               canal: { type: string, enum: [web, app], example: web }
 *     responses:
 *       201:
 *         description: Consulta registrada
 *         content:
 *           application/json:
 *             example:
 *               id: 7
 *               producto_id: 1
 *               origen: boton_tratar
 *               canal: web
 *               created_at: "2026-11-22T18:30:00.000Z"
 *               whatsapp_url: https://wa.me/529511000001?text=Hola%2C%20me%20interesa%20%22Tapete%20de%20grana%20cochinilla%22...
 *       400:
 *         description: Datos inválidos
 *         content:
 *           application/json:
 *             example: { error: "Datos inválidos", detalles: ["origen debe ser uno de: boton_tratar, link_dudas"] }
 *       404:
 *         description: El producto no existe o no está disponible
 *         content:
 *           application/json:
 *             example: { error: "Producto no encontrado" }
 *
 * /api/mi-taller/consultas:
 *   get:
 *     tags: [Consultas, Mi taller]
 *     summary: Consultas recibidas en los productos del taller, con el conteo por producto
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: query, name: producto_id, schema: { type: integer }, description: Filtra la lista de consultas por producto }
 *       - { in: query, name: limite, schema: { type: integer, default: 50, maximum: 200 }, description: Cuántas consultas recientes devolver }
 *     responses:
 *       200:
 *         description: Totales y consultas recientes
 *         content:
 *           application/json:
 *             example:
 *               total: 3
 *               por_producto:
 *                 - { producto_id: 1, nombre: Tapete de grana cochinilla, slug: tapete-de-grana-cochinilla, total: 2, boton_tratar: 2, link_dudas: 0, ultima: "2026-11-22T18:30:00.000Z" }
 *                 - { producto_id: 2, nombre: Camino de mesa de lana, slug: camino-de-mesa-de-lana, total: 1, boton_tratar: 0, link_dudas: 1, ultima: "2026-11-21T10:00:00.000Z" }
 *               consultas:
 *                 - id: 7
 *                   origen: boton_tratar
 *                   canal: web
 *                   created_at: "2026-11-22T18:30:00.000Z"
 *                   producto: { id: 1, nombre: Tapete de grana cochinilla }
 *                   usuario: { id: 4, nombre: Marisol Fuentes }
 *       400:
 *         description: Algún filtro no es válido
 *         content:
 *           application/json:
 *             example: { error: "limite no puede ser mayor a 200" }
 *       401:
 *         description: Falta el token o no es válido
 *         content:
 *           application/json:
 *             example: { error: "Falta el token de acceso" }
 *       403:
 *         description: El usuario no tiene taller
 *         content:
 *           application/json:
 *             example: { error: "Primero debes registrar tu taller" }
 */
router.post("/consultas", autenticarOpcional, registrar);
router.get("/mi-taller/consultas", autenticar, requiereTaller, listarDeTaller);

module.exports = router;
