const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Usuario = require("../models/usuario.model");
const HttpError = require("../utils/HttpError");

const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TELEFONO_VALIDO = /^[0-9]{10,15}$/;

const generarToken = (usuario) =>
  jwt.sign({ sub: usuario.id, rol: usuario.rol }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

const registrar = async ({ nombre, email, password, telefono }) => {
  const errores = [];
  if (!nombre || !nombre.trim()) errores.push("nombre es obligatorio");
  if (!email || !EMAIL_VALIDO.test(email.trim())) errores.push("email no es válido");
  if (!password || password.length < 8) errores.push("password debe tener al menos 8 caracteres");
  if (telefono && !TELEFONO_VALIDO.test(telefono)) errores.push("telefono debe tener solo dígitos (10 a 15)");
  if (errores.length) throw new HttpError(400, "Datos inválidos", errores);

  const emailNormalizado = email.trim().toLowerCase();
  if (await Usuario.buscarPorEmail(emailNormalizado)) {
    throw new HttpError(409, "Ya existe una cuenta con ese email");
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const usuario = await Usuario.crear({
    nombre: nombre.trim(),
    email: emailNormalizado,
    passwordHash,
    telefono,
  });

  return { usuario, token: generarToken(usuario) };
};

const login = async ({ email, password }) => {
  if (!email || !password) throw new HttpError(400, "email y password son obligatorios");

  const usuario = await Usuario.buscarPorEmail(email.trim().toLowerCase());
  const coincide = usuario && (await bcrypt.compare(password, usuario.password_hash));
  if (!coincide) throw new HttpError(401, "Email o contraseña incorrectos");
  if (!usuario.activo) throw new HttpError(403, "La cuenta está desactivada");

  const { password_hash, activo, ...datos } = usuario;
  return { usuario: datos, token: generarToken(usuario) };
};

const perfil = async (id) => {
  const usuario = await Usuario.buscarPorId(id);
  if (!usuario) throw new HttpError(404, "Usuario no encontrado");
  return usuario;
};

module.exports = { registrar, login, perfil };
