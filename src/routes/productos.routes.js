const { Router } = require("express");
const { listar, obtener } = require("../controllers/producto.controller");

const router = Router();

/**
 * @openapi
 * tags:
 *   - name: Productos
 *     description: Catálogo público de piezas
 *
 * components:
 *   schemas:
 *     ProductoTarjeta:
 *       type: object
 *       properties:
 *         id: { type: integer, example: 3 }
 *         nombre: { type: string, example: Cántaro de barro negro }
 *         slug: { type: string, example: cantaro-de-barro-negro }
 *         precio: { type: number, example: 1200 }
 *         modo_venta: { type: string, enum: [fijo, tratar], example: fijo }
 *         stock: { type: integer, nullable: true, example: 4 }
 *         imagen: { type: string, nullable: true, example: https://placehold.co/800x800?text=Cantaro }
 *         categoria:
 *           type: object
 *           properties:
 *             slug: { type: string, example: alfareria-y-ceramica }
 *             nombre: { type: string, example: Alfarería y cerámica }
 *         productor:
 *           type: object
 *           properties:
 *             id: { type: integer, example: 2 }
 *             nombre_taller: { type: string, example: Barro Negro Doña Catalina }
 *         comunidad:
 *           type: object
 *           properties:
 *             id: { type: integer, example: 1 }
 *             nombre: { type: string, example: San Bartolo Coyotepec }
 *             region: { type: string, example: Valles Centrales }
 *
 * /api/productos:
 *   get:
 *     tags: [Productos]
 *     summary: Lista los productos activos con filtros y paginación
 *     parameters:
 *       - { in: query, name: categoria, schema: { type: string }, description: Slug de la categoría, example: textiles }
 *       - { in: query, name: comunidad, schema: { type: integer }, description: Id de la comunidad }
 *       - { in: query, name: region, schema: { type: string }, example: Valles Centrales }
 *       - { in: query, name: productor, schema: { type: integer }, description: Id del taller }
 *       - { in: query, name: modo, schema: { type: string, enum: [fijo, tratar] } }
 *       - { in: query, name: q, schema: { type: string }, description: Busca en nombre y descripción, example: barro }
 *       - { in: query, name: orden, schema: { type: string, enum: [recientes, precio_asc, precio_desc], default: recientes } }
 *       - { in: query, name: pagina, schema: { type: integer, default: 1 } }
 *       - { in: query, name: limite, schema: { type: integer, default: 12, maximum: 50 } }
 *     responses:
 *       200:
 *         description: Página de productos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 pagina: { type: integer, example: 1 }
 *                 limite: { type: integer, example: 12 }
 *                 total: { type: integer, example: 10 }
 *                 total_paginas: { type: integer, example: 1 }
 *                 productos:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/ProductoTarjeta' }
 *       400:
 *         description: Algún filtro no es válido
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *
 * /api/productos/{slug}:
 *   get:
 *     tags: [Productos]
 *     summary: Detalle de un producto con sus fotos, su taller y el enlace de WhatsApp
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema: { type: string }
 *         example: cantaro-de-barro-negro
 *     responses:
 *       200:
 *         description: El producto
 *         content:
 *           application/json:
 *             example:
 *               id: 3
 *               nombre: Cántaro de barro negro
 *               slug: cantaro-de-barro-negro
 *               descripcion: Modelado a mano y bruñido con piedra de cuarzo.
 *               modo_venta: fijo
 *               precio: 1200
 *               stock: 4
 *               material: Barro de Coyotepec
 *               tecnica: Bruñido
 *               peso_g: 2500
 *               medidas_cm: { alto: 32, ancho: 22, largo: 22 }
 *               imagenes: [{ id: 3, url: "https://placehold.co/800x800?text=Cantaro", orden: 0, es_principal: true }]
 *               categoria: { slug: alfareria-y-ceramica, nombre: Alfarería y cerámica }
 *               productor: { id: 2, nombre_taller: Barro Negro Doña Catalina, artesano: Catalina Pérez, whatsapp: "529511000002" }
 *               comunidad: { id: 1, nombre: San Bartolo Coyotepec, municipio: San Bartolo Coyotepec, region: Valles Centrales }
 *               whatsapp_url: https://wa.me/529511000002?text=Hola%2C%20me%20interesa...
 *       404:
 *         description: No existe o no está disponible
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.get("/", listar);
router.get("/:slug", obtener);

module.exports = router;
