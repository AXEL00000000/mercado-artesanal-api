const { Router } = require("express");
const { registrar, login, perfil } = require("../controllers/auth.controller");
const { autenticar } = require("../middlewares/auth.middleware");

const router = Router();

/**
 * @openapi
 * tags:
 *   - name: Autenticación
 *     description: Registro, inicio de sesión y perfil del usuario
 *
 * components:
 *   schemas:
 *     Usuario:
 *       type: object
 *       properties:
 *         id: { type: integer, example: 1 }
 *         nombre: { type: string, example: Catalina Pérez }
 *         email: { type: string, example: catalina@correo.com }
 *         telefono: { type: string, example: "9511234567" }
 *         rol: { type: string, enum: [usuario, admin], example: usuario }
 *     Sesion:
 *       type: object
 *       properties:
 *         usuario: { $ref: '#/components/schemas/Usuario' }
 *         token: { type: string, example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... }
 *
 * /api/auth/registro:
 *   post:
 *     tags: [Autenticación]
 *     summary: Crea una cuenta nueva y devuelve su token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nombre, email, password]
 *             properties:
 *               nombre: { type: string, example: Catalina Pérez }
 *               email: { type: string, example: catalina@correo.com }
 *               password: { type: string, minLength: 8, example: barronegro2026 }
 *               telefono: { type: string, example: "9511234567" }
 *     responses:
 *       201:
 *         description: Cuenta creada
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Sesion' }
 *       400:
 *         description: Datos inválidos
 *         content:
 *           application/json:
 *             example: { error: "Datos inválidos", detalles: ["email no es válido", "password debe tener al menos 8 caracteres"] }
 *       409:
 *         description: Ya existe una cuenta con ese email
 *         content:
 *           application/json:
 *             example: { error: "Ya existe una cuenta con ese email" }
 *
 * /api/auth/login:
 *   post:
 *     tags: [Autenticación]
 *     summary: Inicia sesión y devuelve un token JWT
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, example: catalina@correo.com }
 *               password: { type: string, example: barronegro2026 }
 *     responses:
 *       200:
 *         description: Sesión iniciada
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Sesion' }
 *       401:
 *         description: Email o contraseña incorrectos
 *         content:
 *           application/json:
 *             example: { error: "Email o contraseña incorrectos" }
 *       403:
 *         description: La cuenta está desactivada
 *         content:
 *           application/json:
 *             example: { error: "La cuenta está desactivada" }
 *
 * /api/auth/perfil:
 *   get:
 *     tags: [Autenticación]
 *     summary: Datos del usuario que inició sesión, con su taller si tiene
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Perfil del usuario
 *         content:
 *           application/json:
 *             example:
 *               id: 1
 *               nombre: Catalina Pérez
 *               email: catalina@correo.com
 *               telefono: "9511234567"
 *               rol: usuario
 *               productor: { id: 1, nombre_taller: Barro Negro Doña Catalina, estado_verificacion: aprobado }
 *       401:
 *         description: Falta el token o no es válido
 *         content:
 *           application/json:
 *             example: { error: "Falta el token de acceso" }
 */
router.post("/registro", registrar);
router.post("/login", login);
router.get("/perfil", autenticar, perfil);

module.exports = router;
