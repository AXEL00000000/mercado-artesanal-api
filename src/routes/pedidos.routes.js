const { Router } = require("express");
const c = require("../controllers/pedido.controller");
const { autenticar } = require("../middlewares/auth.middleware");
const { requiereTaller } = require("../middlewares/taller.middleware");

const router = Router();

/**
 * @openapi
 * tags:
 *   - name: Pedidos
 *     description: Compras de productos de precio fijo y pagos con Mercado Pago (sandbox)
 *
 * components:
 *   schemas:
 *     Pedido:
 *       type: object
 *       properties:
 *         id: { type: integer, example: 12 }
 *         estado: { type: string, enum: [pendiente_pago, pagado, enviado, entregado, cancelado], example: pendiente_pago }
 *         estado_pago: { type: string, nullable: true, enum: [pendiente, aprobado, rechazado, reembolsado], example: null }
 *         subtotal: { type: number, example: 2560 }
 *         costo_envio: { type: number, example: 150 }
 *         total: { type: number, example: 2710 }
 *         nota: { type: string, nullable: true, example: Envolver para regalo }
 *         productor:
 *           type: object
 *           properties:
 *             id: { type: integer, example: 2 }
 *             nombre_taller: { type: string, example: Barro Negro Doña Catalina }
 *         comprador:
 *           type: object
 *           properties:
 *             id: { type: integer, example: 4 }
 *             nombre: { type: string, example: Marisol Fuentes }
 *             email: { type: string, example: marisol@example.com }
 *         envio:
 *           type: object
 *           properties:
 *             tipo: { type: string, enum: [envia, costo_fijo, recoger_taller], example: costo_fijo }
 *             opcion_entrega_id: { type: integer, example: 1 }
 *             costo: { type: number, example: 150 }
 *             paqueteria: { type: string, nullable: true, example: null }
 *             servicio: { type: string, nullable: true, example: null }
 *             destinatario: { type: string, nullable: true, example: Marisol Fuentes }
 *             telefono: { type: string, nullable: true, example: "9511000003" }
 *             calle: { type: string, nullable: true, example: Calle Hidalgo 20 }
 *             colonia: { type: string, nullable: true, example: Centro }
 *             ciudad: { type: string, nullable: true, example: Oaxaca de Juárez }
 *             entidad_federativa: { type: string, nullable: true, example: Oaxaca }
 *             cp: { type: string, nullable: true, example: "68000" }
 *             guia: { type: string, nullable: true, example: null }
 *             tracking_url: { type: string, nullable: true, example: null }
 *             estado_envio: { type: string, enum: [pendiente, guia_generada, en_transito, entregado], example: pendiente }
 *         productos:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               producto_id: { type: integer, example: 4 }
 *               nombre_producto: { type: string, example: Cántaro de barro negro }
 *               cantidad: { type: integer, example: 1 }
 *               precio_unitario: { type: number, example: 1200 }
 *               subtotal: { type: number, example: 1200 }
 *               imagen: { type: string, nullable: true }
 *         created_at: { type: string, format: date-time }
 *         updated_at: { type: string, format: date-time }
 *
 * /api/pedidos:
 *   post:
 *     tags: [Pedidos]
 *     summary: Crea un pedido de un solo taller a partir del carrito
 *     description: >
 *       Los productos deben ser del mismo taller, de precio fijo, activos y con stock. Nombre y precio se copian
 *       al detalle. En 'recoger_taller' no se pide dirección; en 'costo_fijo' y 'envia' sí. En 'envia' se vuelve
 *       a cotizar y se usa el costo de la paquetería y servicio elegidos en /api/envios/cotizar.
 *       El stock se descuenta hasta que el pago queda aprobado.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [productor_id, productos, opcion_entrega_id]
 *             properties:
 *               productor_id: { type: integer, example: 2 }
 *               productos:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [producto_id, cantidad]
 *                   properties:
 *                     producto_id: { type: integer, example: 4 }
 *                     cantidad: { type: integer, example: 1 }
 *               opcion_entrega_id: { type: integer, example: 1 }
 *               envio:
 *                 type: object
 *                 properties:
 *                   destinatario: { type: string, example: Marisol Fuentes }
 *                   telefono: { type: string, example: "9511000003" }
 *                   calle: { type: string, example: Calle Hidalgo 20 }
 *                   colonia: { type: string, example: Centro }
 *                   ciudad: { type: string, example: Oaxaca de Juárez }
 *                   entidad_federativa: { type: string, example: Oaxaca }
 *                   cp: { type: string, example: "68000" }
 *                   paqueteria: { type: string, description: Solo en 'envia', example: estafeta }
 *                   servicio: { type: string, description: Solo en 'envia', example: Estafeta Terrestre }
 *               nota: { type: string, nullable: true, example: Envolver para regalo }
 *     responses:
 *       201:
 *         description: Pedido creado en pendiente_pago
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Pedido' }
 *       400:
 *         description: Datos inválidos o productos que no se pueden comprar
 *         content:
 *           application/json:
 *             example: { error: "Hay productos que no se pueden comprar", detalles: ["\"Camino de mesa de lana\" es de otro taller; un pedido es de un solo taller"] }
 *       401:
 *         description: Falta el token o no es válido
 *         content:
 *           application/json:
 *             example: { error: "Falta el token de acceso" }
 *       404:
 *         description: El taller no existe o no está aprobado
 *         content:
 *           application/json:
 *             example: { error: "Taller no encontrado" }
 *       409:
 *         description: Otro comprador se llevó el stock al mismo tiempo
 *         content:
 *           application/json:
 *             example: { error: "Algunos productos se agotaron mientras hacías tu pedido", detalles: ["Cántaro de barro negro"] }
 *       502:
 *         description: Envia no respondió al recotizar
 *         content:
 *           application/json:
 *             example: { error: "No se pudo cotizar el envío con Envia, intenta más tarde" }
 *   get:
 *     tags: [Pedidos]
 *     summary: Mis compras, de la más reciente a la más antigua
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Pedidos del usuario
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/Pedido' }
 *       401:
 *         description: Falta el token o no es válido
 *         content:
 *           application/json:
 *             example: { error: "Falta el token de acceso" }
 *
 * /api/pedidos/{id}:
 *   get:
 *     tags: [Pedidos]
 *     summary: Detalle de una compra propia
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer }, example: 12 }
 *     responses:
 *       200:
 *         description: El pedido
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Pedido' }
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
 *       404:
 *         description: No existe o es de otro comprador
 *         content:
 *           application/json:
 *             example: { error: "Pedido no encontrado" }
 *
 * /api/pedidos/{id}/pago:
 *   post:
 *     tags: [Pedidos]
 *     summary: Devuelve la URL de pago de Mercado Pago (Checkout Pro vía Orders), sin crear cobros duplicados
 *     description: >
 *       Si el pedido ya tiene un PAGO pendiente cuya order sigue abierta y tiene menos de 24 horas, devuelve esa
 *       misma checkout_url con reutilizado true. Si la order venció, se cancela en Mercado Pago y se crea otra.
 *       Si la order ya se pagó, se aplica el pago y responde 409. Una order nueva se registra como PAGO 'pendiente'
 *       con su id en mp_preference_id y vence en 1 día. El comprador se redirige a checkout_url y al terminar regresa
 *       a FRONT_URL/pedidos/{id}?pago=aprobado|rechazado|pendiente.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer }, example: 12 }
 *     responses:
 *       201:
 *         description: Order nueva o reutilizada
 *         content:
 *           application/json:
 *             example:
 *               pago_id: 5
 *               pedido_id: 12
 *               mp_order_id: ORDTST01KS5AJ6HTK2HRQ3XJ3C2JCKP9
 *               estado: pendiente
 *               checkout_url: https://www.mercadopago.com.mx/checkout/v1/redirect?order_id=ORDTST01KS5AJ6HTK2HRQ3XJ3C2JCKP9
 *               reutilizado: false
 *       401:
 *         description: Falta el token o no es válido
 *         content:
 *           application/json:
 *             example: { error: "Falta el token de acceso" }
 *       404:
 *         description: No existe o es de otro comprador
 *         content:
 *           application/json:
 *             example: { error: "Pedido no encontrado" }
 *       409:
 *         description: El pedido ya no se puede pagar, ya se pagó o tiene un pago en proceso
 *         content:
 *           application/json:
 *             examples:
 *               noPendiente:
 *                 value: { error: "El pedido ya no se puede pagar; está cancelado" }
 *               yaPagado:
 *                 value: { error: "El pedido ya fue pagado" }
 *               enProceso:
 *                 value: { error: "Ya hay un pago en proceso para este pedido; espera la confirmación de Mercado Pago" }
 *       502:
 *         description: Mercado Pago no respondió al crear, consultar o cancelar la order
 *         content:
 *           application/json:
 *             example: { error: "No se pudo iniciar el pago con Mercado Pago, intenta más tarde" }
 *
 * /api/pagos/webhook:
 *   post:
 *     tags: [Pedidos]
 *     summary: Notificación de Mercado Pago (tópico order)
 *     description: >
 *       Consulta la order en Mercado Pago y actualiza el PAGO. Si quedó aprobada, el pedido pasa a 'pagado' y se
 *       descuenta el stock en una transacción. Repetir la misma notificación no vuelve a descontar.
 *       Si MP_WEBHOOK_SECRET está configurada, se valida el header x-signature.
 *     parameters:
 *       - { in: query, name: data.id, schema: { type: string }, example: ORDTST01KS5AJ6HTK2HRQ3XJ3C2JCKP9 }
 *       - { in: query, name: type, schema: { type: string }, example: order }
 *     requestBody:
 *       content:
 *         application/json:
 *           example: { action: order.processed, type: order, data: { id: ORDTST01KS5AJ6HTK2HRQ3XJ3C2JCKP9 } }
 *     responses:
 *       200:
 *         description: Notificación procesada o ignorada
 *         content:
 *           application/json:
 *             example: { recibido: true, aplicado: true, estado: aprobado }
 *       401:
 *         description: La firma no coincide
 *         content:
 *           application/json:
 *             example: { error: "Firma de Mercado Pago inválida" }
 *       502:
 *         description: No se pudo consultar la order; Mercado Pago reintentará
 *         content:
 *           application/json:
 *             example: { error: "No se pudo consultar la order en Mercado Pago" }
 *
 * /api/mi-taller/pedidos:
 *   get:
 *     tags: [Pedidos, Mi taller]
 *     summary: Ventas del taller
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: query, name: estado, schema: { type: string, enum: [pendiente_pago, pagado, enviado, entregado, cancelado] } }
 *     responses:
 *       200:
 *         description: Pedidos del taller
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/Pedido' }
 *       400:
 *         description: El estado no es válido
 *         content:
 *           application/json:
 *             example: { error: "estado debe ser uno de: pendiente_pago, pagado, enviado, entregado, cancelado" }
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
 *
 * /api/mi-taller/pedidos/{id}:
 *   patch:
 *     tags: [Pedidos, Mi taller]
 *     summary: Cambia el estado de una venta (pagado → enviado → entregado, o cancelado)
 *     description: >
 *       Se puede cancelar un pedido pendiente de pago o pagado; si estaba pagado, el stock se regresa.
 *       Al pasar a 'entregado' la liquidación al artesano se marca como hecha (simulada).
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer }, example: 12 }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [estado]
 *             properties:
 *               estado: { type: string, enum: [enviado, entregado, cancelado], example: enviado }
 *               guia: { type: string, description: Solo al pasar a enviado, example: "7701234567" }
 *               tracking_url: { type: string, description: Solo al pasar a enviado, example: https://www.estafeta.com/rastreo }
 *     responses:
 *       200:
 *         description: Pedido actualizado
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Pedido' }
 *       400:
 *         description: Datos inválidos
 *         content:
 *           application/json:
 *             example: { error: "Datos inválidos", detalles: ["guia y tracking_url solo se envían al pasar a enviado"] }
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
 *             example: { error: "Pedido no encontrado en tu taller" }
 *       409:
 *         description: El cambio de estado no está permitido
 *         content:
 *           application/json:
 *             example: { error: "Un pedido pendiente_pago no puede pasar a enviado" }
 */
router.post("/pedidos", autenticar, c.crear);
router.get("/pedidos", autenticar, c.listarMios);
router.get("/pedidos/:id", autenticar, c.obtenerMio);
router.post("/pedidos/:id/pago", autenticar, c.crearPago);
router.post("/pagos/webhook", c.webhook);
router.get("/mi-taller/pedidos", autenticar, requiereTaller, c.listarDeTaller);
router.patch("/mi-taller/pedidos/:id", autenticar, requiereTaller, c.cambiarEstado);

module.exports = router;
