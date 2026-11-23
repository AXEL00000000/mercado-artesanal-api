const { query } = require("../config/db");

const CAMPOS = "id, productor_id, tipo, costo_fijo, instrucciones, activo";

const listarDeProductor = async (productorId, soloActivas) => {
  const { rows } = await query(
    `SELECT ${CAMPOS}
       FROM opcion_entrega
      WHERE productor_id = $1 AND (NOT $2 OR activo)
      ORDER BY id`,
    [productorId, soloActivas]
  );
  return rows;
};

const buscar = async (id, productorId) => {
  const { rows } = await query(
    `SELECT ${CAMPOS} FROM opcion_entrega WHERE id = $1 AND productor_id = $2`,
    [id, productorId]
  );
  return rows[0] || null;
};

const buscarPorTipo = async (productorId, tipo) => {
  const { rows } = await query(
    `SELECT ${CAMPOS} FROM opcion_entrega WHERE productor_id = $1 AND tipo = $2`,
    [productorId, tipo]
  );
  return rows[0] || null;
};

const crear = async (productorId, { tipo, costo_fijo, instrucciones, activo }) => {
  const { rows } = await query(
    `INSERT INTO opcion_entrega (productor_id, tipo, costo_fijo, instrucciones, activo)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING ${CAMPOS}`,
    [productorId, tipo, costo_fijo ?? null, instrucciones ?? null, activo ?? true]
  );
  return rows[0];
};

const COLUMNAS_EDITABLES = ["costo_fijo", "instrucciones", "activo"];

const actualizar = async (id, cambios) => {
  const columnas = COLUMNAS_EDITABLES.filter((c) => cambios[c] !== undefined);
  const sets = columnas.map((c, i) => `${c} = $${i + 2}`);
  const { rows } = await query(
    `UPDATE opcion_entrega SET ${sets.join(", ")} WHERE id = $1 RETURNING ${CAMPOS}`,
    [id, ...columnas.map((c) => cambios[c])]
  );
  return rows[0];
};

const estaEnUso = async (id) => {
  const { rows } = await query("SELECT EXISTS (SELECT 1 FROM envio WHERE opcion_entrega_id = $1) AS en_uso", [id]);
  return rows[0].en_uso;
};

const eliminar = (id) => query("DELETE FROM opcion_entrega WHERE id = $1", [id]);

module.exports = { listarDeProductor, buscar, buscarPorTipo, crear, actualizar, estaEnUso, eliminar };
