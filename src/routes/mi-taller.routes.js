const { Router } = require("express");
const c = require("../controllers/mi-taller.controller");
const { autenticar } = require("../middlewares/auth.middleware");
const { requiereTaller } = require("../middlewares/taller.middleware");
const { subirImagen } = require("../middlewares/upload.middleware");

const router = Router();

/**
 * @openapi
 * tags:
 *   - name: Mi taller
 *     description: Panel del artesano para su taller, sus productos y sus fotos
 *
 * components:
 *   schemas:
 *     MiTaller:
 *       type: object
 *       properties:
 *         id: { type: integer, example: 2 }
 *         usuario_id: { type: integer, example: 3 }
 *         nombre_taller: { type: string, example: Barro Negro Doña Catalina }
 *         biografia: { type: string, nullable: true, example: Tercera generación de alfareras de barro negro. }
 *         foto_url: { type: string, nullable: true, example: null }
 *         whatsapp: { type: string, example: "529511000002" }
 *         direccion_taller: { type: string, example: Calle Benito Juárez 5, San Bartolo Coyotepec }
 *         cp_taller: { type: string, example: "71256" }
 *         estado_verificacion: { type: string, enum: [pendiente, aprobado, rechazado], example: aprobado }
 *         comunidad:
 *           type: object
 *           properties:
 *             id: { type: integer, example: 1 }
 *             nombre: { type: string, example: San Bartolo Coyotepec }
 *             municipio: { type: string, example: San Bartolo Coyotepec }
 *             region: { type: string, example: Valles Centrales }
 *         created_at: { type: string, format: date-time }
 *     TallerEntrada:
 *       type: object
 *       properties:
 *         comunidad_id: { type: integer, example: 1 }
 *         nombre_taller: { type: string, maxLength: 120, example: Barro Negro Doña Catalina }
 *         biografia: { type: string, nullable: true, example: Tercera generación de alfareras de barro negro. }
 *         foto_url: { type: string, nullable: true, example: https://ejemplo.com/taller.jpg }
 *         whatsapp: { type: string, description: Solo dígitos con lada, example: "529511000002" }
 *         direccion_taller: { type: string, example: Calle Benito Juárez 5, San Bartolo Coyotepec }
 *         cp_taller: { type: string, example: "71256" }
 *     ImagenProducto:
 *       type: object
 *       properties:
 *         id: { type: integer, example: 14 }
 *         url: { type: string, example: https://xxxx.supabase.co/storage/v1/object/public/productos/2/4/8c1f.jpg }
 *         orden: { type: integer, example: 0 }
 *         es_principal: { type: boolean, example: true }
 *     MiProducto:
 *       type: object
 *       properties:
 *         id: { type: integer, example: 4 }
 *         nombre: { type: string, example: Cántaro de barro negro }
 *         slug: { type: string, example: cantaro-de-barro-negro }
 *         descripcion: { type: string, nullable: true, example: Modelado a mano y bruñido con piedra de cuarzo. }
 *         modo_venta: { type: string, enum: [fijo, tratar], example: fijo }
 *         precio: { type: number, example: 1200 }
 *         stock: { type: integer, nullable: true, example: 4 }
 *         material: { type: string, nullable: true, example: Barro de Coyotepec }
 *         tecnica: { type: string, nullable: true, example: Bruñido }
 *         peso_g: { type: integer, nullable: true, example: 2500 }
 *         medidas_cm:
 *           type: object
 *           properties:
 *             alto: { type: number, nullable: true, example: 32 }
 *             ancho: { type: number, nullable: true, example: 22 }
 *             largo: { type: number, nullable: true, example: 22 }
 *         activo: { type: boolean, example: true }
 *         categoria:
 *           type: object
 *           properties:
 *             id: { type: integer, example: 1 }
 *             slug: { type: string, example: alfareria-y-ceramica }
 *             nombre: { type: string, example: Alfarería y cerámica }
 *         imagenes:
 *           type: array
 *           items: { $ref: '#/components/schemas/ImagenProducto' }
 *         created_at: { type: string, format: date-time }
 *         updated_at: { type: string, format: date-time }
 *     ProductoEntrada:
 *       type: object
 *       description: En productos 'fijo' el stock es obligatorio; en 'tratar' stock null significa sobre pedido.
 *       properties:
 *         categoria_id: { type: integer, example: 1 }
 *         nombre: { type: string, maxLength: 150, example: Cántaro de barro negro }
 *         descripcion: { type: string, nullable: true, example: Modelado a mano y bruñido con piedra de cuarzo. }
 *         modo_venta: { type: string, enum: [fijo, tratar], example: fijo }
 *         precio: { type: number, example: 1200 }
 *         stock: { type: integer, nullable: true, example: 4 }
 *         material: { type: string, nullable: true, example: Barro de Coyotepec }
 *         tecnica: { type: string, nullable: true, example: Bruñido }
 *         peso_g: { type: integer, nullable: true, example: 2500 }
 *         alto_cm: { type: number, nullable: true, example: 32 }
 *         ancho_cm: { type: number, nullable: true, example: 22 }
 *         largo_cm: { type: number, nullable: true, example: 22 }
 *
 * /api/mi-taller:
 *   post:
 *     tags: [Mi taller]
 *     summary: Registra el taller del usuario (queda pendiente de aprobación)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             allOf:
 *               - $ref: '#/components/schemas/TallerEntrada'
 *               - required: [comunidad_id, nombre_taller, whatsapp, direccion_taller, cp_taller]
 *     responses:
 *       201:
 *         description: Taller creado con estado pendiente
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/MiTaller' }
 *       400:
 *         description: Datos inválidos
 *         content:
 *           application/json:
 *             example: { error: "Datos inválidos", detalles: ["comunidad_id no existe", "cp_taller debe tener 5 dígitos"] }
 *       401:
 *         description: Falta el token o no es válido
 *         content:
 *           application/json:
 *             example: { error: "Falta el token de acceso" }
 *       409:
 *         description: El usuario ya tiene un taller
 *         content:
 *           application/json:
 *             example: { error: "Ya tienes un taller registrado" }
 *   get:
 *     tags: [Mi taller]
 *     summary: Datos del taller del usuario, en cualquier estado de verificación
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: El taller
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/MiTaller' }
 *       401:
 *         description: Falta el token o no es válido
 *         content:
 *           application/json:
 *             example: { error: "Token inválido o expirado" }
 *       403:
 *         description: El usuario no tiene taller
 *         content:
 *           application/json:
 *             example: { error: "Primero debes registrar tu taller" }
 *   put:
 *     tags: [Mi taller]
 *     summary: Edita el taller; solo se cambian los campos enviados
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/TallerEntrada' }
 *           example: { biografia: "Alfareras de barro negro desde 1950.", whatsapp: "529511000099" }
 *     responses:
 *       200:
 *         description: Taller actualizado
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/MiTaller' }
 *       400:
 *         description: Datos inválidos o cuerpo vacío
 *         content:
 *           application/json:
 *             example: { error: "Datos inválidos", detalles: ["whatsapp debe tener solo dígitos con lada (10 a 15), por ejemplo 529511234567"] }
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
 * /api/mi-taller/productos:
 *   get:
 *     tags: [Mi taller]
 *     summary: Lista todos los productos del taller, incluidos los inactivos
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Productos del taller, del más reciente al más antiguo
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 allOf:
 *                   - $ref: '#/components/schemas/MiProducto'
 *                   - type: object
 *                     properties:
 *                       imagen: { type: string, nullable: true, description: URL de la imagen principal }
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
 *     tags: [Mi taller]
 *     summary: Crea un producto; el slug se genera del nombre
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             allOf:
 *               - $ref: '#/components/schemas/ProductoEntrada'
 *               - required: [categoria_id, nombre, modo_venta, precio]
 *     responses:
 *       201:
 *         description: Producto creado
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/MiProducto' }
 *       400:
 *         description: Datos inválidos
 *         content:
 *           application/json:
 *             example: { error: "Datos inválidos", detalles: ["stock es obligatorio en productos de precio fijo"] }
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
 * /api/mi-taller/productos/{id}:
 *   parameters:
 *     - { in: path, name: id, required: true, schema: { type: integer }, example: 4 }
 *   get:
 *     tags: [Mi taller]
 *     summary: Detalle de un producto propio con todas sus imágenes
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: El producto
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/MiProducto' }
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
 *             example: { error: "Producto no encontrado en tu taller" }
 *   put:
 *     tags: [Mi taller]
 *     summary: Edita un producto; solo se cambian los campos enviados. Si cambia el nombre, cambia el slug.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/ProductoEntrada' }
 *           example: { precio: 1350, stock: 6 }
 *     responses:
 *       200:
 *         description: Producto actualizado
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/MiProducto' }
 *       400:
 *         description: Datos inválidos o cuerpo vacío
 *         content:
 *           application/json:
 *             example: { error: "Datos inválidos", detalles: ["precio debe ser un número mayor a 0"] }
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
 *             example: { error: "Producto no encontrado en tu taller" }
 *   patch:
 *     tags: [Mi taller]
 *     summary: Activa o desactiva un producto (los productos no se borran)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [activo]
 *             properties:
 *               activo: { type: boolean, example: false }
 *     responses:
 *       200:
 *         description: Producto con su nuevo estado
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/MiProducto' }
 *       400:
 *         description: activo no es booleano
 *         content:
 *           application/json:
 *             example: { error: "activo debe ser true o false" }
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
 *             example: { error: "Producto no encontrado en tu taller" }
 *
 * /api/mi-taller/productos/{id}/imagenes:
 *   post:
 *     tags: [Mi taller]
 *     summary: Sube una foto del producto a Supabase Storage (jpg, png o webp, máximo 5 MB)
 *     description: La primera foto de un producto queda como principal.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer }, example: 4 }
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [imagen]
 *             properties:
 *               imagen: { type: string, format: binary }
 *     responses:
 *       201:
 *         description: Imagen guardada
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ImagenProducto' }
 *       400:
 *         description: No llegó la imagen o el formato no es válido
 *         content:
 *           application/json:
 *             example: { error: "La imagen debe ser jpg, png o webp" }
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
 *         description: El producto no existe o es de otro taller
 *         content:
 *           application/json:
 *             example: { error: "Producto no encontrado en tu taller" }
 *       413:
 *         description: La imagen pesa más de 5 MB
 *         content:
 *           application/json:
 *             example: { error: "La imagen no puede pesar más de 5 MB" }
 *       502:
 *         description: Supabase Storage no aceptó el archivo
 *         content:
 *           application/json:
 *             example: { error: "No se pudo subir la imagen al almacenamiento" }
 *
 * /api/mi-taller/productos/{id}/imagenes/{imagenId}:
 *   delete:
 *     tags: [Mi taller]
 *     summary: Borra una foto; si era la principal, la siguiente pasa a ser principal
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer }, example: 4 }
 *       - { in: path, name: imagenId, required: true, schema: { type: integer }, example: 14 }
 *     responses:
 *       204:
 *         description: Imagen borrada
 *       400:
 *         description: Algún id no es válido
 *         content:
 *           application/json:
 *             example: { error: "El id de la imagen debe ser un número entero positivo" }
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
 *         description: La imagen no es de ese producto
 *         content:
 *           application/json:
 *             example: { error: "Imagen no encontrada en este producto" }
 *
 * /api/mi-taller/productos/{id}/imagenes/{imagenId}/principal:
 *   patch:
 *     tags: [Mi taller]
 *     summary: Marca una foto como la principal del producto
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer }, example: 4 }
 *       - { in: path, name: imagenId, required: true, schema: { type: integer }, example: 15 }
 *     responses:
 *       200:
 *         description: Imágenes del producto, la principal primero
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/ImagenProducto' }
 *       400:
 *         description: Algún id no es válido
 *         content:
 *           application/json:
 *             example: { error: "El id de la imagen debe ser un número entero positivo" }
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
 *         description: La imagen no es de ese producto
 *         content:
 *           application/json:
 *             example: { error: "Imagen no encontrada en este producto" }
 */
router.use(autenticar);

router.post("/", c.crearTaller);
router.get("/", requiereTaller, c.obtenerTaller);
router.put("/", requiereTaller, c.actualizarTaller);

router.get("/productos", requiereTaller, c.listarProductos);
router.post("/productos", requiereTaller, c.crearProducto);
router.get("/productos/:id", requiereTaller, c.obtenerProducto);
router.put("/productos/:id", requiereTaller, c.actualizarProducto);
router.patch("/productos/:id", requiereTaller, c.cambiarActivoProducto);

router.post("/productos/:id/imagenes", requiereTaller, subirImagen, c.agregarImagen);
router.delete("/productos/:id/imagenes/:imagenId", requiereTaller, c.eliminarImagen);
router.patch("/productos/:id/imagenes/:imagenId/principal", requiereTaller, c.marcarImagenPrincipal);

module.exports = router;
