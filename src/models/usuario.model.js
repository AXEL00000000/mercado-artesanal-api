const { query } = require("../config/db");

const crear = async ({ nombre, email, passwordHash, telefono }) => {
  const { rows } = await query(
    `INSERT INTO usuario (nombre, email, password_hash, telefono)
     VALUES ($1, $2, $3, $4)
     RETURNING id, nombre, email, telefono, rol, created_at`,
    [nombre, email, passwordHash, telefono || null]
  );
  return rows[0];
};

// Incluye password_hash: solo para el login
const buscarPorEmail = async (email) => {
  const { rows } = await query(
    `SELECT id, nombre, email, password_hash, telefono, rol, activo
       FROM usuario
      WHERE email = $1`,
    [email]
  );
  return rows[0] || null;
};

// Usuario con su taller, si tiene
const buscarPorId = async (id) => {
  const { rows } = await query(
    `SELECT u.id, u.nombre, u.email, u.telefono, u.rol, u.activo, u.created_at,
            pr.id AS productor_id, pr.nombre_taller, pr.estado_verificacion
       FROM usuario u
       LEFT JOIN productor pr ON pr.usuario_id = u.id
      WHERE u.id = $1`,
    [id]
  );
  const fila = rows[0];
  if (!fila) return null;

  const { productor_id, nombre_taller, estado_verificacion, ...usuario } = fila;
  usuario.productor = productor_id
    ? { id: productor_id, nombre_taller, estado_verificacion }
    : null;
  return usuario;
};

module.exports = { crear, buscarPorEmail, buscarPorId };
