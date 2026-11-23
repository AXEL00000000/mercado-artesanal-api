const { Router } = require("express");
const c = require("../controllers/entrega.controller");
const { autenticar } = require("../middlewares/auth.middleware");
const { requiereTaller } = require("../middlewares/taller.middleware");

const router = Router();

/**
 * @openapi
 * tags:
 *   - name: Entregas
 *     description: Formas de entrega de cada taller y cotización de envíos con Envia (sandbox)
 *
 * components:
 *   schemas:
 *     OpcionEntrega:
 *       type: object
 *       properties:
 *         id: { type: integer, example: 3 }
 *         productor_id: { type: integer, example: 2 }
 *         tipo: { type: string, enum: [envia, costo_fijo, recoger_taller], example: costo_fijo }
 *         costo_fijo: { type: number, nullable: true, example: 150 }
 *         instrucciones: { type: string, nullable: true, example: Envío por paquetería local a todo Oaxaca. }
 *         activo: { type: boolean, example: true }
 *     OpcionEntregaEntrada:
 *       type: object
 *       description: costo_fijo es obligatorio en el tipo 'costo_fijo' y no se acepta en los demás. El tipo no se puede cambiar.
 *       properties:
 *         tipo: { type: string, enum: [envia, costo_fijo, recoger_taller], example: costo_fijo }
 *         costo_fijo: { type: number, nullable: true, example: 150 }
 *         instrucciones: { type: string, nullable: true, example: Envío por paquetería local a todo Oaxaca. }
 *         activo: { type: boolean, example: true }
 *
 * /api/mi-taller/opciones-entrega:
 *   get:
 *     tags: [Entregas, Mi taller]
 *     summary: Opciones de entrega del taller, activas e inactivas
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Opciones del taller
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/OpcionEntrega' }
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
 *   post:
 *     tags: [Entregas, Mi taller]
 *     summary: Agrega una opción de entrega (una por tipo)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             allOf:
 *               - $ref: '#/components/schemas/OpcionEntregaEntrada'
 *               - required: [tipo]
 *     responses:
 *       201:
 *         description: Opción creada
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/OpcionEntrega' }
 *       400:
 *         description: Datos inválidos
 *         content:
 *           application/json:
 *             example: { error: "Datos inválidos", detalles: ["costo_fijo es obligatorio y debe ser un número mayor o igual a 0"] }
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
 *       409:
 *         description: El taller ya tiene una opción de ese tipo
 *         content:
 *           application/json:
 *             example: { error: "Ya tienes una opción de entrega de tipo costo_fijo" }
 *
 * /api/mi-taller/opciones-entrega/{id}:
 *   parameters:
 *     - { in: path, name: id, required: true, schema: { type: integer }, example: 3 }
 *   put:
 *     tags: [Entregas, Mi taller]
 *     summary: Edita costo, instrucciones o si está activa; solo se cambian los campos enviados
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/OpcionEntregaEntrada' }
 *           example: { costo_fijo: 180, activo: false }
 *     responses:
 *       200:
 *         description: Opción actualizada
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/OpcionEntrega' }
 *       400:
 *         description: Datos inválidos o cuerpo vacío
 *         content:
 *           application/json:
 *             example: { error: "Datos inválidos", detalles: ["tipo no se puede cambiar; crea otra opción"] }
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
 *       404:
 *         description: No existe o es de otro taller
 *         content:
 *           application/json:
 *             example: { error: "Opción de entrega no encontrada en tu taller" }
 *   delete:
 *     tags: [Entregas, Mi taller]
 *     summary: Borra una opción que no se ha usado en pedidos
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       204:
 *         description: Opción borrada
 *       400:
 *         description: El id no es válido
 *         content:
 *           application/json:
 *             example: { error: "El id debe ser un número entero positivo" }
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
 *       404:
 *         description: No existe o es de otro taller
 *         content:
 *           application/json:
 *             example: { error: "Opción de entrega no encontrada en tu taller" }
 *       409:
 *         description: Ya hay pedidos con esta opción
 *         content:
 *           application/json:
 *             example: { error: "La opción ya se usó en pedidos; desactívala en lugar de borrarla" }
 *
 * /api/productores/{id}/opciones-entrega:
 *   get:
 *     tags: [Entregas, Talleres]
 *     summary: Opciones de entrega activas de un taller aprobado
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer }, example: 2 }
 *     responses:
 *       200:
 *         description: Opciones activas
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/OpcionEntrega' }
 *       400:
 *         description: El id no es válido
 *         content:
 *           application/json:
 *             example: { error: "El id debe ser un número entero positivo" }
 *       404:
 *         description: No existe o no está aprobado
 *         content:
 *           application/json:
 *             example: { error: "Taller no encontrado" }
 *
 * /api/envios/cotizar:
 *   post:
 *     tags: [Entregas]
 *     summary: Cotiza el envío por paquetería con Envia (sandbox), del CP del taller al CP de destino
 *     description: >
 *       Cotiza con FedEx, Estafeta y DHL y devuelve las opciones de la más barata a la más cara.
 *       Los productos deben ser de precio fijo, del mismo taller, con stock y con peso y medidas.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [productor_id, cp_destino, productos]
 *             properties:
 *               productor_id: { type: integer, example: 2 }
 *               cp_destino: { type: string, example: "06700" }
 *               productos:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [producto_id, cantidad]
 *                   properties:
 *                     producto_id: { type: integer, example: 4 }
 *                     cantidad: { type: integer, example: 1 }
 *     responses:
 *       200:
 *         description: Opciones de envío
 *         content:
 *           application/json:
 *             example:
 *               opcion_entrega_id: 5
 *               opciones:
 *                 - { paqueteria: estafeta, servicio: Estafeta Terrestre, costo: 163.72, dias: 3 }
 *                 - { paqueteria: dhl, servicio: DHL Economy, costo: 469.51, dias: 4 }
 *       400:
 *         description: Datos inválidos, el taller no envía por paquetería o faltan medidas
 *         content:
 *           application/json:
 *             example: { error: "Hay productos sin peso o medidas para cotizar el envío", detalles: ["\"Alebrije a pedido\" no tiene peso_g, alto_cm, ancho_cm y largo_cm"] }
 *       404:
 *         description: El taller no existe o no está aprobado
 *         content:
 *           application/json:
 *             example: { error: "Taller no encontrado" }
 *       502:
 *         description: Envia no respondió o no devolvió tarifas
 *         content:
 *           application/json:
 *             example: { error: "No se pudo cotizar el envío con Envia, intenta más tarde" }
 */
router.get("/mi-taller/opciones-entrega", autenticar, requiereTaller, c.listarMias);
router.post("/mi-taller/opciones-entrega", autenticar, requiereTaller, c.crear);
router.put("/mi-taller/opciones-entrega/:id", autenticar, requiereTaller, c.actualizar);
router.delete("/mi-taller/opciones-entrega/:id", autenticar, requiereTaller, c.eliminar);
router.get("/productores/:id/opciones-entrega", c.listarPublicas);
router.post("/envios/cotizar", c.cotizar);

module.exports = router;
